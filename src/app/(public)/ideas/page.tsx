import type { Metadata } from "next";
import Link from "next/link";
import { IdeasBrowser } from "@/components/ideas/ideas-browser";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { listMyIdeas, listPublicIdeas } from "@/lib/data/ideas";

export const metadata: Metadata = {
  title: "Kreator pomysłów",
  description: "Zgłoś pomysł na innowację społeczną w krótkiej fiszce.",
};

export default async function IdeasPage() {
  const user = await getCurrentUser();
  const [publicIdeas, drafts] = await Promise.all([
    listPublicIdeas(),
    user ? listMyIdeas(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="font-serif text-3xl text-heading">Kreator pomysłów</h1>
          <p>
            Opisz pomysł na jednej fiszce. Krótko: o co chodzi, dla kogo i na
            jakim jest etapie.
          </p>
          <a href="#szablon-kanwy" className="text-primary underline">
            Pobierz szablon kanwy (PDF, wkrótce)
          </a>
        </div>
        <Link href="/ideas/new" className={buttonVariants()}>
          Dodaj pomysł
        </Link>
      </header>
      <IdeasBrowser publicIdeas={publicIdeas} drafts={drafts} />
    </div>
  );
}
