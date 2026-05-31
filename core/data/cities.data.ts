export interface CityData {
  key: string
  ar: string
  en: string
  country: CountryKey
  cplMultiplier: number
}

export type CountryKey =
  | 'egypt' | 'uae' | 'saudi' | 'kuwait'
  | 'qatar' | 'bahrain' | 'oman' | 'jordan'
  | 'morocco' | 'iraq'

export const CITY_CPL_MULTIPLIERS: Record<string, number> = {
  cairo: 1.0,
  newcairo: 1.35,
  giza: 0.92,
  nasr: 0.95,
  october: 0.88,
  shorouk: 0.90,
  newadmin: 1.20,
  mansoura: 0.75,
  tanta: 0.72,
  alex: 0.88,
  zagazig: 0.70,
  portsaid: 0.78,
  ismailia: 0.75,
  suez: 0.78,
  luxor: 0.80,
  aswan: 0.80,
  sharm: 1.10,
  hurghada: 1.05,
  dubai: 2.8,
  abudhabi: 2.6,
  sharjah: 2.2,
  ajman: 2.0,
  rak: 1.9,
  fujairah: 1.8,
  riyadh: 2.5,
  jeddah: 2.3,
  mecca: 2.2,
  medina: 2.1,
  dammam: 2.1,
  khobar: 2.0,
  abha: 1.8,
  qassim: 1.7,
  hail: 1.6,
  jazan: 1.5,
  kuwait: 2.8,
  hawalli: 2.5,
  farwaniya: 2.3,
  ahmadi: 2.2,
  jahra: 2.1,
  doha: 2.6,
  rayyan: 2.4,
  wakra: 2.2,
  manama: 2.2,
  muharraq: 2.0,
  riffa: 2.1,
  muscat: 2.0,
  salalah: 1.7,
  sohar: 1.6,
  amman: 1.8,
  zarqa: 1.5,
  irbid: 1.4,
  aqaba: 1.6,
  casablanca: 1.5,
  rabat: 1.4,
  marrakech: 1.5,
  fes: 1.3,
  tangier: 1.4,
  baghdad: 1.6,
  basra: 1.4,
  erbil: 1.7,
}

export const CITIES: Record<CountryKey, CityData[]> = {
  egypt: [
    { key: 'cairo', ar: 'القاهرة', en: 'Cairo', country: 'egypt', cplMultiplier: 1.0 },
    { key: 'alex', ar: 'الإسكندرية', en: 'Alexandria', country: 'egypt', cplMultiplier: 0.88 },
    { key: 'giza', ar: 'الجيزة', en: 'Giza', country: 'egypt', cplMultiplier: 0.92 },
    { key: 'newcairo', ar: 'القاهرة الجديدة', en: 'New Cairo', country: 'egypt', cplMultiplier: 1.35 },
    { key: 'october', ar: '6 أكتوبر', en: '6th October', country: 'egypt', cplMultiplier: 0.88 },
    { key: 'shorouk', ar: 'الشروق', en: 'El Shorouk', country: 'egypt', cplMultiplier: 0.90 },
    { key: 'nasr', ar: 'مدينة نصر', en: 'Nasr City', country: 'egypt', cplMultiplier: 0.95 },
    { key: 'newadmin', ar: 'العاصمة الإدارية', en: 'New Capital', country: 'egypt', cplMultiplier: 1.20 },
    { key: 'mansoura', ar: 'المنصورة', en: 'Mansoura', country: 'egypt', cplMultiplier: 0.75 },
    { key: 'tanta', ar: 'طنطا', en: 'Tanta', country: 'egypt', cplMultiplier: 0.72 },
    { key: 'zagazig', ar: 'الزقازيق', en: 'Zagazig', country: 'egypt', cplMultiplier: 0.70 },
    { key: 'damietta', ar: 'دمياط', en: 'Damietta', country: 'egypt', cplMultiplier: 0.75 },
    { key: 'portsaid', ar: 'بورسعيد', en: 'Port Said', country: 'egypt', cplMultiplier: 0.78 },
    { key: 'ismailia', ar: 'الإسماعيلية', en: 'Ismailia', country: 'egypt', cplMultiplier: 0.75 },
    { key: 'suez', ar: 'السويس', en: 'Suez', country: 'egypt', cplMultiplier: 0.78 },
    { key: 'luxor', ar: 'الأقصر', en: 'Luxor', country: 'egypt', cplMultiplier: 0.80 },
    { key: 'aswan', ar: 'أسوان', en: 'Aswan', country: 'egypt', cplMultiplier: 0.80 },
    { key: 'sharm', ar: 'شرم الشيخ', en: 'Sharm El-Sheikh', country: 'egypt', cplMultiplier: 1.10 },
    { key: 'hurghada', ar: 'الغردقة', en: 'Hurghada', country: 'egypt', cplMultiplier: 1.05 },
  ],
  uae: [
    { key: 'dubai', ar: 'دبي', en: 'Dubai', country: 'uae', cplMultiplier: 2.8 },
    { key: 'abudhabi', ar: 'أبوظبي', en: 'Abu Dhabi', country: 'uae', cplMultiplier: 2.6 },
    { key: 'sharjah', ar: 'الشارقة', en: 'Sharjah', country: 'uae', cplMultiplier: 2.2 },
    { key: 'ajman', ar: 'عجمان', en: 'Ajman', country: 'uae', cplMultiplier: 2.0 },
    { key: 'rak', ar: 'رأس الخيمة', en: 'Ras Al Khaimah', country: 'uae', cplMultiplier: 1.9 },
    { key: 'fujairah', ar: 'الفجيرة', en: 'Fujairah', country: 'uae', cplMultiplier: 1.8 },
  ],
  saudi: [
    { key: 'riyadh', ar: 'الرياض', en: 'Riyadh', country: 'saudi', cplMultiplier: 2.5 },
    { key: 'jeddah', ar: 'جدة', en: 'Jeddah', country: 'saudi', cplMultiplier: 2.3 },
    { key: 'mecca', ar: 'مكة المكرمة', en: 'Mecca', country: 'saudi', cplMultiplier: 2.2 },
    { key: 'medina', ar: 'المدينة المنورة', en: 'Medina', country: 'saudi', cplMultiplier: 2.1 },
    { key: 'dammam', ar: 'الدمام', en: 'Dammam', country: 'saudi', cplMultiplier: 2.1 },
    { key: 'khobar', ar: 'الخبر', en: 'Al Khobar', country: 'saudi', cplMultiplier: 2.0 },
    { key: 'abha', ar: 'أبها', en: 'Abha', country: 'saudi', cplMultiplier: 1.8 },
    { key: 'qassim', ar: 'القصيم', en: 'Al-Qassim', country: 'saudi', cplMultiplier: 1.7 },
    { key: 'hail', ar: 'حائل', en: 'Hail', country: 'saudi', cplMultiplier: 1.6 },
    { key: 'jazan', ar: 'جازان', en: 'Jazan', country: 'saudi', cplMultiplier: 1.5 },
  ],
  kuwait: [
    { key: 'kuwait', ar: 'الكويت', en: 'Kuwait City', country: 'kuwait', cplMultiplier: 2.8 },
    { key: 'hawalli', ar: 'حولي', en: 'Hawalli', country: 'kuwait', cplMultiplier: 2.5 },
    { key: 'farwaniya', ar: 'الفروانية', en: 'Al Farwaniyah', country: 'kuwait', cplMultiplier: 2.3 },
    { key: 'ahmadi', ar: 'الأحمدي', en: 'Al Ahmadi', country: 'kuwait', cplMultiplier: 2.2 },
    { key: 'jahra', ar: 'الجهراء', en: 'Al Jahra', country: 'kuwait', cplMultiplier: 2.1 },
  ],
  qatar: [
    { key: 'doha', ar: 'الدوحة', en: 'Doha', country: 'qatar', cplMultiplier: 2.6 },
    { key: 'rayyan', ar: 'الريان', en: 'Al Rayyan', country: 'qatar', cplMultiplier: 2.4 },
    { key: 'wakra', ar: 'الوكرة', en: 'Al Wakrah', country: 'qatar', cplMultiplier: 2.2 },
  ],
  bahrain: [
    { key: 'manama', ar: 'المنامة', en: 'Manama', country: 'bahrain', cplMultiplier: 2.2 },
    { key: 'muharraq', ar: 'المحرق', en: 'Muharraq', country: 'bahrain', cplMultiplier: 2.0 },
    { key: 'riffa', ar: 'الرفاع', en: 'Riffa', country: 'bahrain', cplMultiplier: 2.1 },
  ],
  oman: [
    { key: 'muscat', ar: 'مسقط', en: 'Muscat', country: 'oman', cplMultiplier: 2.0 },
    { key: 'salalah', ar: 'صلالة', en: 'Salalah', country: 'oman', cplMultiplier: 1.7 },
    { key: 'sohar', ar: 'صحار', en: 'Sohar', country: 'oman', cplMultiplier: 1.6 },
  ],
  jordan: [
    { key: 'amman', ar: 'عمان', en: 'Amman', country: 'jordan', cplMultiplier: 1.8 },
    { key: 'zarqa', ar: 'الزرقاء', en: 'Zarqa', country: 'jordan', cplMultiplier: 1.5 },
    { key: 'irbid', ar: 'إربد', en: 'Irbid', country: 'jordan', cplMultiplier: 1.4 },
    { key: 'aqaba', ar: 'العقبة', en: 'Aqaba', country: 'jordan', cplMultiplier: 1.6 },
  ],
  morocco: [
    { key: 'casablanca', ar: 'الدار البيضاء', en: 'Casablanca', country: 'morocco', cplMultiplier: 1.5 },
    { key: 'rabat', ar: 'الرباط', en: 'Rabat', country: 'morocco', cplMultiplier: 1.4 },
    { key: 'marrakech', ar: 'مراكش', en: 'Marrakech', country: 'morocco', cplMultiplier: 1.5 },
    { key: 'fes', ar: 'فاس', en: 'Fez', country: 'morocco', cplMultiplier: 1.3 },
    { key: 'tangier', ar: 'طنجة', en: 'Tangier', country: 'morocco', cplMultiplier: 1.4 },
  ],
  iraq: [
    { key: 'baghdad', ar: 'بغداد', en: 'Baghdad', country: 'iraq', cplMultiplier: 1.6 },
    { key: 'basra', ar: 'البصرة', en: 'Basra', country: 'iraq', cplMultiplier: 1.4 },
    { key: 'erbil', ar: 'أربيل', en: 'Erbil', country: 'iraq', cplMultiplier: 1.7 },
  ],
}

export const ALL_CITIES: CityData[] = Object.values(CITIES).flat()

export function getCity(key: string): CityData {
  return ALL_CITIES.find((c) => c.key === key) ?? {
    key,
    ar: key,
    en: key,
    country: 'egypt',
    cplMultiplier: 1.0,
  }
}

export function getCityMultiplier(key: string): number {
  return CITY_CPL_MULTIPLIERS[key] ?? 1.0
}

export const COUNTRY_LABELS: Record<CountryKey, { ar: string; en: string }> = {
  egypt: { ar: 'مصر', en: 'Egypt' },
  uae: { ar: 'الإمارات', en: 'UAE' },
  saudi: { ar: 'السعودية', en: 'Saudi Arabia' },
  kuwait: { ar: 'الكويت', en: 'Kuwait' },
  qatar: { ar: 'قطر', en: 'Qatar' },
  bahrain: { ar: 'البحرين', en: 'Bahrain' },
  oman: { ar: 'عُمان', en: 'Oman' },
  jordan: { ar: 'الأردن', en: 'Jordan' },
  morocco: { ar: 'المغرب', en: 'Morocco' },
  iraq: { ar: 'العراق', en: 'Iraq' },
}
