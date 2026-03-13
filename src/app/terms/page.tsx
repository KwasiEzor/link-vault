import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | LinkVault",
  description: "Read our terms of service and conditions for using LinkVault.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout 
      title="Terms of Service" 
      description="Guidelines and terms for using the LinkVault platform."
    >
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Introduction</h2>
        <p>
          By using LinkVault, you agree to comply with and be bound by the following 
          Terms of Service. Please review them carefully.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">User Responsibilities</h2>
        <p>
          Users are responsible for the links and content they curate on the platform:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Lawful Use:</strong> You may only store links to content that you have 
          the right to access and share.</li>
          <li><strong>Content Ownership:</strong> You retain ownership of the metadata you 
          create, but LinkVault must be able to display it within the application.</li>
          <li><strong>Prohibited Activity:</strong> You may not use LinkVault for any 
          illegal or unauthorized purpose.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Service Availability</h2>
        <p>
          LinkVault is provided &quot;as is&quot; and &quot;as available.&quot; While we strive for 
          maximum uptime, we do not guarantee uninterrupted service.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Termination</h2>
        <p>
          We reserve the right to suspend or terminate access to LinkVault for any 
          reason, including violation of these terms.
        </p>
      </section>
    </LegalPageLayout>
  );
}
