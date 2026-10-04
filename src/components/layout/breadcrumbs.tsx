import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

const LINK =
  "inline-flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4 hover:decoration-2";

export type Crumb = { href: string; label: string };

/**
 * Design System Gov.pl breadcrumbs: under the header, above the h1, house icon
 * first, current page as plain text, hidden below 700 px.
 */
export function Breadcrumbs({
  items,
  current,
}: {
  items: Crumb[];
  current: string;
}) {
  return (
    <nav aria-label="Ścieżka okruszków" className="max-[700px]:hidden">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <li className="flex items-center gap-2">
          <Link href="/" className={`${LINK} min-w-11 justify-center`}>
            <HomeIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Strona główna</span>
          </Link>
          <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
        </li>
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-2">
            <Link href={item.href} className={LINK}>
              {item.label}
            </Link>
            <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
