import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InnovationTestNotFound() {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-4">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
        Nie znaleźliśmy tej innowacji.
      </h1>
      <p className="text-lg">
        Adres może być nieaktualny albo innowacja została usunięta. Wróć do
        listy i wybierz test, który jest teraz otwarty.
      </p>
      <Link
        href="/test"
        className={cn(
          buttonVariants(),
          "h-auto min-h-11 px-4 py-2 text-base whitespace-normal",
        )}
      >
        Wróć do otwartych testów
      </Link>
    </div>
  );
}
