import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Contact a Kansas City Real Estate Agent",
  description:
    "Get in touch with Gezahegn Worku of BHG Kansas City Homes to buy or sell a home in the Kansas City metro. Call (913) 407-8620 or send a message and get a reply the same day.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
