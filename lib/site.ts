export const siteConfig = {
  name: "Vinyl Collection",
  shortName: "Vinyl",
  description:
    "Vodi evidenciju svoje kolekcije ploča. Pretraži bilo koji album i odmah vidi da li ga već imaš — bez ručnog unosa podataka.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export type SiteConfig = typeof siteConfig;
