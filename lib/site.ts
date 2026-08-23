export const siteConfig = {
  name: "Vinyl Collection",
  shortName: "Vinyl",
  description:
    "Keep track of your vinyl record collection. Search any album and instantly see whether you already own it — no manual data entry.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export type SiteConfig = typeof siteConfig;
