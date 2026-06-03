'use client'

interface ProposalItem {
  title: string
  desc: string
  price: string
  best_for?: string
  reasoning?: string
}

interface ProposalCardsProps {
  items: ProposalItem[]
}

export function ProposalCards({ items }: ProposalCardsProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">💼</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>Our Proposal</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 flex flex-col border transition-all"
            style={i === 0 ? {
              borderColor: 'var(--gold-border)',
              background: 'var(--gold-bg)',
            } : {
              borderColor: 'var(--border)',
              background: 'var(--muted)',
            }}
          >
            {i === 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-3 px-2.5 py-1 rounded-full w-fit"
                   style={{background:'var(--gold-bg)',color:'var(--gold)',border:'1px solid var(--gold-border)'}}>
                ★ Recommended
              </div>
            )}
            <h4 className="font-bold text-sm text-foreground mb-2">{item.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">{item.desc}</p>
            <div className="border-t border-border pt-4">
              <div className="text-xl font-bold" style={{color:'var(--gold)'}}>{item.price}</div>
              {item.best_for && (
                <div className="text-xs text-muted-foreground mt-1">Best for: {item.best_for}</div>
              )}
              {item.reasoning && (
                <div className="text-xs text-muted-foreground/70 mt-1.5 italic">{item.reasoning}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
