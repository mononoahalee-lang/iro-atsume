// Free, no-key reverse geocoding via OpenStreetMap Nominatim.
// Usage policy requires a descriptive User-Agent and reasonable (low) request volume,
// which fits this app's personal, low-traffic use. https://operations.osmfoundation.org/policies/nominatim/

type NominatimAddress = {
  city?: string
  town?: string
  village?: string
  suburb?: string
  city_district?: string
  state?: string
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(latitude))
    url.searchParams.set('lon', String(longitude))
    url.searchParams.set('accept-language', 'ja')
    url.searchParams.set('zoom', '14')

    const res = await fetch(url, {
      headers: { 'User-Agent': 'iro-atsume-personal-app/1.0 (color-collecting PWA, personal use)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null

    const data: { address?: NominatimAddress } = await res.json()
    const a = data.address
    if (!a) return null

    const locality = a.city ?? a.town ?? a.village ?? a.city_district ?? null
    const parts = [a.state, locality].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : null
  } catch {
    return null
  }
}
