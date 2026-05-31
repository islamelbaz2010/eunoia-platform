export interface BranchData {
  key: BranchKey
  name: string
  services: string
  channels: string
  usp: string
  tagline: string
  currency: string
  countryKeys: string[]
}

export type BranchKey = 'egypt' | 'uae'

export const BRANCHES: Record<BranchKey, BranchData> = {
  egypt: {
    key: 'egypt',
    name: 'Eunoia Zones Egypt',
    services: 'Performance Marketing, Media Buying, Social Media, Branding, Content, Video, Events, Web Dev',
    channels: 'Meta Ads, Google Ads, TikTok, SEO, Funnels',
    usp: 'Full-service 360 agency — Fast execution, high ROI, cost-effective.',
    tagline: 'Innovation Without Limitation',
    currency: 'EGP',
    countryKeys: ['egypt', 'jordan', 'morocco', 'iraq'],
  },
  uae: {
    key: 'uae',
    name: 'Eunoia Zones UAE',
    services: 'Lead Generation, Performance Marketing, Funnel Building, Conversion Optimization',
    channels: 'Meta Ads, Google Ads, LinkedIn, Funnels, Retargeting',
    usp: 'Performance-based — qualified leads or clients do not pay management fees.',
    tagline: 'Innovation Without Limitation',
    currency: 'AED',
    countryKeys: ['uae', 'saudi', 'kuwait', 'qatar', 'bahrain', 'oman'],
  },
}

export function getBranch(key: string): BranchData {
  return BRANCHES[key as BranchKey] ?? BRANCHES.egypt
}

export function getBranchForCountry(countryKey: string): BranchData {
  const branch = Object.values(BRANCHES).find((b) =>
    b.countryKeys.includes(countryKey)
  )
  return branch ?? BRANCHES.egypt
}
