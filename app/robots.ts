import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Unlisted — reachable only by direct URL, kept out of crawling too.
      disallow: ["/bengpt", "/api/bengpt"],
    },
    sitemap: "https://benakoka.com/sitemap.xml",
  };
}
