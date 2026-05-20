"use client";
import { useState, useEffect } from "react";

type ConsentState = "accepted" | "declined" | null;

const CONSENT_KEY = "toolninja_cookie_consent";
const CONSENT_VERSION = "v1";

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const { state, version } = JSON.parse(stored);
        if (version === CONSENT_VERSION) {
          setConsent(state);
          if (state === "accepted") loadGoogleAnalytics();
          return;
        }
      }
    } catch {}

    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        state: "accepted",
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      })
    );
    setConsent("accepted");
    setVisible(false);
    loadGoogleAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        state: "declined",
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      })
    );
    setConsent("declined");
    setVisible(false);
  };

  if (!visible || consent !== null) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 pointer-events-none" />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up"
        role="dialog"
        aria-label="Cookie consent"
        aria-modal="false"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 shadow-2xl shadow-black/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xl flex-shrink-0 mt-0.5">🍪</span>
                <div>
                  <p className="text-sm text-[#f5f5f5] font-medium mb-1">
                    We use cookies for analytics
                  </p>
                  <p className="text-xs text-[#666] leading-relaxed">
                    Google Analytics helps us understand which tools developers
                    use most. Your tool inputs never leave your browser —
                    that&apos;s our core promise and it doesn&apos;t change.{" "}
                    <a href="/privacy" className="text-[#a855f7] hover:underline">
                      Privacy policy
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleDecline}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs text-[#666] bg-transparent border border-[#333] rounded-lg hover:text-[#888] hover:border-[#444] transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs text-white bg-[#a855f7] rounded-lg hover:bg-[#9333ea] transition-colors font-medium"
                >
                  Accept analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function loadGoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  if (!GA_ID || typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  const script1 = document.createElement("script");
  script1.id = "ga-script";
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script1.async = true;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.id = "ga-config";
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });
  `;
  document.head.appendChild(script2);
}
