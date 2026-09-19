import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Atelier",
  description: "How Atelier handles account and marketplace information.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-6 sm:py-12">
      <header className="space-y-3 border-b border-line pb-8">
        <p className="eyebrow">ATELIER</p>
        <h1 className="text-4xl sm:text-5xl">Privacy</h1>
        <p className="text-muted">Last updated: 19 September 2026</p>
      </header>
      <div className="space-y-7 leading-7 text-muted">
        <section><h2 className="mb-2 text-2xl text-ink">What we collect</h2><p>When you join Atelier, we store the account details you provide or approve through Google, including your email address, name, profile image, and the profile details, shelves, listings, messages, and bids you choose to create.</p></section>
        <section><h2 className="mb-2 text-2xl text-ink">How we use it</h2><p>We use this information to run your profile, show the content you publish to other Atelier members, enable marketplace interactions, and keep the service safe and reliable. We do not sell personal information.</p></section>
        <section><h2 className="mb-2 text-2xl text-ink">Google sign-in</h2><p>Google sign-in is optional. If you use it, Atelier receives only the basic account information you approve for authentication. We do not receive or store your Google password.</p></section>
        <section><h2 className="mb-2 text-2xl text-ink">Your choices</h2><p>You can edit or unpublish your profile and listings in Atelier. To request deletion of your account or personal data, contact us at <a className="text-accent underline underline-offset-4" href="mailto:mohnishas@gmail.com">mohnishas@gmail.com</a>.</p></section>
      </div>
      <p className="border-t border-line pt-6 text-sm text-muted"><Link className="text-accent underline underline-offset-4" href="/terms">Terms of service</Link></p>
    </article>
  );
}
