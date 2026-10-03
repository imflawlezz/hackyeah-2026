import {
  ArrowsRightLeftIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  HeartIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Innovation categories that answer this challenge; the first one is the closest. */
  categories: string[];
};

/** The seven challenges named in section 1 of docs/task/CHALLENGE.md. */
export const challenges: Challenge[] = [
  {
    id: "ageing-society",
    title: "Starzenie się społeczeństwa",
    description:
      "W Małopolsce przybywa osób starszych, a opieka nad nimi spada głównie na rodziny. Gminy szukają sposobów, żeby seniorzy jak najdłużej mogli mieszkać u siebie.",
    icon: ClockIcon,
    categories: ["Opieka", "Samotność"],
  },
  {
    id: "mental-health",
    title: "Kryzys zdrowia psychicznego",
    description:
      "Coraz więcej dorosłych i młodych ludzi potrzebuje wsparcia psychicznego, a na specjalistę czeka się długo. Pomaga pomoc blisko domu, dostępna bez skierowania.",
    icon: HeartIcon,
    categories: ["Zdrowie psychiczne"],
  },
  {
    id: "loneliness",
    title: "Samotność",
    description:
      "Osoby mieszkające samotnie, zwłaszcza starsze, potrafią przez wiele dni z nikim nie rozmawiać. Regularny kontakt z sąsiadem lub wolontariuszem zmienia ich codzienność.",
    icon: ChatBubbleLeftRightIcon,
    categories: ["Samotność"],
  },
  {
    id: "digital-exclusion",
    title: "Wykluczenie cyfrowe",
    description:
      "Coraz więcej spraw urzędowych i zdrowotnych załatwia się przez internet. Kto nie ma sprzętu albo umiejętności, zostaje z nimi sam.",
    icon: DevicePhoneMobileIcon,
    categories: ["Wykluczenie cyfrowe"],
  },
  {
    id: "access-to-services",
    title: "Ograniczony dostęp do usług społecznych",
    description:
      "W wielu miejscowościach do urzędu, opieki czy noclegu interwencyjnego jest daleko albo trudno się tam dostać. Najbardziej odczuwają to osoby z niepełnosprawnością i w kryzysie.",
    icon: BuildingLibraryIcon,
    categories: ["Dostępność", "Opieka", "Bezdomność"],
  },
  {
    id: "cross-sector-coordination",
    title: "Koordynacja i współpraca międzysektorowa",
    description:
      "Urzędy, organizacje pozarządowe i mieszkańcy często działają obok siebie. Wspólne projekty pozwalają lepiej wykorzystać to, co każda ze stron już robi.",
    icon: ArrowsRightLeftIcon,
    categories: ["Aktywizacja", "Młodzież"],
  },
  {
    id: "settlement-change",
    title: "Zmiana struktury osadniczej",
    description:
      "Większość gmin regionu się wyludnia, a miejscowości wokół Krakowa szybko rosną. W jednych brakuje ludzi do prowadzenia usług, w innych usług dla nowych mieszkańców.",
    icon: MapIcon,
    categories: ["Młodzież", "Samotność"],
  },
];
