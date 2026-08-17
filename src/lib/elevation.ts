// Free, no-key elevation lookup via Open-Elevation (community-run, open-source
// terrain dataset). Used only as a fallback when the device's own GPS altitude
// reading isn't available. https://open-elevation.com/
export async function lookupElevation(latitude: number, longitude: number): Promise<number | null> {
  try {
    const url = new URL('https://api.open-elevation.com/api/v1/lookup')
    url.searchParams.set('locations', `${latitude},${longitude}`)

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null

    const data: { results?: { elevation?: number }[] } = await res.json()
    const elevation = data.results?.[0]?.elevation
    return typeof elevation === 'number' ? elevation : null
  } catch {
    return null
  }
}
