import { useEffect, useState, useRef } from "react";
import { KenBurnsHero } from "@/components/ken-burns-hero";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  BookOpen, Headphones, Download, Shield, Sparkles,
  Eye, Star, ArrowRight, Mic, Wifi, Globe, Users,
  FileText, Smartphone, Lock, Zap, ChevronRight, ChevronDown,
  BookMarked, Volume2, Layers, Award, Heart, Upload, Loader2,
  PenTool, DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  Library, Bot, Send, Plus, Search, Filter, Grid3X3, List,
  Bookmark, BarChart3, Pen, MessageSquare, Trash2,
  CreditCard, TrendingUp, Banknote, ExternalLink
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/glass-card";
import { BOOK_CATEGORIES } from "@shared/schema";

// Ken Burns slideshow replaces static hero
const featuredImg = "/images/trust-book-featured.jpg";
const readerImg = "/images/trust-book-reader.jpg";
const audioImg = "/images/trust-book-audio.jpg";

const PLATFORM_FEATURES = [
  { icon: BookOpen, title: "Immersive E-Reader", desc: "Full-screen reading with adjustable fonts, themes, and progress tracking across all devices.", gradient: "from-cyan-500 to-blue-600", image: "/images/feature-ereader.png" },
  { icon: Headphones, title: "AI Narration", desc: "Every book narrated by premium AI voices. Listen while you commute, exercise, or unwind.", gradient: "from-purple-500 to-pink-600", image: "/images/feature-narration.png" },
  { icon: Download, title: "Multi-Format", desc: "Read online, download PDF, or export EPUB. Your library, your format, your choice.", gradient: "from-purple-500 to-cyan-600", image: "/images/feature-multiformat.png" },
  { icon: Smartphone, title: "Mobile-First PWA", desc: "Install on any device. Works offline. True app experience without the app store.", gradient: "from-emerald-500 to-teal-600", image: "/images/feature-mobile.png" },
  { icon: Shield, title: "Blockchain Verified", desc: "Every publication timestamped on the Trust Layer blockchain. Provenance you can verify.", gradient: "from-red-500 to-rose-600", image: "/images/feature-blockchain.png" },
  { icon: Users, title: "Author Publishing", desc: "Publish your own work. Transparent royalties tracked on-chain. No gatekeepers.", gradient: "from-indigo-500 to-violet-600", image: "/images/feature-publishing.png" },
];

const READER_STATS = [
  { value: "107K+", label: "Words", icon: FileText },
  { value: "54+", label: "Chapters", icon: BookMarked },
  { value: "15", label: "Volumes", icon: Layers },
  { value: "$4.99", label: "Full Book", icon: DollarSign },
];

const TESTIMONIALS = [
  { text: "This changes everything you thought you knew.", rating: 5 },
  { text: "Documentary-style investigation at its finest.", rating: 5 },
  { text: "The dots connect in ways you never imagined.", rating: 5 },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  draft: { icon: Clock, color: 'text-slate-400', label: 'Draft' },
  pending_review: { icon: AlertCircle, color: 'text-purple-400', label: 'Pending Review' },
  approved: { icon: CheckCircle, color: 'text-emerald-400', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', label: 'Rejected' },
  published: { icon: CheckCircle, color: 'text-cyan-400', label: 'Published' },
};

const TABS = [
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'browse', label: 'Browse', icon: Grid3X3 },
  { id: 'library', label: 'My Library', icon: Library },
  { id: 'write', label: 'Write', icon: PenTool },
  { id: 'publish', label: 'Publish', icon: Upload },
];

function AuthorEarningsDashboard({ userId }: { userId: string }) {
  const [connectLoading, setConnectLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ["/api/ebook/author/dashboard"],
    queryFn: async () => {
      const res = await authFetch("/api/ebook/author/dashboard");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: connectStatus, refetch: refetchConnect } = useQuery({
    queryKey: ["/api/ebook/author/connect-status"],
    queryFn: async () => {
      const res = await authFetch("/api/ebook/author/connect-status");
      if (!res.ok) return { connected: false, onboardingComplete: false };
      return res.json();
    },
    enabled: !!userId,
  });

  const handleConnectOnboarding = async () => {
    setConnectLoading(true);
    setErrorMessage(null);
    try {
      const res = await authFetch("/api/ebook/author/connect-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: dashboard?.profile?.displayName || "Author" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Failed to start bank account setup. Please try again.");
      }
    } catch (err) {
      setErrorMessage("Connection error. Please check your internet and try again.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authFetch("/api/ebook/author/request-payout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Payout of $${(data.amount / 100).toFixed(2)} sent to your bank! (${data.salesCount} sale${data.salesCount > 1 ? 's' : ''})`);
        refetch();
      } else {
        setErrorMessage(data.message || "Payout failed. Please try again later.");
      }
    } catch (err) {
      setErrorMessage("Connection error. Your earnings are safe — please try again.");
    } finally {
      setPayoutLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "complete") {
      refetchConnect();
      refetch();
      setSuccessMessage("Bank account connected successfully!");
    }
  }, []);

  const stats = dashboard?.stats;
  const hasEarnings = stats && stats.totalSales > 0;

  return (
    <GlassCard glow className="mb-6">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg" data-testid="text-author-earnings-title">Author Earnings</h3>
            <p className="text-xs text-white/40">70% royalty on every sale. Get paid directly to your bank.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs">Total Sales</p>
                <p className="text-xl font-bold text-white" data-testid="text-total-sales">{stats?.totalSales || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs">Total Royalties</p>
                <p className="text-xl font-bold text-emerald-400" data-testid="text-total-royalties">
                  ${((stats?.totalRoyalties || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs">Pending Payout</p>
                <p className="text-xl font-bold text-purple-400" data-testid="text-pending-payout">
                  ${((stats?.pendingPayout || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs">Paid Out</p>
                <p className="text-xl font-bold text-cyan-400" data-testid="text-paid-out">
                  ${((stats?.paidOut || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{errorMessage}</p>
                <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">Dismiss</button>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300">{successMessage}</p>
                <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-400 hover:text-emerald-300 text-xs">Dismiss</button>
              </div>
            )}

            {!connectStatus?.onboardingComplete ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 mb-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">Set Up Payouts</p>
                    <p className="text-xs text-white/50 mb-3">
                      Connect your bank account through Stripe to receive your royalties directly. 
                      Payouts are processed after a 7-day settlement period.
                    </p>
                    <Button
                      onClick={handleConnectOnboarding}
                      disabled={connectLoading}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 text-black font-semibold"
                      data-testid="button-connect-stripe"
                    >
                      {connectLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                      Connect Bank Account
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm text-emerald-300 font-medium">Payouts Connected</p>
                  <p className="text-xs text-white/40">Your bank account is linked. Royalties are deposited automatically.</p>
                </div>
                {(stats?.eligibleNow || 0) > 0 && (
                  <Button
                    onClick={handleRequestPayout}
                    disabled={payoutLoading}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid="button-request-payout"
                  >
                    {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4 mr-1" />}
                    Withdraw ${((stats?.eligibleNow || 0) / 100).toFixed(2)}
                  </Button>
                )}
              </div>
            )}

            {hasEarnings && dashboard.recentEarnings?.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2 font-medium">Recent Sales</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dashboard.recentEarnings.slice(0, 5).map((earning: any) => (
                    <div key={earning.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm" data-testid={`earning-row-${earning.id}`}>
                      <div className="flex items-center gap-2">
                        <Badge className={earning.status === "paid" ? "bg-emerald-500/20 text-emerald-400 text-xs" : "bg-purple-500/20 text-purple-400 text-xs"}>
                          {earning.status}
                        </Badge>
                        <span className="text-white/60 text-xs">Book #{earning.bookId}</span>
                      </div>
                      <span className="text-emerald-400 font-medium">+${(earning.authorEarningsCents / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}

function BookCard({ book }: { book: any }) {
  const getCover = () => {
    if (book.coverImageUrl) return book.coverImageUrl;
    if (book.category === 'fiction') return '/images/cover-placeholder-fiction.png';
    if (book.subcategory?.toLowerCase().includes('investig')) return '/images/cover-placeholder-investigation.png';
    if (book.subcategory?.toLowerCase().includes('tech')) return '/images/cover-placeholder-technology.png';
    return '/images/cover-placeholder-nonfiction.png';
  };

  return (
    <Link href={`/${book.slug || book.id}/read`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="w-[200px] sm:w-[240px] shrink-0 snap-start group cursor-pointer"
      >
        <div className="relative h-[280px] sm:h-[320px] rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/40 transition-all duration-500 bg-slate-900/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]">
          <div className="absolute inset-0 z-0">
            <img src={getCover()} alt={book.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
          </div>
          <div className="relative z-10 p-4 flex flex-col justify-end h-full">
            <div className="flex gap-1.5 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">
                {book.price === 0 ? "Free" : `$${(book.price / 100).toFixed(2)}`}
              </Badge>
              {parseFloat(book.rating) > 0 && (
                <Badge className="bg-purple-500/20 text-purple-300 border-none gap-0.5 text-[10px]">
                  <Star className="w-2.5 h-2.5 fill-purple-300" />{parseFloat(book.rating).toFixed(1)}
                </Badge>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-display font-bold text-white leading-snug mb-1 line-clamp-2 group-hover:text-cyan-300 transition-colors">
              {book.title}
            </h4>
            <p className="text-[11px] text-white/40 truncate mb-2">by {book.authorName}</p>
            <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">{book.description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function TrustBook() {
  const [activeTab, setActiveTab] = useState('discover');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [userLibrary, setUserLibrary] = useState<any[]>([]);
  const [userPurchases, setUserPurchases] = useState<any[]>([]);
  const [writingSessions, setWritingSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionGenre, setNewSessionGenre] = useState('');
  const [newSessionCategory, setNewSessionCategory] = useState('nonfiction');
  const [showNewSession, setShowNewSession] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [submitForm, setSubmitForm] = useState({
    title: '', description: '', genre: '', category: 'nonfiction', subcategory: '', price: '499', tags: '',
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.setAttribute("href", "/manifest-trustbook.webmanifest");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", "#06b6d4");

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.id) {
            setUserId(data.user.id);
            fetchUserData(data.user.id);
          }
        }
      } catch {}
    };
    checkAuth();
    fetchCatalog();
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const fetchUserData = async (uid: string) => {
    try {
      const [booksRes, libRes, purchasesRes, sessionsRes] = await Promise.all([
        fetch(`/api/ebook/my-books?authorId=${uid}`),
        fetch(`/api/ebook/library?userId=${uid}`),
        fetch(`/api/ebook/access/through-the-veil?userId=${uid}`),
        fetch(`/api/ebook/writing-sessions?userId=${uid}`),
      ]);
      if (booksRes.ok) setMyBooks(await booksRes.json());
      if (libRes.ok) setUserLibrary(await libRes.json());
      if (sessionsRes.ok) setWritingSessions(await sessionsRes.json());
    } catch {}
  };

  const fetchCatalog = async (category?: string, subcategory?: string) => {
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (subcategory) params.set('subcategory', subcategory);
      const res = await fetch(`/api/ebook/catalog/browse?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0 && !category) {
          // Auto-seed if completely empty
          await fetch('/api/ebook/seed-ecosystem', { method: 'POST' }).catch(() => {});
          const reseedRes = await fetch('/api/ebook/catalog/browse');
          if (reseedRes.ok) setCatalog(await reseedRes.json());
        } else {
          setCatalog(data);
        }
      }
    } catch {} finally { setCatalogLoading(false); }
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadSession = async (session: any) => {
    setActiveSession(session);
    const msgs = session.messages ? JSON.parse(session.messages) : [];
    setChatMessages(msgs);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeSession || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg, timestamp: Date.now() }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/ebook/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id, message: msg, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: Date.now() }]);
        setActiveSession(data.session);
      }
    } catch (err) { console.error('Chat error:', err); }
    finally { setChatLoading(false); }
  };

  const createSession = async () => {
    if (!newSessionTitle.trim() || !userId) return;
    try {
      const res = await fetch('/api/ebook/writing-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: newSessionTitle, genre: newSessionGenre, category: newSessionCategory }),
      });
      if (res.ok) {
        const session = await res.json();
        setWritingSessions(prev => [session, ...prev]);
        loadSession(session);
        setShowNewSession(false);
        setNewSessionTitle('');
        setNewSessionGenre('');
      }
    } catch {}
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <KenBurnsHero>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-white text-sm backdrop-blur-sm" data-testid="badge-trust-book">
            <BookOpen className="w-4 h-4 mr-2 text-cyan-400" />
            Trust Layer Publishing
          </Badge>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">Trust</span>
            <br /><span className="text-white drop-shadow-2xl">Book</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Read, write, and publish. The premium platform for truth-seekers — with AI-powered writing tools and blockchain-verified provenance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/veil/read">
              <Button size="lg" className="h-14 px-8 text-base gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-2xl shadow-cyan-500/25 rounded-xl" data-testid="button-read-featured">
                <Eye className="w-5 h-5" /> Preview <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={() => scrollToSection('write')}
              className="h-14 px-8 text-base gap-2 border-white/20 text-white hover:bg-white/5 rounded-xl" data-testid="button-write-book">
              <PenTool className="w-5 h-5" /> Write Your Book
            </Button>
            {deferredPrompt && (
              <Button size="lg" variant="default" onClick={handleInstallClick}
                className="h-14 px-8 text-base gap-2 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 rounded-xl font-bold" data-testid="button-install-pwa">
                <Download className="w-5 h-5" /> Install App
              </Button>
            )}
          </div>
        </motion.div>
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronRight className="w-6 h-6 text-white/30 rotate-90" />
        </motion.div>
      </KenBurnsHero>

      <div className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl border-b border-white/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => scrollToSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
                data-testid={`tab-${tab.id}`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section id="section-discover" className="py-12 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Compact Featured Bento Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
            {/* Through The Veil — Featured Hero Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 group h-[320px] sm:h-[360px]">
              <img src={featuredImg} alt="Through The Veil" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              <Badge className="absolute top-4 left-4 bg-cyan-500/20 border-cyan-500/30 text-cyan-400 backdrop-blur-md z-10">
                <Sparkles className="w-3 h-3 mr-1" /> Featured
              </Badge>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
                <div className="flex gap-2 mb-2">
                  <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-400 text-xs">Non-Fiction</Badge>
                  <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-400 text-xs">Investigation</Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">Through The Veil</h2>
                <p className="text-white/50 text-sm line-clamp-2 mb-4 max-w-lg">
                  A 107,000-word investigation into the hidden architecture of history. What if the most important name was deliberately changed?
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  <Link href="/veil/read">
                    <Button size="sm" className="gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-lg rounded-lg" data-testid="button-read-now">
                      <Eye className="w-4 h-4" /> Preview
                    </Button>
                  </Link>
                  <Link href="/veil/read">
                    <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-lg" data-testid="button-buy-veil">
                      <Sparkles className="w-4 h-4" /> $4.99
                    </Button>
                  </Link>
                  <span className="text-white/25 text-xs hidden sm:inline">$9.99 on Amazon</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column — Stats + Speaking Code */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Stats Row */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {READER_STATS.map((stat, i) => (
                  <GlassCard key={stat.label} glow={i === 0}>
                    <div className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                      <stat.icon className="w-4 h-4 text-cyan-400 mb-1.5" />
                      <div className="text-lg sm:text-xl font-display font-black text-white">{stat.value}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{stat.label}</div>
                    </div>
                  </GlassCard>
                ))}
              </motion.div>

              {/* Speaking Code Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="flex-1">
                <GlassCard glow>
                  <div className="relative overflow-hidden rounded-xl flex flex-col sm:flex-row h-full min-h-[180px]">
                    <div className="relative w-full sm:w-2/5 h-36 sm:h-auto shrink-0 overflow-hidden">
                      <img src={readerImg} alt="Speaking Code" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                    </div>
                    <div className="relative z-10 p-4 sm:p-5 flex flex-col flex-1 min-w-0 justify-center">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 text-[10px]"><Sparkles className="w-2.5 h-2.5 mr-0.5" /> Technical</Badge>
                        <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 text-[10px]">Free</Badge>
                      </div>
                      <h3 className="text-lg sm:text-xl font-display font-black text-white mb-1.5">Speaking Code</h3>
                      <p className="text-white/50 text-xs leading-relaxed mb-3 line-clamp-2">
                        The guide to Lume and the AI-native programming revolution.
                      </p>
                      <Link href="/speaking-code/read">
                        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-xs w-fit" data-testid="button-buy-speaking-code">
                          <Download className="w-3.5 h-3.5" /> Free eBook
                        </Button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="section-browse" className="py-12 relative overflow-hidden">
        {/* Cinematic Ambient Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] mix-blend-screen pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] mix-blend-screen pointer-events-none translate-y-1/2" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6 sm:mb-8">
            <div>
              <Badge className="mb-3 px-3 py-1.5 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-xs backdrop-blur-sm">
                <Grid3X3 className="w-3.5 h-3.5 mr-1.5" /> Catalog
              </Badge>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Explore by Category</span>
              </h2>
            </div>
          </motion.div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
            <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); fetchCatalog(); }}
              className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[40px] ${
                !selectedCategory ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`} data-testid="filter-all">All</button>
            {Object.entries(BOOK_CATEGORIES).map(([key, cat]) => (
              <button key={key} onClick={() => { setSelectedCategory(key); setSelectedSubcategory(null); fetchCatalog(key); }}
                className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[40px] ${
                  selectedCategory === key ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`} data-testid={`filter-${key}`}>{cat.label}</button>
            ))}
          </div>

          {selectedCategory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
              {BOOK_CATEGORIES[selectedCategory as keyof typeof BOOK_CATEGORIES]?.subcategories.map(sub => (
                <button key={sub} onClick={() => { setSelectedSubcategory(sub); fetchCatalog(selectedCategory, sub); }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                    selectedSubcategory === sub ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/10'
                  }`} data-testid={`subfilter-${sub}`}>{sub}</button>
              ))}
            </motion.div>
          )}

          {catalogLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : catalog.length > 0 ? (
            <div className="space-y-8">
              {/* Group books by category and render carousel rows */}
              {(() => {
                const grouped: Record<string, any[]> = {};
                catalog.forEach((book: any) => {
                  const cat = book.category === 'fiction' ? 'Fiction' : (book.subcategory || 'Non-Fiction');
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(book);
                });

                // If only one group or few books, show as "All Books"
                const groups = Object.entries(grouped);
                const showAsRows = groups.length > 1 && catalog.length > 4;

                if (!showAsRows) {
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-display font-bold text-white/80">All Books</h3>
                        <span className="text-xs text-white/30">{catalog.length} titles</span>
                      </div>
                      <div className="relative">
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                          {catalog.map((book: any) => (
                            <BookCard key={book.id} book={book} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return groups.map(([category, books]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-display font-bold text-white/80">{category}</h3>
                      <span className="text-xs text-white/30">{books.length} titles</span>
                    </div>
                    <div className="relative">
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                        {books.map((book: any) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-16 glassmorphism rounded-2xl border border-white/5 max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-white mb-2">No Books Found</h3>
              <p className="text-white/40 text-sm mb-6">This category is empty. Be the first to publish.</p>
              <Button onClick={() => scrollToSection('publish')} size="sm" className="bg-white/10 hover:bg-white/20 text-white rounded-lg gap-2" data-testid="button-publish-first">
                <Upload className="w-4 h-4" /> Publish Your Book
              </Button>
            </div>
          )}
        </div>
      </section>

      <section id="section-library" className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <Badge className="mb-4 px-3 py-1.5 bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
              <Library className="w-3 h-3 mr-1" /> Personal Collection
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">My Library</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm">
              Your purchased books, reading progress, and authored works — all in one place.
            </p>
          </motion.div>

          {!userId ? (
            <div className="max-w-lg mx-auto">
              <GlassCard glow>
                <div className="p-8 text-center">
                  <Lock className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Sign In to Access Your Library</h3>
                  <p className="text-sm text-white/40">Your purchased books and reading progress will appear here.</p>
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="space-y-8">
              <GlassCard>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Bookmark className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white">Purchased Books</h3>
                  </div>
                  {userLibrary.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userLibrary.map((item: any) => (
                        <div key={item.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 transition-all">
                          <h4 className="text-sm font-bold text-white mb-1">{item.bookTitle}</h4>
                          <div className="flex items-center justify-between">
                            <div className="w-full bg-white/5 rounded-full h-1.5 mr-3">
                              <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${item.progress || 0}%` }} />
                            </div>
                            <span className="text-[10px] text-white/30 whitespace-nowrap">{item.progress || 0}%</span>
                          </div>
                          <Link href={`/${item.bookSlug}/read`}>
                            <Button size="sm" variant="ghost" className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 p-0 h-auto" data-testid={`button-continue-${item.bookId}`}>
                              Continue Reading <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-white/30 text-sm">No books in your library yet.</p>
                      <Link href="/veil/read">
                        <Button size="sm" variant="ghost" className="mt-2 text-cyan-400 text-xs" data-testid="button-browse-books">
                          Browse Books <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </GlassCard>

              {myBooks.length > 0 && (
                <GlassCard>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <PenTool className="w-5 h-5 text-purple-400" />
                      <h3 className="text-base font-bold text-white">Your Published Works</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {myBooks.map((book: any) => {
                        const status = STATUS_CONFIG[book.status] || STATUS_CONFIG.draft;
                        const StatusIcon = status.icon;
                        return (
                          <div key={book.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-bold text-white truncate flex-1 mr-2">{book.title}</h4>
                              <Badge className={`text-[10px] ${status.color} bg-white/5 border-white/10`}>
                                <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-white/40 line-clamp-2 mb-2">{book.description}</p>
                            <div className="flex items-center gap-3 text-[10px] text-white/30">
                              <span>{book.genre}</span><span>·</span><span>${(book.price / 100).toFixed(2)}</span>
                              {book.reviewNotes && <><span>·</span><span className="text-purple-400/60">Review notes</span></>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="section-write" className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <Badge className="mb-4 px-3 py-1.5 bg-indigo-500/10 border-indigo-500/30 text-indigo-400 text-xs">
              <Bot className="w-3 h-3 mr-1" /> AI Writing Assistant
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Book Author Agent</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm">
              Your personal AI writing coach. Get help with outlining, drafting chapters, character development, and polishing your manuscript.
            </p>
          </motion.div>

          {!userId ? (
            <div className="max-w-lg mx-auto">
              <GlassCard glow>
                <div className="p-8 text-center">
                  <Lock className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Sign In to Start Writing</h3>
                  <p className="text-sm text-white/40">Create an account to access the AI Book Author Agent.</p>
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <GlassCard>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">Writing Projects</h3>
                        <Button size="sm" onClick={() => setShowNewSession(true)} className="h-8 px-3 gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 text-xs rounded-lg" data-testid="button-new-project">
                          <Plus className="w-3 h-3" /> New
                        </Button>
                      </div>

                      <AnimatePresence>
                        {showNewSession && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-indigo-500/20 space-y-2">
                            <input type="text" value={newSessionTitle} onChange={(e) => setNewSessionTitle(e.target.value)}
                              placeholder="Book title..." className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50" data-testid="input-new-project-title" />
                            <select value={newSessionCategory} onChange={(e) => setNewSessionCategory(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50" data-testid="select-new-project-category">
                              <option value="fiction" className="bg-slate-900">Fiction</option>
                              <option value="nonfiction" className="bg-slate-900">Non-Fiction</option>
                            </select>
                            <select value={newSessionGenre} onChange={(e) => setNewSessionGenre(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50" data-testid="select-new-project-genre">
                              <option value="" className="bg-slate-900">Select genre...</option>
                              {BOOK_CATEGORIES[newSessionCategory as keyof typeof BOOK_CATEGORIES]?.subcategories.map(sub => (
                                <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={createSession} disabled={!newSessionTitle.trim()} className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-500" data-testid="button-create-project">Create</Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowNewSession(false)} className="h-8 text-xs text-white/40">Cancel</Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-1 max-h-[400px] overflow-y-auto">
                        {writingSessions.length === 0 ? (
                          <div className="text-center py-6">
                            <Pen className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                            <p className="text-[10px] text-white/30">No projects yet. Start your first book!</p>
                          </div>
                        ) : writingSessions.map((session: any) => (
                          <button key={session.id} onClick={() => loadSession(session)}
                            className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                              activeSession?.id === session.id ? 'bg-indigo-500/15 border border-indigo-500/30 text-white' : 'text-white/50 hover:bg-white/[0.03] hover:text-white/70'
                            }`} data-testid={`session-${session.id}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate">{session.title}</span>
                              <Badge className="text-[8px] bg-white/5 border-white/10 text-white/30 ml-2">{session.status}</Badge>
                            </div>
                            <span className="text-[10px] text-white/30">{session.genre || session.category || 'No genre'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="lg:col-span-2">
                  <GlassCard glow>
                    <div className="flex flex-col h-[500px]">
                      {activeSession ? (
                        <>
                          <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-white">{activeSession.title}</h3>
                                <p className="text-[10px] text-white/30">{activeSession.genre || 'No genre set'} · {activeSession.status}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.length === 0 && (
                              <div className="text-center py-8">
                                <Bot className="w-10 h-10 text-indigo-400/30 mx-auto mb-3" />
                                <p className="text-sm text-white/40 mb-1">Hi! I'm your Book Author Agent.</p>
                                <p className="text-xs text-white/25">Tell me about the book you want to write, and I'll help you develop the concept, outline chapters, and draft content.</p>
                                <div className="flex flex-wrap gap-2 justify-center mt-4">
                                  {["Help me outline my book", "I need help developing characters", "Let's brainstorm chapter ideas", "Review my concept"].map(prompt => (
                                    <button key={prompt} onClick={() => { setChatInput(prompt); }}
                                      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs hover:bg-indigo-500/20 transition-all" data-testid={`prompt-${prompt.slice(0,10)}`}>
                                      {prompt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {chatMessages.map((msg: any, i: number) => (
                              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/20'
                                    : 'bg-white/[0.03] text-white/80 border border-white/5'
                                }`}>
                                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-li:my-0.5 whitespace-pre-wrap text-xs">
                                    {msg.content}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            {chatLoading && (
                              <div className="flex justify-start">
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                    <span className="text-xs text-white/40">Writing...</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>
                          <div className="p-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Ask the Author Agent..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30" data-testid="input-chat-message" />
                              <Button size="sm" onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                                className="h-10 w-10 p-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl disabled:opacity-40" data-testid="button-send-message">
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center p-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto mb-5">
                              <Bot className="w-8 h-8 text-indigo-400/50" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Book Author Agent</h3>
                            <p className="text-xs text-white/30 mb-4 max-w-xs mx-auto">
                              Select a project from the sidebar or create a new one to start writing with AI assistance.
                            </p>
                            <Button size="sm" onClick={() => setShowNewSession(true)}
                              className="gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30" data-testid="button-start-writing">
                              <Plus className="w-4 h-4" /> Start New Book
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="section-publish" className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <Badge className="mb-4 px-3 py-1.5 bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
              <Upload className="w-3 h-3 mr-1" /> Author Portal
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Publish Your Truth</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm">
              Submit your manuscript for review. Approved books go live with blockchain-verified provenance. 70% royalties.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Lock, label: "Censorship-Free", desc: "Publish without fear", gradient: "from-purple-500 to-pink-600" },
                { icon: Zap, label: "Instant Publishing", desc: "Upload and go live", gradient: "from-purple-500 to-cyan-600" },
                { icon: Globe, label: "Global Reach", desc: "Readers worldwide", gradient: "from-emerald-500 to-teal-600" },
              ].map(item => (
                <GlassCard key={item.label}>
                  <div className="p-5 text-center">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-3`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">{item.label}</div>
                    <div className="text-xs text-white/40">{item.desc}</div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {!userId ? (
              <GlassCard glow>
                <div className="p-8 text-center">
                  <Lock className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Sign In to Publish</h3>
                  <p className="text-sm text-white/40">You need to be signed in to submit books for review.</p>
                </div>
              </GlassCard>
            ) : (
              <>
                <AuthorEarningsDashboard userId={userId} />

                {!showSubmitForm ? (
                  <div className="text-center mt-6">
                    <Button onClick={() => setShowSubmitForm(true)} size="lg"
                      className="h-12 px-8 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-2xl shadow-purple-500/25 rounded-xl" data-testid="button-open-submit-form">
                      <Upload className="w-5 h-5" /> Submit New Book
                    </Button>
                  </div>
                ) : submitSuccess ? (
                  <GlassCard glow>
                    <div className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Submission Received!</h3>
                      <p className="text-sm text-white/50 mb-4">Your book has been submitted for review. We'll notify you when it's been reviewed.</p>
                      <Button onClick={() => { setSubmitSuccess(false); setShowSubmitForm(false); }} variant="outline" className="border-white/20 text-white hover:bg-white/5" data-testid="button-done-submit">Done</Button>
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard glow>
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">New Book Submission</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowSubmitForm(false)} className="text-slate-400 hover:text-white" data-testid="button-close-submit">Cancel</Button>
                      </div>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!userId) return;
                        setSubmitting(true);
                        try {
                          const res = await fetch('/api/ebook/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              authorId: userId, title: submitForm.title, description: submitForm.description,
                              genre: submitForm.subcategory || submitForm.genre, category: submitForm.category,
                              subcategory: submitForm.subcategory, price: parseInt(submitForm.price) || 499,
                              tags: submitForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                            }),
                          });
                          if (res.ok) {
                            setSubmitSuccess(true);
                            setSubmitForm({ title: '', description: '', genre: '', category: 'nonfiction', subcategory: '', price: '499', tags: '' });
                            if (userId) fetchUserData(userId);
                          }
                        } catch (err) { console.error('Submit error:', err); }
                        finally { setSubmitting(false); }
                      }} className="space-y-5" data-testid="form-submit-book">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1.5">Book Title</label>
                          <input type="text" required value={submitForm.title} onChange={(e) => setSubmitForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                            placeholder="Enter your book title" data-testid="input-book-title" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1.5">Description</label>
                          <textarea required rows={4} value={submitForm.description} onChange={(e) => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                            placeholder="Describe your book..." data-testid="input-book-description" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1.5">Category</label>
                            <select value={submitForm.category} onChange={(e) => setSubmitForm(f => ({ ...f, category: e.target.value, subcategory: '' }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50" data-testid="select-book-category">
                              {Object.entries(BOOK_CATEGORIES).map(([key, cat]) => (
                                <option key={key} value={key} className="bg-slate-900">{cat.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1.5">Genre / Subcategory</label>
                            <select value={submitForm.subcategory} onChange={(e) => setSubmitForm(f => ({ ...f, subcategory: e.target.value, genre: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50" data-testid="select-book-genre">
                              <option value="" className="bg-slate-900">Select genre...</option>
                              {BOOK_CATEGORIES[submitForm.category as keyof typeof BOOK_CATEGORIES]?.subcategories.map(sub => (
                                <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1.5">Price (cents)</label>
                            <input type="number" min="99" max="9999" value={submitForm.price} onChange={(e) => setSubmitForm(f => ({ ...f, price: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
                              placeholder="499" data-testid="input-book-price" />
                            <p className="text-[10px] text-white/30 mt-1">You receive 70% — ${((parseInt(submitForm.price) || 0) * 0.7 / 100).toFixed(2)} per sale</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1.5">Tags (comma separated)</label>
                            <input type="text" value={submitForm.tags} onChange={(e) => setSubmitForm(f => ({ ...f, tags: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
                              placeholder="history, investigation, truth" data-testid="input-book-tags" />
                          </div>
                        </div>
                        <Button type="submit" disabled={submitting || !submitForm.title || !submitForm.description} size="lg"
                          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-2xl shadow-purple-500/25 rounded-xl disabled:opacity-40" data-testid="button-submit-book">
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                          Submit for Review
                        </Button>
                        <p className="text-[10px] text-white/20 text-center">All submissions are reviewed before publishing. 30% platform fee applies.</p>
                      </form>
                    </div>
                  </GlassCard>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">A Reading Experience</span>
              <br /><span className="text-white">Like No Other</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORM_FEATURES.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/30 transition-all duration-500 group h-[280px] sm:h-[320px]">
                  {/* Photorealistic Background */}
                  <img src={feature.image} alt={feature.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
                  
                  {/* Content */}
                  <div className="relative z-10 p-5 sm:p-6 h-full flex flex-col justify-end">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg shadow-black/30 backdrop-blur-sm`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white mb-3">What Readers Are Saying</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <GlassCard>
                  <div className="p-5 text-center">
                    <div className="flex justify-center gap-1 mb-3">
                      {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 text-purple-400 fill-purple-400" />)}
                    </div>
                    <p className="text-sm text-white/70 italic">"{t.text}"</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Start Reading Now</span>
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-2">
              "Through The Veil" — 107,000 words of investigation. 52 chapters across 13 parts.
            </p>
            <p className="text-white/30 text-sm mb-8">$4.99 on Trust Book · $9.99 on Amazon</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/veil/read">
                <Button size="lg" className="h-14 px-10 text-base gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-2xl shadow-cyan-500/25 rounded-xl" data-testid="button-start-reading">
                  <Eye className="w-5 h-5" /> Preview
                </Button>
              </Link>
              <Link href="/veil/read">
                <Button size="lg" className="h-14 px-10 text-base gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-2xl shadow-purple-500/25 rounded-xl" data-testid="button-buy-now-bottom">
                  <Sparkles className="w-5 h-5" /> Buy Full Book — $4.99
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ COCKPIT FOOTER ═══ */}
      <footer className="relative border-t border-white/10 bg-slate-950/90 backdrop-blur-sm">
        {/* Row 1: Navigation Links — cockpit inline scroll */}
        <div className="border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
              {/* Platform */}
              <div>
                <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Platform</h4>
                <ul className="space-y-2 text-xs text-white/40">
                  <li><button onClick={() => scrollToSection('discover')} className="hover:text-cyan-400 transition-colors">Featured Books</button></li>
                  <li><button onClick={() => scrollToSection('browse')} className="hover:text-cyan-400 transition-colors">Browse Catalog</button></li>
                  <li><button onClick={() => scrollToSection('library')} className="hover:text-cyan-400 transition-colors">My Library</button></li>
                  <li><button onClick={() => scrollToSection('write')} className="hover:text-cyan-400 transition-colors">Author Agent</button></li>
                  <li><button onClick={() => scrollToSection('publish')} className="hover:text-cyan-400 transition-colors">Publish</button></li>
                </ul>
              </div>

              {/* Publishing */}
              <div>
                <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Publishing</h4>
                <ul className="space-y-2 text-xs text-white/40">
                  <li><span className="text-white/50">70% Author Royalties</span></li>
                  <li><span className="text-white/50">Blockchain Provenance</span></li>
                  <li><span className="text-white/50">AI Writing Assistant</span></li>
                  <li><span className="text-white/50">Censorship-Free</span></li>
                  <li><span className="text-white/50">Global Distribution</span></li>
                </ul>
              </div>

              {/* Ecosystem */}
              <div>
                <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Ecosystem</h4>
                <ul className="space-y-2 text-xs text-white/40">
                  <li><a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Trust Layer</a></li>
                  <li><a href="https://lume-lang.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors text-cyan-400/60">Lume Language</a></li>
                  <li><a href="https://darkwavestudios.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">DarkWave Studios</a></li>
                  <li><a href="https://academy.tlid.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Academy</a></li>
                  <li><a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors text-cyan-400/60">DWSC R&D</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Legal</h4>
                <ul className="space-y-2 text-xs text-white/40">
                  <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Content Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">DMCA & Copyright</Link></li>
                  <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Author Agreement</Link></li>
                </ul>
              </div>

              {/* Community */}
              <div>
                <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Community</h4>
                <div className="flex gap-3 mb-3">
                  <a href="https://x.com/TrustSignal26" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-all hover:scale-110" title="X / Twitter">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="https://discord.gg/PtkWpzE6" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-all hover:scale-110" title="Discord">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                  </a>
                  <a href="https://t.me/dwsccommunity" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-all hover:scale-110" title="Telegram">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61585553137979" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-all hover:scale-110" title="Facebook">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                </div>
                <ul className="space-y-2 text-xs text-white/40">
                  <li><a href="https://discord.gg/PtkWpzE6" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Join Discord</a></li>
                  <li><Link href="/feedback" className="hover:text-cyan-400 transition-colors">Feedback</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Lume / Ecosystem Banner */}
        <div className="border-b border-white/5 bg-gradient-to-r from-cyan-950/20 via-slate-950/50 to-teal-950/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3 text-xs text-white/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>
                Powered by <a href="https://lume-lang.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">Lume</a> — the deterministic AI-native programming language
              </span>
              <span className="text-white/20">·</span>
              <a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 hover:text-cyan-300 transition-colors font-medium">DWSC.io</a>
            </div>
          </div>
        </div>

        {/* Row 3: Legal Disclaimer */}
        <div className="border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3 text-center">Publishing & Content Disclaimer</h4>
              <div className="text-[10px] leading-relaxed text-white/25 space-y-2">
                <p>
                  <strong className="text-white/40">CONTENT RESPONSIBILITY:</strong> Authors are solely responsible for the content they publish on Trust Book. DarkWave Studios, LLC does not endorse, verify, or guarantee the accuracy of any user-submitted content. All published works represent the views of their respective authors.
                </p>
                <p>
                  <strong className="text-white/40">DMCA & COPYRIGHT:</strong> Trust Book respects intellectual property rights. If you believe your copyrighted work has been infringed upon, please contact us via our DMCA process. We will promptly investigate and take appropriate action.
                </p>
                <p>
                  <strong className="text-white/40">AUTHOR AGREEMENT:</strong> By publishing on Trust Book, authors agree to the 70/30 revenue split (70% author, 30% platform), editorial review process, and blockchain provenance recording. Authors retain full copyright ownership of their works.
                </p>
                <p>
                  <strong className="text-white/40">NO FINANCIAL ADVICE:</strong> Content published on Trust Book, including but not limited to cryptocurrency, investment, or financial topics, does not constitute financial advice. Readers should conduct their own research and consult qualified professionals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Cockpit Badge Strip */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-white/50">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white/70">Trust Book</span>
            </div>
            <span className="text-white/20">•</span>
            <span className="text-white/30">&copy; {new Date().getFullYear()} DarkWave Studios, LLC</span>
            <span className="text-white/20">•</span>
            <Link href="/terms" className="text-white/30 hover:text-cyan-400 transition-colors">Terms</Link>
            <span className="text-white/20">•</span>
            <Link href="/privacy" className="text-white/30 hover:text-cyan-400 transition-colors">Privacy</Link>
            <span className="text-white/20">•</span>
            <Link href="/terms" className="text-white/30 hover:text-cyan-400 transition-colors">DMCA</Link>
            <span className="text-white/20">•</span>
            <Link href="/explore" className="text-white/30 hover:text-cyan-400 transition-colors">Explore</Link>
            <span className="text-white/20">•</span>
            <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400/60 hover:text-cyan-400 transition-colors">Trust Layer</a>
            <span className="text-white/20">•</span>
            <a href="https://trustshield.tech" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-colors inline-flex items-center gap-1">
              Protected by <span className="text-cyan-400/60 font-semibold">TrustShield</span>
            </a>
            <span className="text-white/20">•</span>
            <a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400/50 hover:text-cyan-400 transition-colors">◈ DWSC</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
