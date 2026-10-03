import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deklaracja dostępności",
  description:
    "Deklaracja dostępności serwisu HubMI.pl: status zgodności, treści niedostępne, ułatwienia i dane kontaktowe.",
};

const PUBLISHED = { iso: "2026-10-03", text: "3 października 2026 r." };
const UPDATED = { iso: "2026-10-03", text: "3 października 2026 r." };
const CONTACT_EMAIL = "kontakt@hubmi.example";

const linkClassName =
  "rounded-sm font-medium text-primary underline underline-offset-4 hover:decoration-2";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10 space-y-4">
      <h2 id={id} className="text-2xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AccessibilityStatementPage() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">
        Deklaracja dostępności
      </h1>

      <Section id="intro" title="Wstęp">
        <p>
          Zespół prototypu HubMI.pl zobowiązuje się zapewnić dostępność serwisu
          HubMI.pl zgodnie z ustawą z dnia 4 kwietnia 2019 r. o dostępności
          cyfrowej stron internetowych i aplikacji mobilnych podmiotów
          publicznych. Deklaracja dotyczy serwisu HubMI.pl, prototypu
          Małopolskiego Hubu Innowacji Społecznych.
        </p>
        <p>
          Serwis przygotowaliśmy na HackYeah 2026. Prowadzi go zespół prototypu.
          Docelowym operatorem jest Regionalny Ośrodek Polityki Społecznej w
          Krakowie (ROPS Kraków). Wszystkie dane w serwisie są przykładowe.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Data publikacji serwisu:{" "}
            <time dateTime={PUBLISHED.iso}>{PUBLISHED.text}</time>
          </li>
          <li>
            Data ostatniej istotnej aktualizacji:{" "}
            <time dateTime={UPDATED.iso}>{UPDATED.text}</time>
          </li>
        </ul>
      </Section>

      <Section id="status" title="Status pod względem zgodności z ustawą">
        <p>
          Serwis jest <strong>częściowo zgodny</strong> z ustawą o dostępności
          cyfrowej stron internetowych i aplikacji mobilnych podmiotów
          publicznych. Niezgodności i wyłączenia opisujemy poniżej. Oceniamy
          dostępność według WCAG 2.1 na poziomie AA.
        </p>
      </Section>

      <Section id="inaccessible" title="Treści niedostępne">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Teksty tworzone przez sztuczną inteligencję (na przykład
            uzasadnienia dopasowań i odpowiedzi asystenta) mogą być
            nieprecyzyjne albo napisane zbyt trudnym językiem.
          </li>
          <li>
            Filmy z serwisów zewnętrznych mogą nie mieć napisów ani
            audiodeskrypcji.
          </li>
          <li>
            Dokumenty do pobrania dodane przez użytkowników i instytucje mogą
            nie być w pełni dostępne cyfrowo.
          </li>
          <li>
            Wykresy i wizualizacje danych mogą nie mieć pełnego opisu
            tekstowego.
          </li>
          <li>
            Serwis jest prototypem, więc część funkcji jest jeszcze w budowie i
            nie przeszła pełnych testów z użytkownikami technologii
            wspomagających.
          </li>
        </ul>
      </Section>

      <Section id="preparation" title="Przygotowanie deklaracji">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Data sporządzenia deklaracji:{" "}
            <time dateTime={PUBLISHED.iso}>{PUBLISHED.text}</time>
          </li>
          <li>
            Data ostatniego przeglądu deklaracji:{" "}
            <time dateTime={UPDATED.iso}>{UPDATED.text}</time>
          </li>
        </ul>
        <p>
          Deklarację przygotował zespół prototypu na podstawie samooceny.
          Dostępność sprawdzamy narzędziami Lighthouse i axe oraz testami
          obsługi klawiaturą. Pełny przegląd z czytnikiem ekranu jest jeszcze
          potrzebny.
        </p>
      </Section>

      <Section id="features" title="Ułatwienia na stronie">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Odnośnik „Przejdź do treści” jest pierwszym elementem każdej strony
            i przenosi fokus do głównej treści.
          </li>
          <li>
            Przyciski A, A+ i A++ w nagłówku zmieniają rozmiar tekstu (100%,
            115% i 130%).
          </li>
          <li>
            Przycisk „Wysoki kontrast” włącza czarne tło, biały tekst oraz żółte
            odnośniki i obramowanie fokusu.
          </li>
          <li>
            Całą stronę można obsłużyć klawiaturą: klawisz Tab przenosi do
            kolejnego elementu, Shift + Tab do poprzedniego, Enter uruchamia
            odnośnik lub przycisk, a Esc zamyka menu i okna dialogowe.
          </li>
          <li>Element z fokusem ma zawsze wyraźne obramowanie.</li>
          <li>
            Wybrane ustawienia są zapamiętywane w przeglądarce. Serwis ogranicza
            animacje, gdy w systemie włączono redukcję ruchu.
          </li>
        </ul>
      </Section>

      <Section id="contact" title="Informacje zwrotne i dane kontaktowe">
        <p>
          Problemy z dostępnością zgłoś zespołowi prototypu HubMI.pl. Możesz też
          poprosić o udostępnienie informacji lub zapewnienie dostępności.
        </p>
        <p>
          E-mail:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClassName}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>To adres przykładowy. Prototyp nie obsługuje jeszcze zgłoszeń.</p>
      </Section>

      <Section id="procedure" title="Procedura wnioskowo-skargowa">
        <p>
          Każdy ma prawo wystąpić z żądaniem zapewnienia dostępności cyfrowej
          serwisu lub jego elementu. Można też zażądać udostępnienia informacji
          w formie alternatywnej, na przykład przez odczytanie niedostępnego
          dokumentu albo opisanie filmu bez audiodeskrypcji.
        </p>
        <p>Żądanie powinno zawierać:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>dane osoby zgłaszającej,</li>
          <li>wskazanie strony lub jej elementu, którego dotyczy żądanie,</li>
          <li>sposób kontaktu,</li>
          <li>
            wygodną formę udostępnienia informacji, jeśli żądanie dotyczy formy
            alternatywnej.
          </li>
        </ul>
        <p>
          Podmiot realizuje żądanie niezwłocznie, nie później niż w ciągu 7 dni
          od dnia zgłoszenia. Jeżeli nie jest to możliwe, informuje o nowym
          terminie, nie dłuższym niż 2 miesiące od dnia zgłoszenia. Gdy
          zapewnienie dostępności nie jest możliwe, podmiot może zaproponować
          alternatywny sposób dostępu do informacji.
        </p>
        <p>
          W przypadku odmowy albo niedotrzymania terminu można złożyć skargę do
          podmiotu. Po wyczerpaniu tej procedury można też złożyć wniosek do{" "}
          <a href="https://www.rpo.gov.pl/" className={linkClassName}>
            Rzecznika Praw Obywatelskich
          </a>
          .
        </p>
      </Section>

      <Section id="architecture" title="Dostępność architektoniczna">
        <p>
          Nie dotyczy. HubMI.pl jest prototypem serwisu internetowego i nie ma
          siedziby, w której obsługuje się interesantów.
        </p>
      </Section>
    </article>
  );
}
