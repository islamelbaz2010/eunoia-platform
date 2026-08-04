import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Eunoia',
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

export default function PrivacyPage() {
  return (
    <main style={styles.page}>
      <article style={styles.shell}>
        <div style={styles.eyebrow}>Eunoia</div>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.muted}>Last updated: 21 July 2026. This page is a product-facing baseline and should be reviewed by legal counsel before broad commercial rollout.</p>

        <div style={styles.notice}>
          Eunoia is a B2B intelligence product. Do not upload sensitive personal data, private customer lists, payment details, or confidential third-party information unless a signed agreement explicitly permits it.
        </div>

        <h2 style={styles.h2}>Information We Process</h2>
        <p style={styles.p}>The platform may process account details, authentication identifiers, workspace information, report inputs, generated report content, research request status, and operational metadata such as timestamps and usage counts.</p>

        <h2 style={styles.h2}>How Information Is Used</h2>
        <ul style={styles.ul}>
          <li>Authenticate users and maintain dashboard sessions.</li>
          <li>Generate real estate, lead research, talent research, and market intelligence outputs.</li>
          <li>Store report history and failed request status for retry and support workflows.</li>
          <li>Enforce plan limits, rate limits, and product usage controls.</li>
          <li>Improve reliability, security, and customer support.</li>
        </ul>

        <h2 style={styles.h2}>Service Providers</h2>
        <p style={styles.p}>The product is built with Supabase, Vercel, OpenAI, SerpAPI, Upstash Redis, Resend, and optional enrichment providers such as Apollo.io when configured. These services may process data only as needed to provide the product features.</p>

        <h2 style={styles.h2}>Data Access And Retention</h2>
        <p style={styles.p}>Authenticated users can view their own report history through dashboard pages protected by Supabase row-level security. Formal self-service data export and deletion workflows are not yet implemented and remain part of the commercial readiness backlog.</p>

        <h2 style={styles.h2}>Contact</h2>
        <p style={styles.p}>For privacy requests or questions, contact <a style={styles.link} href="mailto:hello@eunoia.eg">hello@eunoia.eg</a>.</p>

        <p style={styles.muted}><Link style={styles.link} href="/login">Back to login</Link></p>
      </article>
    </main>
  )
}
