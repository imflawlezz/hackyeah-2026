import type { Idea } from "@/types";

export const ideas: Idea[] = [
  {
    id: "idea-mobility-library",
    title: "Wypożyczalnia sprzętu do poruszania się",
    summary:
      "Świetlica w gminie wiejskiej wypożycza balkoniki i kule na dwa tygodnie. Wolontariusz przywozi sprzęt do domu.",
    targetGroup: "Seniorzy i ich opiekunowie w gminie wiejskiej",
    stage: "idea",
    status: "submitted",
    municipality: "Gdów",
    canvas: {
      problem:
        "W kilku sołectwach gminy Gdów seniorzy nie mają balkonika na czas rehabilitacji, a zakup na krótko się nie opłaca.",
      solution:
        "Przy centrum usług społecznych stoi szafa ze sprzętem. Mieszkaniec zgłasza potrzebę, a wolontariusz przywozi sprzęt i odbiera go po dwóch tygodniach.",
      novelty:
        "Wolontariusz nie zostawia sprzętu pod drzwiami. Zostaje na krótką sąsiedzką wizytę.",
      resources: "Szafa, kilka balkoników i osoba do dyżuru raz w tygodniu.",
      partners: "Centrum usług społecznych, sołtysi i lokalne koło gospodyń.",
      risks: "Sprzęt może nie wracać w terminie albo nie pasować wzrostem.",
      successMeasures:
        "W pierwszym roku co najmniej 20 wypożyczeń i zwrot sprzętu w umówionym czasie.",
    },
    createdAt: "2026-09-02T08:00:00.000Z",
  },
  {
    id: "idea-caregiver-cafe",
    title: "Kawiarnia dla opiekunów przy CUS",
    summary:
      "Raz w tygodniu opiekunowie osób niesamodzielnych spotykają się w centrum usług społecznych. Obok ktoś zostaje z podopiecznym na godzinę.",
    targetGroup: "Opiekunowie osób niesamodzielnych",
    stage: "prototype",
    status: "submitted",
    municipality: "Olkusz",
    canvas: {
      problem:
        "Opiekunowie w Olkuszu nie mają godziny dla siebie i nie wiedzą, kto w okolicy jest w podobnej sytuacji.",
      solution:
        "W czwartek o 16:00 CUS otwiera salę. Opiekun rozmawia przy kawie, a przeszkolona osoba zostaje z podopiecznym w sąsiedniej sali.",
      novelty:
        "Spotkanie jest stałe i blisko domu, bez zapisów na turnus wytchnieniowy.",
      resources: "Dwie sale, kawa i dwie osoby na dyżur.",
      partners: "Centrum usług społecznych i organizacja opiekunów.",
      risks: "Mało osób przyjdzie, jeśli godzina zderzy się z wizytą lekarską.",
      successMeasures:
        "Przez trzy miesiące przychodzi stała grupa co najmniej ośmiu opiekunów.",
    },
    createdAt: "2026-09-08T08:00:00.000Z",
  },
  {
    id: "idea-time-bank",
    title: "Sąsiedzki bank czasu w Nowej Hucie",
    summary:
      "Mieszkańcy wymieniają godzinę pomocy: zakupy, drobna naprawa albo towarzystwo na spacerze. Godziny zapisuje świetlica osiedlowa.",
    targetGroup: "Mieszkańcy osiedli w Nowej Hucie",
    stage: "pilot",
    status: "submitted",
    municipality: "Kraków",
    canvas: {
      problem:
        "Część starszych mieszkańców Nowej Huty czeka tygodniami na drobną pomoc, choć sąsiedzi mają wolną godzinę.",
      solution:
        "Świetlica prowadzi zeszyt godzin. Godzina pomocy dla sąsiada daje godzinę do wykorzystania później.",
      novelty:
        "Nie ma pieniędzy. Rozliczenie jest w czasie i zostaje w jednym osiedlu.",
      resources: "Dyżur w świetlicy i prosta tabela godzin.",
      partners: "Świetlica osiedlowa i rada dzielnicy.",
      risks: "Ktoś może obiecać pomoc i nie przyjść.",
      successMeasures:
        "Po pół roku w zeszycie jest co najmniej 30 wymienionych godzin.",
    },
    createdAt: "2026-09-12T08:00:00.000Z",
  },
  {
    id: "idea-mobile-advice",
    title: "Mobilny punkt poradnictwa w powiecie tarnowskim",
    summary:
      "Raz w miesiącu pracownik socjalny i doradca zawodowy przyjeżdżają na targ do mniejszych gmin. Mieszkaniec załatwia sprawę bez dojazdu do Tarnowa.",
    targetGroup: "Mieszkańcy gmin oddalonych od Tarnowa",
    stage: "idea",
    status: "submitted",
    municipality: "Tarnów",
    canvas: {
      problem:
        "Dojazd do ośrodka w Tarnowie zajmuje pół dnia, więc część osób odkłada wniosek o wsparcie.",
      solution:
        "Bus z dwoma stanowiskami staje na targu. Można zapytać o świadczenie albo o kurs zawodowy.",
      novelty:
        "Dyżur jest w miejscu, w którym mieszkańcy i tak bywają w sobotę.",
      resources: "Bus, stolik i grafik dwóch pracowników raz w miesiącu.",
      partners: "Powiatowe centrum pomocy rodzinie i gminy powiatu.",
      risks: "Targ może wypaść w deszczu, a bus nie ma zadaszenia.",
      successMeasures:
        "Na trzech kolejnych dyżurach ktoś składa wniosek, którego wcześniej nie złożył.",
    },
    createdAt: "2026-09-18T08:00:00.000Z",
  },
  {
    id: "idea-after-school",
    title: "Świetlica zadaniowa po lekcjach",
    summary:
      "Uczniowie zostają w szkole do 17:00 i robią jedną konkretną rzecz dla osiedla: gazetkę, ogródek albo dyżur przy sąsiedzkiej biblioteczce.",
    targetGroup: "Młodzież w wieku 13–16 lat",
    stage: "prototype",
    status: "reviewed",
    municipality: "Nowy Sącz",
    canvas: {
      problem:
        "Po lekcjach młodzież w Nowym Sączu nie ma gdzie zostać, a podwórko jest puste do wieczora.",
      solution:
        "Dwa dni w tygodniu nauczyciel i mieszkaniec prowadzą świetlicę. Grupa kończy miesiąc małym efektem widocznym na osiedlu.",
      novelty:
        "Poza opieką każdy miesiąc ma jedno zadanie ustalone z radą osiedla.",
      resources: "Sala po lekcjach i dwie osoby prowadzące.",
      partners: "Szkoła podstawowa i rada osiedla.",
      risks: "Rodzice mogą uznać to za dodatkowe lekcje i nie zapisać dziecka.",
      successMeasures:
        "Po semestrze grupa pokazuje trzy ukończone zadania, a frekwencja nie spada poniżej dziesięciu osób.",
    },
    createdAt: "2026-09-22T08:00:00.000Z",
  },
];
