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
      <div className="min-h-screen bg-black flex items-center justify-center p-4 flex-col text-center space-y-4">
        <Lock className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 max-w-sm">{error}</p>
        <Link href="/catalog">
          <Button variant="outline" className="mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            Return to Store
          </Button>
        </Link>
      </div>
    );
  }

  const hasNext = currentVolume < toc.length - 1 || currentChapter < toc[currentVolume].chapters.length - 1;
  const hasPrev = currentVolume > 0 || currentChapter > 0;

  const goNext = () => {
    if (currentChapter < toc[currentVolume].chapters.length - 1) {
      loadChapter(currentVolume, currentChapter + 1);
    } else if (currentVolume < toc.length - 1) {
      loadChapter(currentVolume + 1, 0);
    }
  };

  const goPrev = () => {
    if (currentChapter > 0) {
      loadChapter(currentVolume, currentChapter - 1);
    } else if (currentVolume > 0) {
      loadChapter(currentVolume - 1, toc[currentVolume - 1].chapters.length - 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 font-serif">
      {/* Decorative gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[50vh] h-[50vh] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[60vh] h-[60vh] bg-cyan-900/10 rounded-full blur-[150px]" />
      </div>

      {/* Top Navigation Bar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white/90 uppercase tracking-widest">{slug.replace(/-/g, ' ')}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Audio Player Controls */}
          <div className="bg-white/5 rounded-full p-1 flex items-center mr-2 border border-white/10">
            {isLoading ? (
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" disabled>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              </Button>
            ) : isPlaying ? (
              <Button variant="ghost" size="icon" onClick={pauseAudio} className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
                <Pause className="w-4 h-4 text-cyan-400" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={startAudio} className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-300">
                <Play className="w-4 h-4 ml-0.5" />
              </Button>
            )}
            
            {(isPlaying || isPaused) && (
              <Button variant="ghost" size="icon" onClick={stopAudio} className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-400">
                <Square className="w-3.5 h-3.5" />
              </Button>
            )}
            
            <div className="px-3 border-l border-white/10 ml-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                 {isPlaying ? 'Reading' : 'Audio Book'}
              </span>
            </div>
          </div>

          <Link href="/catalog">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* Sidebar TOC */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0a0a0a] border-r border-white/10 z-50 flex flex-col pt-16"
            >
              <div className="absolute top-0 inset-x-0 h-16 border-b border-white/10 flex items-center px-4 justify-between bg-black/40">
                <h2 className="text-sm font-bold tracking-widest uppercase text-white/90">Contents</h2>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {toc.map((vol, vIdx) => (
                  <div key={vol.id} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">{vol.title}</h3>
                    <div className="text-lg text-white mb-3 font-medium">{vol.subtitle}</div>
                    
                    <div className="space-y-1">
                      {vol.chapters.map((chap, cIdx) => {
                        const isCurrent = currentVolume === vIdx && currentChapter === cIdx;
                        return (
                          <button
                            key={chap.id}
                            onClick={() => {
                              loadChapter(vIdx, cIdx);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex flex-col ${
                              isCurrent 
                                ? "bg-cyan-500/10 border border-cyan-500/20" 
                                : "hover:bg-white/5 border border-transparent"
                            }`}
                          >
                            <span className={`text-xs tracking-wider uppercase mb-0.5 ${isCurrent ? "text-cyan-400 font-bold" : "text-slate-500"}`}>
                              {chap.title}
                            </span>
                            {chap.partTitle && (
                              <span className={`text-sm ${isCurrent ? "text-white" : "text-slate-300"}`}>
                                {chap.partTitle}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-white/10 bg-black/40">
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
                    <Home className="w-4 h-4 mr-2" /> Back to TrustBook
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="pt-24 pb-32 px-4 sm:px-8 md:px-12 max-w-3xl mx-auto min-h-screen relative z-10 transition-all duration-300">
        
        {chapterLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin opacity-50" />
            <p className="text-sm tracking-widest text-slate-400 uppercase">Loading text</p>
          </div>
        ) : chapterContent ? (
          <motion.div
            key={`${currentVolume}-${currentChapter}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed prose-h1:text-4xl prose-h1:font-bold prose-h1:text-white prose-h2:text-2xl prose-h2:text-cyan-300 prose-h3:text-purple-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300"
          >
            <div className="mb-12 text-center">
              <span className="text-sm font-bold tracking-widest text-cyan-400 uppercase mb-2 block object-contain">
                {toc[currentVolume]?.subtitle}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
                {chapterContent.title}
              </h1>
              {chapterContent.partTitle && (
                <div className="text-xl text-slate-400 italic">
                  {chapterContent.partTitle}
                </div>
              )}
              <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mt-8 rounded-full" />
            </div>

            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw, rehypeSlug]}
            >
              {chapterContent.content}
            </ReactMarkdown>
          </motion.div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            Select a chapter to begin reading
          </div>
        )}
        
        {/* Navigation Footer */}
        <div className="mt-20 pt-8 border-t border-white/10 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={goPrev}
            disabled={!hasPrev || chapterLoading}
            className={`${!hasPrev ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={goNext}
            disabled={!hasNext || chapterLoading}
            className={`${!hasNext ? 'opacity-0 pointer-events-none' : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'}`}
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}

