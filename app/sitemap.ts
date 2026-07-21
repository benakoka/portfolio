import type { MetadataRoute } from "next";

const BASE_URL = "https://benakoka.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/names`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/names/about`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/projects/nba-career-longevity.html`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
  ];
}
