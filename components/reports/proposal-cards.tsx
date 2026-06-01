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
    <div className="bg-surface border border-white/10 rounded-2xl p-6">
      <h3 className="text-[#c9a962] text-base font-bold mb-5">
        Our Proposal
      </h3>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`rounded-xl p-5 border flex flex-col ${
              i === 0
                ? 'border-[#c9a962]/40 bg-[#c9a962]/8 ring-1 ring-[#c9a962]/20'
                : 'border-white/12 bg-white/4'
            }`}
          >
            {i === 0 && (
              <div className="inline-flex items-center gap-1.5 text-[#c9a962] text-xs font-bold uppercase tracking-wider mb-3 bg-[#c9a962]/15 px-2.5 py-1 rounded-full w-fit">
                ★ Recommended
              </div>
            )}
            <h4 className="text-[#faf9f7] font-bold text-[15px] mb-2">{item.title}</h4>
            <p className="text-cream/60 text-[14px] mb-5 leading-relaxed flex-1">{item.desc}</p>
            <div className="border-t border-white/8 pt-4">
              <div className="text-[#c9a962] font-bold text-xl">{item.price}</div>
              {item.best_for && (
                <div className="text-cream/45 text-xs mt-1.5">Best for: {item.best_for}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
