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
      "Krótki cykl warsztatów, w którym młodzież zamienia lokalny problem w mikroprojekt i sprawdza go z mentorem. Grupa kończy cykl publiczną prezentacją w domu kultury.",
    category: "Młodzież",
    targetGroup: "Młodzież w wieku 15–25 lat",
    tags: ["młodzież", "partycypacja", "warsztaty", "gmina"],
    createdAt: "2025-03-04T08:00:00.000Z",
  },
  {
    id: "inn-one-night",
    title: "Nocleg interwencyjny „Jedna noc”",
    description:
      "Sieć sprawdzonych miejsc noclegowych na jedną noc dla osób w kryzysie bezdomności. Rano mieszkaniec dostaje kontakt do pracownika socjalnego.",
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
      "Małe, moderowane grupy wsparcia po epizodzie kryzysu psychicznego, prowadzone razem z lokalnym ośrodkiem zdrowia. Spotkania są bezpłatne i nie wymagają skierowania.",
    category: "Zdrowie psychiczne",
    targetGroup: "Osoby po kryzysie psychicznym",
    tags: ["zdrowie psychiczne", "wsparcie", "grupa", "samotność"],
    createdAt: "2025-05-14T08:00:00.000Z",
  },
  {
    id: "inn-telecare",
    title: "Teleopieka sąsiedzka",
    description:
      "Codzienny krótki telefon do seniora mieszkającego samotnie. Brak odebrania uruchamia ustaloną ścieżkę sprawdzenia u sąsiada albo opiekuna.",
    category: "Samotność",
    targetGroup: "Samotni seniorzy",
    tags: ["seniorzy", "samotność", "telefon", "bezpieczeństwo"],
    createdAt: "2025-02-28T08:00:00.000Z",
  },
  {
    id: "inn-remote-work",
    title: "Praca chroniona zdalnie",
    description:
      "Proste zlecenia zdalne, takie jak porządkowanie danych, dla osób z niepełnosprawnością. Asystent zatrudnienia w gminie pomaga ustalić zakres i tempo pracy.",
    category: "Aktywizacja",
    targetGroup: "Osoby z niepełnosprawnością",
    tags: ["niepełnosprawność", "praca", "zdalnie", "aktywizacja"],
    createdAt: "2024-12-09T08:00:00.000Z",
  },
  {
    id: "inn-after-school",
    title: "Świetlica otwarta po lekcjach",
    description:
      "Bezpłatna świetlica z posiłkiem i pomocą w lekcjach dla dzieci i młodzieży, których rodzice pracują zmianowo. Świetlica jest otwarta także w części ferii.",
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
