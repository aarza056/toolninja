import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ToolNinja privacy policy. Tool inputs are processed entirely in your browser and never sent to our servers. Learn how we use analytics and advertising cookies.",
};

export default function PrivacyPage() {
  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-xs text-[#555555] hover:text-[#888888] transition-colors mb-8 inline-block">
        ← Back to tools
      </Link>

      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">Privacy Policy</h1>
      <p className="text-xs text-[#555555] mb-10">Last updated: October 2026</p>

      <div className="prose-custom space-y-8 text-sm text-[#888888] leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">The short version</h2>
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] text-[#a855f7] text-sm font-medium">
            Whatever you type into a tool — code, text, keys, tokens, passwords — is processed
            entirely in your browser and never sent to our servers. Separately, the site itself
            uses analytics (only if you consent) and displays ads, both described below. Neither
            one ever sees what you type into a tool.
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">1. What we collect</h2>
          <p>
            Nothing from the tools themselves. Every tool on ToolNinja executes its logic locally
            in your browser using JavaScript. Your code, text, keys, tokens, passwords, or any
            other input you paste into a tool never leave your device — no tool data is
            transmitted to any server, including ours. (A couple of tools — the HTTP Request
            Builder and the README Badge Generator&apos;s live stat badges — make requests to
            whatever API or endpoint <em>you</em> point them at, by design. That&apos;s a request
            you&apos;re directing, not data we collect.)
          </p>
          <p className="mt-3">
            Separately, the site as a whole may collect standard analytics (which pages and tools
            get visited, only if you consent) and Google&apos;s advertising partners may set
            cookies to serve and measure ads — both covered in the sections below. Neither is ever
            combined with, or has access to, what you actually type into a tool.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">2. Cookies and local storage</h2>
          <p className="mb-3">
            Some tools store preferences (selected options, tab state) in your browser&apos;s local storage
            for convenience. This data stays on your device and is never transmitted anywhere.
          </p>
          <p>
            We also store your cookie consent choice (<code className="text-xs text-[#a855f7] bg-[#a855f7]/10 px-1 py-0.5 rounded">toolninja_cookie_consent</code>)
            in local storage so the banner only appears once. You can reset this at any time using
            the &quot;Cookies&quot; link in the sidebar.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">3. Analytics &amp; cookies</h2>
          <p className="mb-3">
            If you accept analytics, we use Google Analytics to understand which tools developers use
            most. This helps us decide which tools to improve and which new ones to build.
            Google Analytics is only loaded <strong className="text-[#d4d4d4]">after you explicitly accept</strong> —
            it never fires on decline.
          </p>
          <p className="mb-3">Google Analytics sets the following cookies:</p>
          <ul className="space-y-1 mb-3 pl-4">
            <li><code className="text-xs text-[#a855f7] bg-[#a855f7]/10 px-1 py-0.5 rounded">_ga</code> — distinguishes users (expires 2 years)</li>
            <li><code className="text-xs text-[#a855f7] bg-[#a855f7]/10 px-1 py-0.5 rounded">_gid</code> — distinguishes users (expires 24 hours)</li>
            <li><code className="text-xs text-[#a855f7] bg-[#a855f7]/10 px-1 py-0.5 rounded">_ga_*</code> — session state (expires 2 years)</li>
          </ul>
          <p className="mb-3">
            We use <code className="text-xs text-[#a855f7] bg-[#a855f7]/10 px-1 py-0.5 rounded">anonymize_ip: true</code> to
            mask the last octet of your IP address before it reaches Google.
          </p>
          <p>
            <strong className="text-[#d4d4d4]">Important:</strong> your tool inputs (JSON, code, passwords, JWT tokens, etc.)
            are <strong className="text-[#d4d4d4]">never tracked or sent to Google</strong> or any other third party.
            Analytics only tracks page views and navigation — never what you paste into our tools.
            You can opt out at any time using the &quot;Cookies&quot; link in the sidebar, or by installing the{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#a855f7] hover:underline" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-out Browser Add-on
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">4. Advertising (Google AdSense)</h2>
          <p className="mb-3">
            ToolNinja uses Google AdSense to display ads. AdSense may use cookies and similar
            technologies to serve ads and to personalize them based on your visits to this and
            other websites. Google and its advertising partners may use this information to show
            you ads they believe are relevant to you, on ToolNinja and elsewhere.
          </p>
          <p className="mb-3">
            You can learn more about how Google uses data from sites that use its services, and
            review your options for controlling personalized ads, at{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-[#a855f7] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              policies.google.com/technologies/partner-sites
            </a>.
          </p>
          <p>
            <strong className="text-[#d4d4d4]">Important:</strong> AdSense operates completely
            separately from the tools themselves. Nothing you type into a tool is ever sent to
            Google&apos;s ad network, used to target ads, or combined with ad-related data in any way.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">5. Third-party services</h2>
          <p>
            ToolNinja is hosted on infrastructure that may collect standard web server logs (IP address,
            user agent, timestamp, URL). This data is handled according to the hosting provider&apos;s own
            privacy policy and is not combined with any user-level data by us. Beyond Google Analytics
            and Google AdSense (both described above), we do not integrate any other advertising
            networks, social tracking pixels, or user profiling services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">6. Security tools</h2>
          <p>
            Tools such as AES encryption, RSA key generation, and JWT signing use your browser&apos;s
            built-in <strong className="text-[#d4d4d4]">Web Crypto API</strong>. Keys and plaintext
            are never sent to any server. You should still take care not to paste production secrets
            into any browser-based tool, including this one, if your threat model requires it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">7. Children&apos;s privacy</h2>
          <p>
            ToolNinja does not knowingly collect any information from children under 13, and the tools
            themselves collect no personal information from anyone, of any age. Our advertising and
            analytics providers are expected to comply with applicable children&apos;s privacy laws; see
            Google&apos;s own policies for how they handle this across sites that use their services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">8. Changes to this policy</h2>
          <p>
            If this policy changes materially, we will update the &quot;Last updated&quot; date at the top of
            this page. Continued use of ToolNinja after a policy update constitutes acceptance of the
            revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">9. Contact</h2>
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
