const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    cache: 'no-store',
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getSiteSettings() {
  const data = await fetchAPI<{ success: boolean; data: Record<string, { key: string; value: string; type: string; label: string }[]> }>('/api/site-settings');
  return data.data;
}

export async function getSections() {
  const data = await fetchAPI<{ success: boolean; data: any[] }>('/api/sections');
  return data.data;
}

export async function getSection(slug: string) {
  const data = await fetchAPI<{ success: boolean; data: any }>(`/api/sections/${slug}`);
  return data.data;
}

export async function getNavigation(location: string) {
  const data = await fetchAPI<{ success: boolean; data: any[] }>(`/api/navigation/${location}`);
  return data.data;
}

export async function getPricingTiers() {
  const data = await fetchAPI<{ success: boolean; data: any[] }>('/api/pricing-tiers');
  return data.data;
}
