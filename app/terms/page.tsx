import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Eunoia',
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FAF5EF',
    color: '#1A1018',
    fontFamily: "'Inter','Cairo','Segoe UI',sans-serif",
    padding: '40px 16px',
  },
  shell: {
    maxWidth: 840,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #E8E2DA',
    borderRadius: 12,
    padding: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#9A9090',
    marginBottom: 8,
  },
  h1: { fontSize: 30, fontWeight: 900, marginBottom: 8 },
  muted: { color: '#6B6560', fontSize: 13, lineHeight: 1.6 },
  h2: { fontSize: 17, fontWeight: 800, marginTop: 26, marginBottom: 8 },
  p: { color: '#3A3430', fontSize: 14, lineHeight: 1.7, marginBottom: 10 },
  ul: { color: '#3A3430', fontSize: 14, lineHeight: 1.7, paddingLeft: 20 },
  notice: {
    background: '#FFF8E8',
    border: '1px solid #F0DDA0',
    color: '#6F4C08',
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    lineHeight: 1.6,
    marginTop: 18,
  },
  link: { color: '#7C3AED', fontWeight: 700, textDecoration: 'none' },
}

export default function TermsPage() {
  return (
    <main style={styles.page}>
      <article style={styles.shell}>
        <div style={styles.eyebrow}>Eunoia</div>
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.muted}>Last updated: 21 July 2026. This baseline page documents current product expectations and requires legal review before broad commercial rollout.</p>

        <div style={styles.notice}>
          Eunoia outputs are decision-support materials, not legal, financial, investment, tax, or professional advice. Users remain responsible for verifying facts before outreach, hiring, investment, or operational decisions.
        </div>

        <h2 style={styles.h2}>Use Of The Platform</h2>
        <p style={styles.p}>Users may use Eunoia to generate marketing intelligence, real estate analysis, lead research, talent research, and market insights for lawful business purposes. Users must not attempt to bypass authentication, rate limits, plan limits, or tenant isolation controls.</p>

        <h2 style={styles.h2}>User Inputs</h2>
        <ul style={styles.ul}>
          <li>Users are responsible for the accuracy and legality of inputs they submit.</li>
          <li>Users should avoid submitting sensitive personal data or confidential third-party information.</li>
          <li>Users must verify generated research before contacting companies or candidates.</li>
        </ul>

        <h2 style={styles.h2}>Generated Outputs</h2>
        <p style={styles.p}>AI-generated and search-assisted outputs may contain errors, outdated information, or incomplete context. Confidence scores and summaries are product signals, not guarantees. Talent Finder outputs are estimates and should be independently validated.</p>

        <h2 style={styles.h2}>Plans And Usage</h2>
        <p style={styles.p}>Plan limits, rate limits, and fair-use restrictions may apply. Billing and self-serve upgrades are not yet fully implemented in this repository; plan changes currently require administrator support.</p>

        <h2 style={styles.h2}>Availability</h2>
        <p style={styles.p}>The service may depend on third-party providers including AI, search, database, email, hosting, and enrichment services. Availability and output quality may be affected by those providers.</p>

        <h2 style={styles.h2}>Contact</h2>
        <p style={styles.p}>For terms or account questions, contact <a style={styles.link} href="mailto:hello@eunoia.eg">hello@eunoia.eg</a>.</p>

        <p style={styles.muted}><Link style={styles.link} href="/login">Back to login</Link></p>
      </article>
    </main>
  )
}
