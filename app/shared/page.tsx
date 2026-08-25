import type { Metadata } from "next";
import SharedCollectionView from "@/components/SharedCollectionView";

// Shared collections live entirely in the URL hash (client-only) and are
// personal snapshots — never index them.
export const metadata: Metadata = {
  title: "Shared collection",
  robots: { index: false, follow: false },
};

export default function SharedPage() {
  return <SharedCollectionView />;
}
