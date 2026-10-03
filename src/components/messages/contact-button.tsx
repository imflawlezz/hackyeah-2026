import Link from "next/link";
export function ContactButton({ innovationId }: { innovationId: string }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center text-primary underline"
      href={`/messages/new?innovation=${encodeURIComponent(innovationId)}`}
    >
      Zapytaj o wdrożenie
    </Link>
  );
}
