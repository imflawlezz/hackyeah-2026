import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  NewspaperIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import type { Material, MaterialType } from "@/lib/mocks";

const TYPES: Record<
  MaterialType,
  {
    label: string;
    verb: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
  }
> = {
  pdf: { label: "PDF", verb: "Pobierz", icon: DocumentTextIcon },
  template: {
    label: "Szablon",
    verb: "Pobierz",
    icon: ClipboardDocumentListIcon,
  },
  video: { label: "Film", verb: "Obejrzyj", icon: PlayCircleIcon },
  article: { label: "Artykuł", verb: "Przeczytaj", icon: NewspaperIcon },
};

const LANGUAGES: Record<Material["language"], string> = { pl: "po polsku" };

/** "Pobierz: Mapa Wyzwań Społecznych (PDF, 7,8 MB, po polsku)". */
export function materialLinkText(material: Material): string {
  const { label, verb: typeVerb } = TYPES[material.type];
  const verb = material.verb ?? typeVerb;
  const details = [label, material.sizeLabel, LANGUAGES[material.language]]
    .filter(Boolean)
    .join(", ");
  return `${verb}: ${material.title} (${details})`;
}

function isExternal(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function MaterialList({
  materials,
}: {
  materials: readonly Material[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-base text-muted-foreground">
        Raporty i opracowania Regionalnego Ośrodka Polityki Społecznej w
        Krakowie. Odnośniki do rops.krakow.pl otwierają się w nowej karcie.
      </p>
      <ul className="border-t border-border">
        {materials.map((material) => {
          const { label, icon: Icon } = TYPES[material.type];
          const external = isExternal(material.url);
          return (
            <li
              key={material.id}
              className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 border-b border-border py-6 sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              <p className="flex items-center gap-2 text-sm font-semibold sm:items-start">
                <Icon aria-hidden="true" className="size-6 shrink-0" />
                {label}
              </p>
              <div className="flex max-w-2xl flex-col gap-2">
                <h3 className="font-heading text-xl leading-snug font-semibold break-words">
                  {material.title}
                </h3>
                <p className="text-base">{material.description}</p>
                <p className="text-sm text-muted-foreground">
                  Źródło: {material.source}
                </p>
                <p>
                  <a
                    href={material.url}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="inline-flex min-h-11 items-center rounded-sm text-base text-primary underline underline-offset-4 hover:decoration-2"
                  >
                    <span>
                      {materialLinkText(material)}
                      {external && (
                        <span className="sr-only">
                          , otwiera się w nowej karcie
                        </span>
                      )}
                    </span>
                  </a>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
