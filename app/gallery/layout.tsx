import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Property Photo Gallery",
  description:
    "Photos of homes listed and sold across the Kansas City metro by Gezahegn Worku, BHG Kansas City Homes.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
