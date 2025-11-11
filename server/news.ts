import type { NewsItem } from './types';

export function determineCategory(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('waste') || lowerText.includes('disposal')) return 'Waste Management';
  if (lowerText.includes('recycl')) return 'Recycling';
  if (lowerText.includes('circular') || lowerText.includes('sustainability')) return 'Circular Economy';
  if (lowerText.includes('compliance') || lowerText.includes('regulation')) return 'Compliance';
  return 'General';
}

export async function getBusinessSustainabilityNews(): Promise<{ articles: any[] }> {
  // Mock news data since we don't have NewsAPI key
  return {
    articles: [
      {
        title: "New Recycling Technologies Transform Waste Management",
        description: "Innovative recycling technologies are revolutionizing how businesses handle waste",
        source: { name: "Sustainability News" },
        url: "https://example.com/news/1",
        publishedAt: new Date().toISOString()
      },
      {
        title: "Australian Businesses Lead in Circular Economy Initiatives",
        description: "Local companies are adopting circular economy principles",
        source: { name: "Business Weekly" },
        url: "https://example.com/news/2",
        publishedAt: new Date().toISOString()
      }
    ]
  };
}

export type { NewsItem };
