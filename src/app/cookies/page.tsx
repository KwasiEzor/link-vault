import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | LinkVault",
  description: "Read our cookie policy and how we use cookies to improve your experience.",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout 
      title="Cookie Policy" 
      description="Understanding how we use cookies and tracking technologies."
    >
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Introduction</h2>
        <p>
          LinkVault uses cookies and similar technologies to provide a better, faster, 
          and safer experience. Cookies are small text files stored on your browser 
          that allow us to recognize you across visits.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Essential Cookies</h2>
        <p>
          Some cookies are essential for LinkVault to function correctly:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Authentication:</strong> Cookies that maintain your logged-in state.</li>
          <li><strong>Security:</strong> Cookies used to prevent cross-site request forgery (CSRF).</li>
          <li><strong>Consent:</strong> A cookie to remember your cookie preferences.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Managing Cookies</h2>
        <p>
          Most web browsers allow you to control cookies through their settings. 
          However, disabling essential cookies may affect your ability to use LinkVault.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Updates</h2>
        <p>
          We may update this Cookie Policy from time to time. We encourage you to 
          periodically review this page for the latest information on our cookie 
          practices.
        </p>
      </section>
    </LegalPageLayout>
  );
}
