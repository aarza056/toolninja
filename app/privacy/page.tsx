import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/lib/tools";
import {
  INPUT_PRIVACY_CLAIM,
  NETWORK_TOOLS,
  PRIVACY_CONTACT_EMAIL,
  DATA_CONTROLLER_NAME,
} from "@/lib/site";

const PRIVACY_LAST_UPDATED = "8 October 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ToolNinja handles data: tool input stays in your browser, plus server logs, consent-based analytics and ads, and your GDPR and CCPA rights.",
  alternates: { canonical: "https://toolninja.io/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-xs text-[#555555] hover:text-[#888888] transition-colors mb-8 inline-block">
        ← Back to tools
      </Link>

      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">Privacy Policy</h1>
      <p className="text-xs text-[#888888] mb-10">Last updated: {PRIVACY_LAST_UPDATED}</p>

      {/* TODO(owner): this policy, and the GDPR / UK GDPR / CCPA section in particular, is a draft
          written from what the code does. It needs legal review before it is relied on. */}
      <div className="prose-custom space-y-8 text-sm text-[#888888] leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">The short version</h2>
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] text-[#c084fc] text-sm font-medium">
            {INPUT_PRIVACY_CLAIM} That covers code, text, keys, tokens and passwords you type or
            paste into a tool. The site itself is a different matter: our hosting provider keeps
            server logs that include IP addresses, we use cookieless Vercel analytics, and Google
            Analytics and Google AdSense load only if you accept cookies. Two tools send requests
            you direct to a third-party server, listed below.
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">1. What is and isn&apos;t collected</h2>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Tool input.</strong> Tools run their logic in your
            browser with JavaScript. What you type or paste into a tool is not sent to ToolNinja and
            we do not collect it.
          </p>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Tools that make network requests.</strong> These
            tools contact a third-party server because that is what they are for. Each one says so on
            its own page:
          </p>
          <ul className="space-y-2 mb-3 pl-4 list-disc">
            {Object.entries(NETWORK_TOOLS).map(([slug, note]) => {
              const tool = tools.find((t) => t.slug === slug);
              return (
                <li key={slug}>
                  <Link href={`/tools/${slug}`} className="text-[#c084fc] hover:underline">
                    {tool?.name ?? slug}
                  </Link>
                  : {note}
                </li>
              );
            })}
          </ul>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Server logs.</strong> ToolNinja is hosted on Vercel.
            Like any web host, it records standard request logs: IP address, user agent, timestamp,
            requested URL and referrer. We use these only to run and secure the site, and we do not
            combine them with any other data.
          </p>
          <p>
            <strong className="text-[#d4d4d4]">Site analytics.</strong> Described in sections 3
            and 4. None of it includes what you type into a tool.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">2. Explain This Error</h2>
          <p>
            The <Link href="/explain-error" className="text-[#c084fc] hover:underline">Explain This Error</Link>{" "}
            page matches the error you paste against a list of article titles and keywords that is
            downloaded with the page. The matching runs in your browser. The error text is not sent
            to any server, is not saved to local storage and is not added to the page URL, so it
            also does not appear in server logs or analytics. There is no AI model involved.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">3. Analytics</h2>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Vercel Web Analytics and Speed Insights</strong> run
            on every page. They record page views and performance measurements (such as the page
            URL, referrer, browser, device type, country and load timings) and do not set cookies.
            {/* TODO(owner): confirm this description against Vercel's current documentation for
                Web Analytics and Speed Insights during legal review. */}
          </p>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Google Analytics</strong> loads only after you
            accept cookies. It never loads if you decline or before you choose. We use it to
            understand which tools developers use most. It sets these cookies:
          </p>
          <ul className="space-y-1 mb-3 pl-4">
            <li><code className="text-xs text-[#c084fc] bg-[#a855f7]/10 px-1 py-0.5 rounded">_ga</code> — distinguishes users (expires 2 years)</li>
            <li><code className="text-xs text-[#c084fc] bg-[#a855f7]/10 px-1 py-0.5 rounded">_gid</code> — distinguishes users (expires 24 hours)</li>
            <li><code className="text-xs text-[#c084fc] bg-[#a855f7]/10 px-1 py-0.5 rounded">_ga_*</code> — session state (expires 2 years)</li>
          </ul>
          <p>
            Analytics tracks page views and navigation, never what you paste into a tool. You can
            withdraw consent at any time with the &quot;Cookies&quot; link in the sidebar, or install
            the{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#c084fc] hover:underline" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-out Browser Add-on
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">4. Advertising (Google AdSense)</h2>
          <p className="mb-3">
            ToolNinja uses Google AdSense to show ads.{" "}
            <strong className="text-[#d4d4d4]">The AdSense script loads only after you accept
            cookies</strong>, for every visitor, including visitors in the EU, EEA and UK. Before you
            choose, or if you decline, no AdSense code loads and no ads are shown. Once loaded,
            AdSense may use cookies to serve ads and to personalize them based on your visits to
            this and other websites.
          </p>
          <p className="mb-3">
            You can learn more about how Google uses data from sites that use its services, and
            review your options for controlling personalized ads, at{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-[#c084fc] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              policies.google.com/technologies/partner-sites
            </a>.
          </p>
          <p>
            Nothing you type into a tool is sent to Google&apos;s ad network or used to target ads.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">5. Local storage on your device</h2>
          <p className="mb-3">
            Many tools save your last input and settings in your browser&apos;s local storage so
            they are still there when you come back. This stays on your device and is never
            transmitted. It does mean that anything you paste, including tokens, secrets or keys, may
            remain in that browser until you clear the tool or your site data. On a shared computer,
            clear the input before leaving, or clear this site&apos;s data in your browser settings.
          </p>
          <p>
            Your cookie choice is stored the same way (<code className="text-xs text-[#c084fc] bg-[#a855f7]/10 px-1 py-0.5 rounded">toolninja_cookie_consent</code>)
            so the banner appears only once. Reset it with the &quot;Cookies&quot; link in the sidebar.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">6. Security tools</h2>
          <p>
            Tools such as AES encryption, RSA key generation and JWT signing use your browser&apos;s
            built-in <strong className="text-[#d4d4d4]">Web Crypto API</strong>. Keys and plaintext
            are not uploaded. You should still avoid pasting production secrets into any
            browser-based tool, including this one, if your threat model requires it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">7. Your rights (GDPR, UK GDPR and CCPA)</h2>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Who is responsible.</strong>{" "}
            {DATA_CONTROLLER_NAME
              ? `${DATA_CONTROLLER_NAME} is the data controller for toolninja.io.`
              : "The operator of toolninja.io is the data controller."}
          </p>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Legal basis.</strong> We process server logs and
            cookieless Vercel analytics on the basis of our legitimate interest in running, securing
            and improving the site (GDPR / UK GDPR Art. 6(1)(f)). Google Analytics and Google AdSense
            run only on the basis of your consent (Art. 6(1)(a)), which you can withdraw at any time
            with the &quot;Cookies&quot; link in the sidebar.
          </p>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Your rights.</strong> If you are in the EU, EEA or
            UK, you have the right to access, correct or delete personal data we hold about you, to
            restrict or object to its processing, to data portability, and to withdraw consent. You
            can also complain to your local data protection authority (in the UK, the Information
            Commissioner&apos;s Office). Because we do not collect tool input or run accounts, the
            personal data we hold is limited to server logs and analytics, and we may need details
            such as the approximate time and IP address of your visit to find it.
          </p>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">California (CCPA / CPRA).</strong> In the last 12
            months we have collected identifiers (IP address) and internet activity (pages visited)
            through server logs and analytics. We do not sell personal information for money. If you
            accept cookies, AdSense may use cookies for cross-context behavioral advertising, which
            California law can treat as &quot;sharing&quot;. Declining cookies, or withdrawing consent
            with the &quot;Cookies&quot; link, opts you out. You have the right to know, delete and
            correct your personal information, and we will not treat you differently for using these
            rights.
          </p>
          <p className="mb-3">
            <strong className="text-[#d4d4d4]">Retention.</strong> Server logs are kept for the
            hosting provider&apos;s standard log retention period. Google Analytics data is kept for
            the retention period set in our Analytics property. Local storage stays in your browser
            until you clear it.
            {/* TODO(owner): state the actual log retention (Vercel plan) and the GA data retention
                setting (2 or 14 months) here. */}
          </p>
          <p>
            <strong className="text-[#d4d4d4]">International transfers.</strong> Vercel and Google
            may process data in the United States and other countries outside the UK and EEA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">8. Children&apos;s privacy</h2>
          <p>
            ToolNinja is not directed at children under 13 and does not knowingly collect personal
            information from them. The site does not ask anyone for personal information, but the
            server logs and consent-based analytics described above apply to every visitor. Our
            advertising and analytics providers are expected to comply with applicable
            children&apos;s privacy laws.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">9. Changes to this policy</h2>
          <p>
            If this policy changes materially, we will update the &quot;Last updated&quot; date at the
            top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#d4d4d4] mb-3">10. Contact</h2>
          <p>
            {PRIVACY_CONTACT_EMAIL ? (
              <>
                For questions about this policy or to make a data request, email{" "}
                <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="text-[#c084fc] hover:underline">
                  {PRIVACY_CONTACT_EMAIL}
                </a>
                .
              </>
            ) : (
              <>
                For questions about this policy or to make a data request, open an issue on our
                public repository or use the contact details listed there.
              </>
            )}
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
