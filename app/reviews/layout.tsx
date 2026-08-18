import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Client Reviews",
  description:
    "Read reviews from Kansas City buyers and sellers who worked with Gezahegn Worku of BHG Kansas City Homes, and leave a review of your own.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
