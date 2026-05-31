'use client'

interface ProposalItem {
  title: string
  desc: string
  price: string
  best_for?: string
}

interface ProposalCardsProps {
  items: ProposalItem[]
}

export function ProposalCards({ items }: ProposalCardsProps) {
  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5">
      <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-4">
        Our Proposal
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`rounded-xl p-5 border ${
              i === 0
                ? 'border-gold/30 bg-gold/5'
                : 'border-white/8 bg-white/3'
            }`}
          >
            {i === 0 && (
              <div className="text-gold text-xs font-semibold uppercase tracking-wider mb-2">
                Recommended
              </div>
            )}
            <h4 className="text-cream font-semibold text-sm mb-2">{item.title}</h4>
            <p className="text-cream/50 text-sm mb-4 leading-relaxed">{item.desc}</p>
            <div className="mt-auto">
              <div className="text-gold font-bold text-lg">{item.price}</div>
              {item.best_for && (
                <div className="text-cream/40 text-xs mt-1">Best for: {item.best_for}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
