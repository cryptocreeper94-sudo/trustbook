import { useState } from "react";
import { APP_VERSION } from "@shared/schema";
import { useLocation, Link } from "wouter";

const socialLinks = [
  {
    name: "Twitter",
    url: "https://x.com/TrustSignal26",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Discord",
    url: "https://discord.gg/PtkWpzE6",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    url: "https://t.me/dwsccommunity",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61585553137979",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

export function Footer() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => {
    setShowPinModal(true);
    setPin("");
    setError(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    
    try {
      const response = await fetch("/api/portal/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowPinModal(false);
        setPin("");
        setError(false);
        sessionStorage.setItem(`${data.portalType}Auth`, "true");
        if (data.token) {
          sessionStorage.setItem("ownerToken", data.token);
        }
        setLocation(data.redirect);
      } else {
        setError(true);
        setPin("");
      }
    } catch (err) {
      setError(true);
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Site Links Section - Above Footer */}
      <section className="bg-slate-950/80 border-t border-white/5">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">About DarkWave</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/note" className="hover:text-cyan-400 transition-colors">Our Story</Link></li>
                <li><Link href="/vision" className="hover:text-cyan-400 transition-colors">Vision</Link></li>
                <li><Link href="/team" className="hover:text-cyan-400 transition-colors">Team</Link></li>
                <li><Link href="/trust-layer" className="hover:text-cyan-400 transition-colors">Trust Layer</Link></li>
              </ul>
            </div>
            
            {/* Ecosystem */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Ecosystem</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/token" className="hover:text-cyan-400 transition-colors">Signal</Link></li>
                <li><Link href="/staking" className="hover:text-cyan-400 transition-colors">Staking</Link></li>
                <li><Link href="/bridge" className="hover:text-cyan-400 transition-colors">Bridge</Link></li>
                <li><Link href="/explorer" className="hover:text-cyan-400 transition-colors">Block Explorer</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">Documentation</Link></li>
                <li><Link href="/api-docs" className="hover:text-cyan-400 transition-colors">API Docs</Link></li>
                <li><Link href="/faq" className="hover:text-cyan-400 transition-colors">FAQ</Link></li>
                <li><Link href="/feedback" className="hover:text-cyan-400 transition-colors">Feedback</Link></li>
                <li><a href="https://lume-lang.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors text-cyan-400/70">Lume Language</a></li>
                <li><a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors text-cyan-400/70">DWSC R&D</a></li>
              </ul>
            </div>
            
            {/* Community */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Community</h4>
              <div className="flex gap-3 mb-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-cyan-400 transition-all duration-300 hover:scale-110"
                    data-testid={`link-social-${social.name.toLowerCase()}`}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <p className="text-xs text-white/40">Join our growing community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lume Promotional Banner */}
      <section className="border-t border-white/5 bg-gradient-to-r from-cyan-950/20 via-slate-950/50 to-teal-950/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3 text-xs text-white/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>
              Powered by <a href="https://lume-lang.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">Lume</a> — the AI-native programming language
            </span>
            <span className="text-white/20">·</span>
            <a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400/80 hover:text-cyan-300 transition-colors font-medium">DWSC.io</a>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer Section - Pre-Footer */}
      <section className="bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 text-center">
              Important Legal Disclaimer
            </h4>
            <div className="text-[10px] leading-relaxed text-white/40 space-y-3">
              <p>
                <strong className="text-white/60">DO YOUR OWN RESEARCH (DYOR):</strong> The information provided on this website is for general informational and educational purposes only. It does not constitute financial advice, investment advice, trading advice, or any other sort of advice, and you should not treat any of the website's content as such. DarkWave Studios, LLC does not recommend that any cryptocurrency or digital asset should be bought, sold, or held by you. Before making any financial decisions, you should conduct your own research and consult with a qualified financial advisor.
              </p>
              <p>
                <strong className="text-white/60">NO GUARANTEES:</strong> Cryptocurrency and digital asset investments are highly volatile and speculative. Past performance is not indicative of future results. There is no guarantee that any investment will achieve its objectives, generate positive returns, or avoid losses. You could lose some or all of your investment. Never invest more than you can afford to lose.
              </p>
              <p>
                <strong className="text-white/60">ENTERTAINMENT & EDUCATION:</strong> This platform is provided for entertainment and educational purposes. Any simulations, games, demonstrations, or projections shown on this site are for illustrative purposes only and should not be relied upon as predictions of actual performance or outcomes.
              </p>
              <p>
                <strong className="text-white/60">NO LIABILITY:</strong> DarkWave Studios, LLC, its affiliates, officers, directors, employees, agents, and licensors shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your access to or use of (or inability to access or use) this website, any content on the website, or any actions taken in reliance on information provided. You use this website and participate in any activities at your own risk. By using this site, you acknowledge that you are solely responsible for your own decisions and actions.
              </p>
              <p>
                <strong className="text-white/60">REGULATORY NOTICE:</strong> Signal (SIG) is a utility access credential for the Trust Layer network and is not intended to be a security, investment contract, or financial instrument. Regulations regarding cryptocurrencies and digital assets vary by jurisdiction. It is your responsibility to ensure compliance with applicable laws in your region. DarkWave Studios, LLC makes no representations regarding the legality of this platform or Signal in any jurisdiction.
              </p>
              <p className="text-center pt-2 text-white/30">
                By using this website, you agree to these terms. If you do not agree, please discontinue use immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Single-Line Footer */}
      <footer className="bg-black border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-white/50">
            <span className="text-white/70">DarkWave Studios, LLC</span>
            <span className="text-white/30">•</span>
            <span>© 2026</span>
            <span className="text-white/30">•</span>
            <Link href="/terms" className="hover:text-cyan-400 transition-colors" data-testid="link-terms">
              Terms
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/privacy" className="hover:text-cyan-400 transition-colors" data-testid="link-privacy">
              Privacy
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/explore" className="hover:text-cyan-400 transition-colors" data-testid="link-explore">
              Explore
            </Link>
            <span className="text-white/30">•</span>
            <a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 hover:text-cyan-400 transition-colors">
              DWSC
            </a>
            <span className="text-white/30">•</span>
            <button onClick={openModal} className="text-white/30 hover:text-white/50 transition-colors" data-testid="link-team">
              Team
            </button>
          </div>
        </div>
      </footer>

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}>
          <div className="bg-[rgba(12,18,36,0.95)] border border-white/10 rounded-xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-center">Team Access</h3>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(false); }}
                placeholder="Enter Access Code"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-center text-xl tracking-widest font-mono mb-3"
                autoFocus
                data-testid="input-team-pin"
              />
              {error && <p className="text-red-400 text-xs text-center mb-3">Invalid PIN</p>}
              <button
                type="submit"
                className="w-full py-2 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                data-testid="button-team-submit"
              >
                Access
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
