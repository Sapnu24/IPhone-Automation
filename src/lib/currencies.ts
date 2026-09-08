export interface CurrencyOption {
  code: string
  name: string
  locale: string
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'PHP', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'USD', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', locale: 'en-IE' },
  { code: 'GBP', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'INR', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'AUD', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', name: 'UAE Dirham', locale: 'en-AE' },
  { code: 'MXN', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'BRL', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'ZAR', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'NGN', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'IDR', name: 'Indonesian Rupiah', locale: 'id-ID' },
]
