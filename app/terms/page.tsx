export const metadata = {
  title: "Terms of Service | Geza Dream Homes",
  description: "Terms of Service for Geza Dream Homes website.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="text-gray-700 mb-4">
        Last updated: September 4, 2025
      </p>

      <section className="prose max-w-none prose-p:leading-relaxed">
        <p>
          Welcome to Geza Dream Homes. By using this website, you agree to the following terms. If you do not agree, please do not use the site.
        </p>

        <h2>Use of the Site</h2>
        <p>
          This site provides real estate information and resources. Content is for informational purposes only and is not guaranteed to be accurate or up-to-date. Listings and market data may change without notice.
        </p>

        <h2>Reviews and Testimonials</h2>
        <p>
          Reviews submitted to this site must be truthful and respectful. We reserve the right to remove content at our discretion, including content that is offensive, spam, or otherwise inappropriate.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All logos, branding, images, and content are the property of their respective owners and may not be reproduced without permission.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Geza Dream Homes and its representatives are not liable for any damages arising from the use of this site.
        </p>

        <h2>Contact</h2>
        <p>
          For questions regarding these Terms, contact:
        </p>
        <ul>
          <li>Phone: (913) 407-8620</li>
          <li>Email: <a href="mailto:gezarealesteteagent@gmail.com">gezarealesteteagent@gmail.com</a></li>
          <li>Work Email: <a href="mailto:gworku@remax.net">gworku@remax.net</a></li>
          <li>Office: RE/MAX Beyond, 13470 S Arapaho Dr STE 180, Olathe, KS 66062</li>
        </ul>
      </section>
    </main>
  );
}
