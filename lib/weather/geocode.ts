import type { GeocodeResult } from "@/lib/weather/types";

type GeocodeApiRow = {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
};

function formatGeocodeLabel(row: GeocodeApiRow): string {
  const parts = [row.name];
  if (row.admin1) parts.push(row.admin1);
  parts.push(row.country);
  return parts.join(", ");
}

export async function searchCities(
  query: string,
  limit = 6,
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    name: query.trim(),
    count: String(limit),
    language: "en",
    format: "json",
  });
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) {
    throw new Error(`Geocode failed: ${res.status}`);
  }
  const data = (await res.json()) as { results?: GeocodeApiRow[] };
  return (data.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    admin1: row.admin1 ?? null,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    label: formatGeocodeLabel(row),
  }));
}
