export type GeoData = {
  country: string   // ISO-2 uppercase ("MX", "US", "")
  ip: string
  city: string
  state: string
  zip: string
  currency: string  // moeda base da região ("USD", "EUR", "GBP", "CHF")
  region: string    // região de pricing ("DEFAULT", "USD", "EUR", "GBP", "CHF")
}
