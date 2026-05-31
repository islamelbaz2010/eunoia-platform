import { Shell } from '@/components/dashboard/shell'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <Shell title="Settings" subtitle="Manage your account and workspace">
      <div className="p-6 max-w-2xl space-y-6">
        {/* Account info */}
        <div className="bg-surface border border-white/8 rounded-xl p-6">
          <h2 className="text-cream font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <div className="text-cream/40 text-xs mb-1">Email</div>
              <div className="text-cream text-sm">{user?.email}</div>
            </div>
            <div>
              <div className="text-cream/40 text-xs mb-1">User ID</div>
              <div className="text-cream/60 text-xs font-mono">{user?.id}</div>
            </div>
          </div>
        </div>

        {/* API keys info */}
        <div className="bg-surface border border-white/8 rounded-xl p-6">
          <h2 className="text-cream font-semibold mb-2">AI Engine</h2>
          <p className="text-cream/40 text-sm mb-4">
            Report generation uses your workspace&apos;s OpenAI API key configured in environment variables.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-400/80 text-xs">
            API keys are managed server-side. Contact your admin to update credentials.
          </div>
        </div>

        {/* Plan info */}
        <div className="bg-surface border border-white/8 rounded-xl p-6">
          <h2 className="text-cream font-semibold mb-2">Plan</h2>
          <p className="text-cream/40 text-sm">
            Contact <span className="text-gold/80">hello@eunoia.eg</span> to upgrade your plan or add team members.
          </p>
        </div>
      </div>
    </Shell>
  )
}
