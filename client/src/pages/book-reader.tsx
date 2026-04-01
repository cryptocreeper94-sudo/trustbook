import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, ChevronLeft, ChevronRight, Menu, X, Home, Lock,
  BookMarked, ScrollText, FileText, ExternalLink, Volume2, VolumeX, Pause, Play, Download, ArrowLeft, spark, Loader2
} from "lucide-react";
import { Link, useRoute } from "wouter";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

type Chapter = {
  id: string;
  title: string;
  content: string;
  partTitle?: string;
};

type TocVolume = {
  id: string;
  title: string;
  subtitle: string;
  chapters: { id: string; title: string; partTitle?: string }[];
};

export default function BookReader() {
  const [, params] = useRoute("/:slug/read");
  const slug = params?.slug || "";
  
  const [toc, setToc] = useState<TocVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chapterCacheRef = useRef<Map<string, Chapter>>(new Map());
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null);
  
  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useAIVoice, setUseAIVoice] = useState(true);
  
  // Audio state
  const audioUnlockedRef = useRef(false);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const webAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const webAudioStartTimeRef = useRef(0);
  const webAudioOffsetRef = useRef(0);
  const webAudioBufferRef = useRef<AudioBuffer | null>(null);
  const aiChunksRef = useRef<string[]>([]);
  const aiChunkIndexRef = useRef(0);
  const aiPlayingRef = useRef(false);
  const aiCancelledRef = useRef(false);
  const audioPlayResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    document.title = `Reading ${slug} | TrustBook`;
    
    // Setup AudioContext on mobile
    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      try {
        if (!webAudioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          webAudioCtxRef.current = new AudioContextClass();
        }
        if (webAudioCtxRef.current.state === 'suspended') {
          webAudioCtxRef.current.resume();
        }
        
        const buffer = webAudioCtxRef.current.createBuffer(1, 1, 22050);
        const source = webAudioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(webAudioCtxRef.current.destination);
        source.start(0);
        
        audioUnlockedRef.current = true;
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      } catch (e) {
        console.error("Audio unlock failed:", e);
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      stopAudio();
    };
  }, [slug]);

  useEffect(() => {
    const fetchToc = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/ebook/catalog/${slug}/toc`);
        if (!res.ok) throw new Error("Failed to load book table of contents. Are you sure you bought it?");
        const data = await res.json();
        setToc(data);
        if (data.length > 0) {
          loadChapter(0, 0, data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchToc();
  }, [slug]);

  const loadChapter = async (volIdx: number, chapIdx: number, tocData = toc) => {
    if (!tocData[volIdx] || !tocData[volIdx].chapters[chapIdx]) return;
    
    setIsPlaying(false);
    setIsPaused(false);
    stopAudio();
    
    setCurrentVolume(volIdx);
    setCurrentChapter(chapIdx);
    
    const cacheKey = `${volIdx}-${chapIdx}`;
    if (chapterCacheRef.current.has(cacheKey)) {
      setChapterContent(chapterCacheRef.current.get(cacheKey) || null);
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      setChapterLoading(true);
      const res = await fetch(`/api/ebook/catalog/${slug}/chapter/${volIdx}/${chapIdx}`);
      if (!res.ok) throw new Error("Failed to load chapter content");
      const data = await res.json();
      
      chapterCacheRef.current.set(cacheKey, data);
      setChapterContent(data);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setChapterLoading(false);
    }
  };

  const splitTextIntoChunks = (text: string, maxLen = 300) => {
    const cleanText = text.replace(/\\*\\*/g, '')
                        .replace(/\\*/g, '')
                        .replace(/#/g, '')
                        .replace(/\\[.*?\\]\\(.*?\\)/g, '')
                        .replace(/>/g, '')
                        .replace(/<[^>]*>?/gm, '');

    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      
      if ((currentChunk.length + trimmed.length) < maxLen) {
        currentChunk += (currentChunk ? " " : "") + trimmed;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (trimmed.length > maxLen) {
          const words = trimmed.split(' ');
          let temp = "";
          for (const word of words) {
            if ((temp.length + word.length) < maxLen) {
              temp += (temp ? " " : "") + word;
            } else {
              if (temp) chunks.push(temp);
              temp = word;
            }
          }
          currentChunk = temp;
        } else {
          currentChunk = trimmed;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  // Modern Audio Implementation via WebAudioAPI
  const playWebAudioBuffer = (arrayBuffer: ArrayBuffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!webAudioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          webAudioCtxRef.current = new AudioContextClass();
        }
        
        if (webAudioCtxRef.current.state === 'suspended') {
          webAudioCtxRef.current.resume();
        }

        webAudioCtxRef.current.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            if (aiCancelledRef.current) {
              resolve();
              return;
            }
            
            webAudioBufferRef.current = buffer;
            const source = webAudioCtxRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(webAudioCtxRef.current!.destination);
            
            webAudioSourceRef.current = source;
            webAudioStartTimeRef.current = webAudioCtxRef.current!.currentTime;
            
            source.onended = () => {
              if (!isPaused && !aiCancelledRef.current) {
                resolve();
              }
            };
            
            source.start(0, webAudioOffsetRef.current);
            audioPlayResolveRef.current = resolve;
          },
          (err) => {
            console.error("Audio decode error:", err);
            reject(err);
          }
        );
      } catch (err) {
        console.error("Web audio setup error:", err);
        reject(err);
      }
    });
  };

  const playAIChunk = async (index: number) => {
    if (index >= aiChunksRef.current.length || aiCancelledRef.current) {
      setIsPlaying(false);
      setIsPaused(false);
      aiPlayingRef.current = false;
      webAudioOffsetRef.current = 0;
      return;
    }

    aiChunkIndexRef.current = index;
    const text = aiChunksRef.current[index];
    
    // Add wait time logic
    const fetchDelayMs = 200;
    
    try {
      webAudioOffsetRef.current = 0;
      
      const payload = {
        text: text,
        voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
      };

      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (aiCancelledRef.current) return;
      
      await new Promise(res => setTimeout(res, fetchDelayMs));
      
      if (aiCancelledRef.current) return;
      
      await playWebAudioBuffer(arrayBuffer);
      
      if (aiCancelledRef.current) return;
      
      // We didn't cancel, we're not paused, so proceed to next
      if (!isPaused) {
        playAIChunk(index + 1);
      }
    } catch (err) {
      console.error('Text-to-speech play error:', err);
      // Skip chunk on error
      if (!aiCancelledRef.current) {
        playAIChunk(index + 1);
      }
    }
  };

  const startAudio = () => {
    if (!chapterContent) return;
    
    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
      if (webAudioBufferRef.current && webAudioCtxRef.current) {
        try {
          if (webAudioSourceRef.current) {
            webAudioSourceRef.current.disconnect();
          }
          
          const source = webAudioCtxRef.current.createBufferSource();
          source.buffer = webAudioBufferRef.current;
          source.connect(webAudioCtxRef.current.destination);
          
          webAudioSourceRef.current = source;
          webAudioStartTimeRef.current = webAudioCtxRef.current.currentTime;
          
          source.onended = () => {
            if (!isPaused && !aiCancelledRef.current) {
              if (audioPlayResolveRef.current) {
                audioPlayResolveRef.current();
              }
              playAIChunk(aiChunkIndexRef.current + 1);
            }
          };
          
          source.start(0, webAudioOffsetRef.current);
        } catch (e) {
          console.error("Resume audio error:", e);
        }
      }
      return;
    }

    setIsLoading(true);
    const content = chapterContent.title + ". " + (chapterContent.partTitle ? chapterContent.partTitle + ". " : "") + chapterContent.content;
    const chunks = splitTextIntoChunks(content);
    
    aiChunksRef.current = chunks;
    aiChunkIndexRef.current = 0;
    aiCancelledRef.current = false;
    aiPlayingRef.current = true;
    webAudioOffsetRef.current = 0;
    
    setIsLoading(false);
    setIsPlaying(true);
    setIsPaused(false);
    
    playAIChunk(0);
  };

  const pauseAudio = () => {
    setIsPaused(true);
    setIsPlaying(false);
    
    if (webAudioSourceRef.current && webAudioCtxRef.current) {
      try {
        const elapsedTime = webAudioCtxRef.current.currentTime - webAudioStartTimeRef.current;
        webAudioOffsetRef.current = (webAudioOffsetRef.current + elapsedTime) % (webAudioBufferRef.current?.duration || 1);
        
        webAudioSourceRef.current.stop();
        webAudioSourceRef.current.disconnect();
      } catch (e) {
        console.error("Pause audio error:", e);
      }
    }
  };

  const stopAudio = () => {
    setIsPlaying(false);
    setIsPaused(false);
    aiCancelledRef.current = true;
    aiPlayingRef.current = false;
    
    if (webAudioSourceRef.current) {
      try {
        webAudioSourceRef.current.stop();
        webAudioSourceRef.current.disconnect();
      } catch (e) { }
    }
    webAudioOffsetRef.current = 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-white tracking-wider">Loading Reader...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
                    {/* ── Animate This Chapter ── */}
              <div className="mt-12 mb-8 border-t border-white/10 pt-8">
                <div className="p-6 text-center rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/20">
                  <div className="text-2xl mb-2">✨</div>
                  <h3 className="text-lg font-bold text-white mb-2">Animate This Chapter</h3>
                  <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
                    Turn this chapter into a cinematic animated documentary with AI narration, scenes & music.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={`https://trustgen.tlid.io/studio?mode=story&book=${slug}&tier=standard`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:from-cyan-400 hover:to-teal-400 transition"
                    >
                      Standard — $3.99/ch
                    </a>
                    <a
                      href={`https://trustgen.tlid.io/studio?mode=story&book=${slug}&tier=premium`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm hover:from-purple-400 hover:to-pink-400 transition"
                    >
                      Premium HD — $6.99/ch
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Full book from $19.99 · Unlimited $24.99/mo
                  </p>
                </div>
              </div>
</main>
    </div>
  );
}

