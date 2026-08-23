import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Staticke rute. Album stranice su neograničene (generišu se iz API-ja po zahtevu),
 * pa ostaju van sitemap-a za sad; kasnije (uz bazu) dodajemo popularne album-e.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
