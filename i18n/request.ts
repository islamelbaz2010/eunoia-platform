import { getRequestConfig } from 'next-intl/server'

// Simplified i18n setup — Phase 2 will add full AR/EN routing
// For now, default to English and load messages from locale files
export default getRequestConfig(async () => {
  const locale = 'en'

  return {
    locale,
    messages: {},
  }
})
