import type { Innovation } from "@/types";

export const innovations: Innovation[] = [
  {
    id: "inn-respite-care",
    title: "Sąsiedzka opieka wytchnieniowa",
    description:
      "Wolontariusze z osiedla przejmują na kilka godzin opiekę nad osobą starszą, żeby stały opiekun mógł odpocząć albo załatwić sprawy. Dyżury układa lokalne centrum usług społecznych.",
    category: "Opieka",
    targetGroup: "Opiekunowie osób starszych",
    tags: ["seniorzy", "opieka", "wytchnienie", "wolontariat"],
    createdAt: "2025-02-11T08:00:00.000Z",
  },
  {
    id: "inn-mobile-access",
    title: "Mobilny punkt dostępności",
    description:
      "Przenośny zestaw z pętlą indukcyjną, lupą elektroniczną i stanowiskiem z czytnikiem ekranu. Urzędy i świetlice wypożyczają go na dyżury dla mieszkańców.",
    category: "Dostępność",
    targetGroup: "Osoby z niepełnosprawnością",
    tags: ["niepełnosprawność", "dostępność", "urząd", "sprzęt"],
    createdAt: "2025-01-20T08:00:00.000Z",
  },
  {
    id: "inn-youth-incubator",
    title: "Inkubator młodzieżowych inicjatyw",
    description:
      "Na kilku warsztatach młodzież wybiera lokalny problem, robi z niego mikroprojekt i sprawdza go z mentorem. Na koniec grupa pokazuje wyniki publicznie w domu kultury.",
    category: "Młodzież",
    targetGroup: "Młodzież w wieku 15–25 lat",
    tags: ["młodzież", "partycypacja", "warsztaty", "gmina"],
    createdAt: "2025-03-04T08:00:00.000Z",
  },
  {
    id: "inn-one-night",
    title: "Nocleg interwencyjny „Jedna noc”",
    description:
      "Osoba w kryzysie bezdomności dostaje nocleg na jedną noc w jednym ze sprawdzonych miejsc. Rano ma już kontakt do pracownika socjalnego.",
    category: "Bezdomność",
    targetGroup: "Osoby w kryzysie bezdomności",
    tags: ["bezdomność", "nocleg", "kryzys", "pomoc"],
    createdAt: "2024-11-18T08:00:00.000Z",
  },
  {
    id: "inn-digital-assistant",
    title: "Gminny asystent cyfrowy",
    description:
      "Stałe dyżury w bibliotece i domu kultury, na których mieszkańcy uczą się profilu zaufanego, e-recepty i kontaktu z urzędem online. Asystent nie załatwia sprawy zamiast mieszkańca, tylko prowadzi go przez kolejne kroki.",
    category: "Wykluczenie cyfrowe",
    targetGroup: "Seniorzy i osoby wykluczone cyfrowo",
    tags: ["seniorzy", "cyfryzacja", "urząd", "edukacja"],
    createdAt: "2025-04-02T08:00:00.000Z",
  },
  {
    id: "inn-crisis-circle",
    title: "Krąg po kryzysie psychicznym",
    description:
      "Małe grupy wsparcia dla osób po epizodzie kryzysu psychicznego. Każda ma moderatora i działa razem z lokalnym ośrodkiem zdrowia. Udział jest bezpłatny, skierowanie nie jest potrzebne.",
    category: "Zdrowie psychiczne",
    targetGroup: "Osoby po kryzysie psychicznym",
    tags: ["zdrowie psychiczne", "wsparcie", "grupa", "samotność"],
    createdAt: "2025-05-14T08:00:00.000Z",
  },
  {
    id: "inn-telecare",
    title: "Teleopieka sąsiedzka",
    description:
      "Do seniora mieszkającego samotnie ktoś codziennie na chwilę dzwoni. Kiedy senior nie odbiera, rusza ustalona wcześniej ścieżka: sprawdzenie u sąsiada albo opiekuna.",
    category: "Samotność",
    targetGroup: "Samotni seniorzy",
    tags: ["seniorzy", "samotność", "telefon", "bezpieczeństwo"],
    createdAt: "2025-02-28T08:00:00.000Z",
  },
  {
    id: "inn-remote-work",
    title: "Praca chroniona zdalnie",
    description:
      "Osoby z niepełnosprawnością dostają proste zlecenia zdalne, na przykład porządkowanie danych. Zakres i tempo pracy pomaga ustalić asystent zatrudnienia w gminie.",
    category: "Aktywizacja",
    targetGroup: "Osoby z niepełnosprawnością",
    tags: ["niepełnosprawność", "praca", "zdalnie", "aktywizacja"],
    createdAt: "2024-12-09T08:00:00.000Z",
  },
  {
    id: "inn-after-school",
    title: "Świetlica otwarta po lekcjach",
    description:
      "Dzieci i młodzież, których rodzice pracują zmianowo, mogą po lekcjach przyjść do bezpłatnej świetlicy. Dostają tam posiłek i pomoc w lekcjach. Świetlica działa też przez część ferii.",
    category: "Młodzież",
    targetGroup: "Dzieci i młodzież szkolna",
    tags: ["młodzież", "opieka", "świetlica", "edukacja"],
    createdAt: "2025-06-01T08:00:00.000Z",
  },
  {
    id: "inn-time-bank",
    title: "Bank czasu opiekunów",
    description:
      "Mieszkańcy wymieniają godziny opieki, transportu i towarzystwa bez rozliczeń pieniężnych. Poręczenia prowadzi centrum usług społecznych.",
    category: "Opieka",
    targetGroup: "Opiekunowie osób zależnych",
    tags: ["opieka", "seniorzy", "wolontariat", "transport"],
    createdAt: "2025-03-22T08:00:00.000Z",
  },
];
