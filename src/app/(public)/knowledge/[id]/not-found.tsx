import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { libraryHref } from "@/lib/knowledge/url";
import { cn } from "@/lib/utils";

export default function InnovationNotFound() {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-4">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
        Nie znaleźliśmy tej innowacji.
      </h1>
      <p className="text-lg">
        Adres może być nieaktualny albo innowacja została usunięta z biblioteki.
        Wróć do biblioteki i wyszukaj ją po nazwie.
      </p>
      <Link
        href={libraryHref()}
        className={cn(
          buttonVariants(),
          "h-auto min-h-11 px-4 py-2 text-base whitespace-normal",
        )}
      >
        Wróć do biblioteki innowacji
      </Link>
    </div>
  );
}
