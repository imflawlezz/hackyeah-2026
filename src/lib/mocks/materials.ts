export type MaterialType = "pdf" | "video" | "article" | "template";

export interface Material {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  /**
   * A public page checked to exist (rops.krakow.pl, 3 October 2026) or an
   * in-app path. Never a placeholder such as "#".
   */
  url: string;
  /** Who publishes the material, shown next to the link. */
  source: string;
  /** Overrides the default link verb, e.g. for in-app tools. */
  verb?: string;
  sizeLabel?: string;
  language: "pl";
}

export const materials: Material[] = [
  {
    id: "mat-challenge-map",
    title: "Mapa Wyzwań Społecznych",
    description:
      "Opracowanie Działu Innowacji Społecznych ROPS Kraków: priorytetowe problemy, dla których szukane są innowacje, i przykładowe grupy odbiorców. Zawiera dane ogólnopolskie.",
    type: "pdf",
    url: "https://rops.krakow.pl/pliki-do-pobrania/artykul,mapa-wyzwan-spolecznych,1048",
    source: "ROPS Kraków",
    sizeLabel: "7,8 MB",
    language: "pl",
  },
  {
    id: "mat-social-services-diagnosis",
    title:
      "Usługi społeczne w Małopolsce – deficyty, potrzeby, potencjał rozwojowy (2025)",
    description:
      "Zaktualizowane wnioski z diagnozy usług społecznych w regionie: gdzie brakuje wsparcia, kogo to dotyczy i w jakim kierunku rozwijać usługi.",
    type: "pdf",
    url: "https://rops.krakow.pl/pliki-do-pobrania/wpis,2025-uslugi-spoleczne-w-malopolsce-deficyty-potrzeby-potencjal-rozwojowy-zaktualizowane-wnioski-z-diagnozy,1348",
    source: "ROPS Kraków",
    sizeLabel: "0,7 MB",
    language: "pl",
  },
  {
    id: "mat-library-seniors",
    title: "Biblioteka Innowacji Społecznych: rozwiązania dla seniorów",
    description:
      "Innowacje wybrane przez ROPS Kraków do upowszechniania, z opisami, filmami i materiałami do pobrania.",
    type: "article",
    url: "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow",
    source: "ROPS Kraków",
    language: "pl",
  },
  {
    id: "mat-library-mobility",
    title:
      "Biblioteka Innowacji Społecznych: rozwiązania dla osób o ograniczonej mobilności",
    description:
      "Sprawdzone rozwiązania dla osób, które mają trudność z poruszaniem się, z filmami i zasadami wykorzystania.",
    type: "article",
    url: "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
    source: "ROPS Kraków",
    language: "pl",
  },
  {
    id: "mat-inclusion-incubator",
    title: "Inkubator Włączenia Społecznego 2.0",
    description:
      "Projekt grantowy ROPS Kraków: jak zgłosić pomysł na innowację społeczną, procedury i dokumenty naboru.",
    type: "article",
    url: "https://rops.krakow.pl/realizowane-projekty-i-zadania/inkubator-wlaczenia-spolecznego-20",
    source: "ROPS Kraków",
    language: "pl",
  },
  {
    id: "mat-innovation-canvas",
    title: "Kanwa Innowacji Społecznych",
    description:
      "Pytania kanwy prowadzą od problemu, przez odbiorców, do pierwszego testu pomysłu. W HubMI.pl wypełnisz je krok po kroku w kreatorze pomysłów.",
    type: "template",
    url: "/ideas/new",
    source: "HubMI.pl",
    verb: "Wypełnij w kreatorze",
    language: "pl",
  },
];
