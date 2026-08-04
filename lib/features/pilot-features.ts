/**
 * Pilot v1.0 feature flags.
 * Set a flag to `true` to make that module visible in the navigation.
 * Routes are never deleted — only hidden via these flags.
 * Flip to `true` in Phase 2 to re-enable the module.
 */
export const PILOT_FEATURES = {
  RESEARCH_INTELLIGENCE: false, // Lead Finder + Talent Finder
  MARKET_INTELLIGENCE:   false, // Egypt market trends / Analytics
} as const

export type PilotFeatureKey = keyof typeof PILOT_FEATURES
