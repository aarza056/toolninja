import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ToolNinja",
  description: "ToolNinja privacy policy. All tools run in your browser — we collect no personal data, no usage analytics, and make no server calls.",
};

export default function PrivacyPage() {
  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-xs text-[#555555] hover:text-[#888888] transition-colors mb-8 inline-block">
        ← Back to tools
      </Link>

      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">Privacy Policy</h1>
      <p className="text-xs text-[#555555] mb-10">Last updated: May 2026</p>

      <div className="prose-custom space-y-8 text-sm text-[#888888] leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">The short version</h2>
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] text-[#a855f7] text-sm font-medium">
            ToolNinja runs entirely in your browser. We collect zero personal data, zero usage data,
            and make zero server calls when you use any tool. There is nothing to sell and nothing to leak.
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">1. What we collect</h2>
          <p>
            Nothing. Every tool on ToolNinja executes its logic locally in your browser using JavaScript.
            Your code, text, keys, tokens, passwords, or any other input you paste into a tool never
            leave your device. No data is transmitted to any server.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">2. Cookies and local storage</h2>
          <p>
            ToolNinja does not use tracking cookies or persistent identifiers. Some tools may store
            preferences (such as selected options or tab state) in your browser&apos;s local storage for
            convenience within that browser session. This data is stored only on your device and is
            never transmitted anywhere.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">3. Analytics</h2>
          <p>
            We do not use Google Analytics, Mixpanel, Segment, or any third-party analytics service
            that tracks individual users. We may use aggregated, anonymous server access logs
            (e.g. page views by URL, not by user) to understand which tools are popular. These logs
            contain no personally identifiable information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">4. Third-party services</h2>
          <p>
            ToolNinja is hosted on infrastructure that may collect standard web server logs (IP address,
            user agent, timestamp, URL). This data is handled according to the hosting provider&apos;s own
            privacy policy and is not combined with any user-level data by us. We do not integrate
            any advertising networks, social tracking pixels, or user profiling services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">5. Security tools</h2>
          <p>
            Tools such as AES encryption, RSA key generation, and JWT signing use your browser&apos;s
            built-in <strong className="text-[#d4d4d4]">Web Crypto API</strong>. Keys and plaintext
            are never sent to any server. You should still take care not to paste production secrets
            into any browser-based tool, including this one, if your threat model requires it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">6. Children&apos;s privacy</h2>
          <p>
            ToolNinja does not knowingly collect any information from children under 13. Because we
            collect no personal information at all, there is nothing to address specifically for minors.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">7. Changes to this policy</h2>
          <p>
            If this policy changes materially, we will update the &quot;Last updated&quot; date at the top of
            this page. Continued use of ToolNinja after a policy update constitutes acceptance of the
            revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">8. Contact</h2>
          <p>
            Questions about this policy? Open an issue on our public repository or reach out via the
            contact details listed there.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex gap-4 text-xs text-[#444444]">
        <Link href="/terms" className="hover:text-[#666666] transition-colors">Terms of Service</Link>
        <span>·</span>
        <Link href="/" className="hover:text-[#666666] transition-colors">Back to tools</Link>
      </div>
    </div>
  );
}
