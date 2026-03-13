import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LinkVault",
  description: "Read our privacy policy and how we protect your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout 
      title="Privacy Policy" 
      description="Your privacy and data security are our top priorities."
    >
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Introduction</h2>
        <p>
          At LinkVault, we are committed to protecting your privacy. This Privacy Policy 
          outlines the types of information we collect and how we use, maintain, and 
          protect it.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Data Collection</h2>
        <p>
          We only collect information that is necessary for the core functionality 
          of LinkVault:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Authentication:</strong> Your email and name when you sign in via Auth.js.</li>
          <li><strong>Curated Data:</strong> The URLs, titles, and descriptions of the links you save.</li>
          <li><strong>System Info:</strong> Basic browser and device information for security and analytics.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Data Protection</h2>
        <p>
          We implement rigorous security measures, including encryption and secure 
          database management, to protect your data from unauthorized access, 
          alteration, or disclosure.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Third-Party Services</h2>
        <p>
          LinkVault uses trusted third-party services for hosting, database management, 
          and authentication. These providers are selected for their high standards 
          of security and data privacy.
        </p>
      </section>
    </LegalPageLayout>
  );
}
