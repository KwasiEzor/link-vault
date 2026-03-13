import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | LinkVault",
  description: "Learn how to use LinkVault to manage your digital resources.",
};

export default function DocsPage() {
  return (
    <LegalPageLayout 
      title="Documentation" 
      description="Learn how to master your digital vault."
    >
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Introduction</h2>
        <p>
          LinkVault is a premium, minimalist workspace designed for digital curators. 
          It allows you to store, organize, and showcase your favorite web resources 
          with beautiful, high-fidelity previews.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Getting Started</h2>
        <p>
          To start adding links, you must first log in to the <strong>Admin Console</strong>. 
          From there, you can add new links by providing a URL. LinkVault will 
          automatically fetch metadata like title, description, and preview images.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Quick Add:</strong> Simply paste a URL and hit enter.</li>
          <li><strong>Organization:</strong> Group your links with tags for easy discovery.</li>
          <li><strong>Customization:</strong> Edit titles and descriptions to suit your needs.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Features</h2>
        <p>
          LinkVault comes packed with features to enhance your curation experience:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Automatic Metadata:</strong> Real-time link preview generation.</li>
          <li><strong>Search & Filter:</strong> Instantly find what you need with powerful search.</li>
          <li><strong>Glassmorphic UI:</strong> A premium, dark-themed interface focused on clarity.</li>
          <li><strong>Responsive Design:</strong> Access your vault from any device.</li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
