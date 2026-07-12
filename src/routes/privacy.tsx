import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { Cookie, Eye, HardDrive, Lock, Mail, Server, Shield, UserX } from 'lucide-react'
import { TrustPageShell } from '@/components/trust/trust-page-shell'
import { buildTrustPageHead } from '@/lib/trust-pages/seo'
import { SITE_AUTHOR, SITE_CONTACT_EMAIL, SITE_NAME, SITE_URL } from '@/lib/site'

const LAST_UPDATED = 'June 11, 2026'


export const Route = createFileRoute('/privacy')({
  head: () => buildTrustPageHead('/privacy'),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <TrustPageShell
      eyebrow="Privacy"
      icon={Shield}
      title="Privacy policy"
      titleAccent="your images never leave your device"
      description="Asset Melt is built around a simple promise: I don't want your files. This page explains what I do — and don't — collect when you use the site."
      lastUpdated={LAST_UPDATED}
    >
      <div className="not-prose my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Lock, title: 'No uploads', body: 'Your images never leave your device — ever.' },
          { icon: Eye, title: 'No image access', body: 'I cannot see, store, or access your files.' },
          { icon: UserX, title: 'No account', body: 'No sign-up, no login, no profile to track.' },
          { icon: Server, title: 'No backend', body: 'There is no server receiving your data.' },
        ].map((item) => (
          <div
            key={item.title}
            className="glass-surface flex flex-col gap-2 rounded-xl border border-border/50 p-4"
          >
            <item.icon className="size-4 text-primary" aria-hidden="true" />
            <p className="font-display text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <h2 id="summary">Who runs {SITE_NAME}</h2>
      <p>
        <strong className="text-foreground">{SITE_NAME}</strong> ({SITE_URL}) is a free,
        client-side image compression and conversion tool built and operated by {SITE_AUTHOR}. The
        product runs in your web browser using WebAssembly codecs — there is no backend that
        receives your image files.
      </p>
      <p>
        If you have questions about this policy, contact me at{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>.
      </p>

      <h2 id="images">Your images and files</h2>
      <p>
        When you drop images into {SITE_NAME} Studio, every decode, transform, and encode happens
        locally on your device inside Web Workers. Your originals and outputs are not transmitted
        to {SITE_NAME} or any server I operate.
      </p>
      <p>
        Because processing is local, I cannot access, store, back up, or recover your files. If you
        close the tab or clear your browser data, in-progress work may be lost unless you have
        exported results or used the optional offline preparation feature.
      </p>

      <h2 id="analytics">Analytics and usage data</h2>
      <p>
        To improve the product and understand traffic patterns, I use the following services. These
        tools collect <em>website usage</em> data — not the contents of your images.
      </p>

      <h3>Google Analytics 4</h3>
      <p>
        I use Google Analytics 4 to measure page views and custom events such as files added,
        processing completed, and exports. Google may set cookies and process data according to its
        own privacy policy. You can opt out via browser extensions such as the Google Analytics
        Opt-out Add-on, or by adjusting your browser&apos;s cookie settings.
      </p>

      <h3>Vercel Analytics &amp; Speed Insights</h3>
      <p>
        The site is hosted on Vercel, which collects anonymized web vitals and performance metrics
        (for example, page load times and Core Web Vitals). This helps me keep the site fast.
        Vercel Analytics does not track individual users across sites for advertising purposes.
      </p>

      <p>
        Analytics events I record are limited to aggregate usage — file counts, output formats,
        preset selections — never filenames, image pixels, or file contents.
      </p>

      <h2 id="local-storage">Local storage, cookies &amp; offline mode</h2>
      <p>
        {SITE_NAME} may store data in your browser&apos;s local storage or IndexedDB to remember
        preferences (such as theme), pipeline settings, or to support the optional Progressive Web
        App (PWA) offline experience.
      </p>
      <p>
        Offline preparation downloads the Studio application shell and codec assets to your device
        so you can compress images without a network connection. This data stays on your device and
        is not sent to me.
      </p>
      <p>
        You can clear this data at any time through your browser&apos;s site settings or by
        uninstalling the installed PWA.
      </p>

      <h2 id="third-parties">Third-party services</h2>
      <p>I rely on a small number of third parties to host and measure the site:</p>
      <ul>
        <li>
          <strong className="text-foreground">Vercel</strong> — hosting and CDN (
          <a
            href="https://vercel.com/legal/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy notice
          </a>
          )
        </li>
        <li>
          <strong className="text-foreground">Google Analytics</strong> — usage analytics (
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </a>
          )
        </li>
      </ul>
      <p>
        I do not use advertising networks, data brokers, or social login providers. Optional crypto
        donation addresses displayed on the site are public wallet addresses — no transaction data
        flows through {SITE_NAME}.
      </p>

      <h2 id="rights">Your choices</h2>
      <p>
        Because I don&apos;t operate user accounts, there is no profile to delete on my end. You
        can:
      </p>
      <ul>
        <li>Block or delete cookies in your browser settings</li>
        <li>Use browser privacy modes or extensions to limit analytics</li>
        <li>Clear site data to remove locally stored preferences and offline packs</li>
        <li>Use the Studio without installing the PWA or enabling offline preparation</li>
      </ul>
      <p>
        Depending on where you live, you may have rights to access, correct, or delete personal
        data held by third-party analytics providers. Contact them directly, or reach out to me and
        I will help where I can.
      </p>

      <h2 id="children">Children&apos;s privacy</h2>
      <p>
        {SITE_NAME} is a general-purpose utility and is not directed at children under 13. I do not
        knowingly collect personal information from children. If you believe a child has provided
        me information, please contact me and I will take appropriate steps.
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        I may update this privacy policy as the product evolves. When I make material changes, I
        will update the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of{' '}
        {SITE_NAME} after changes constitutes acceptance of the revised policy.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Questions, concerns, or data requests:{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>
      </p>
      <p>
        Learn more about the product on the <Link to="/about">About</Link> page or read more about
        me on the <Link to="/author">Author</Link> page.
      </p>

      <div className="not-prose mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Lock, label: 'No uploads' },
          { icon: Eye, label: 'No image access' },
          { icon: Server, label: 'No backend' },
          { icon: Cookie, label: 'Analytics only' },
          { icon: HardDrive, label: 'Local-first' },
          { icon: Mail, label: 'Reachable by email' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 font-mono text-[11px] text-muted-foreground"
          >
            <item.icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {item.label}
          </div>
        ))}
      </div>
    </TrustPageShell>
  )
}
