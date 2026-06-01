import { redirect } from 'next/navigation'

// Root redirects to dashboard (if authed) or login (handled by middleware)
export default function RootPage() {
  redirect('/dashboard')
}
