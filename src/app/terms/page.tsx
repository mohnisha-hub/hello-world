import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms | Atelier",
  description: "Terms for using Atelier.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-6 sm:py-12">
      <header className="space-y-3 border-b border-line pb-8">
        <p className="eyebrow">ATELIER</p>
        <h1 className="text-4xl sm:text-5xl">Terms of service</h1>
        <p className="text-muted">Last updated: 19 September 2026</p>
      </header>
      <div className="space-y-7 leading-7 text-muted">
        <section><h2 className="mb-2 text-2xl text-ink">Using Atelier</h2><p>Atelier is a community for discovering, collecting, and exchanging perfumes. Keep your account details accurate and use the service lawfully and respectfully.</p></section>
        <section><h2 className="mb-2 text-2xl text-ink">Listings and exchanges</h2><p>Members are responsible for the accuracy, authenticity, condition, price, and fulfilment of their listings. Atelier provides tools for members to connect; any transaction is agreed directly between the people involved.</p></section>
        <section><h2 className="mb-2 text-2xl text-ink">Community content</h2><p>You retain ownership of content you post. By publishing it on Atelier, you allow us to display it within the service so other members can discover your profile, shelf, collection, or listing.</p></section>
        <section><h2 className="mb-2 text-2xl text-ink">Contact</h2><p>Questions about these terms can be sent to <a className="text-accent underline underline-offset-4" href="mailto:mohnishas@gmail.com">mohnishas@gmail.com</a>.</p></section>
      </div>
      <p className="border-t border-line pt-6 text-sm text-muted"><Link className="text-accent underline underline-offset-4" href="/privacy">Privacy</Link></p>
    </article>
  );
}
