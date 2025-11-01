// lib/fetcher.ts
export async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}
