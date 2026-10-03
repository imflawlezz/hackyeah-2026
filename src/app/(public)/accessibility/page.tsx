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
  "rounded-sm text-primary underline underline-offset-4 hover:decoration-2";

// Headings and their order follow "Warunki techniczne publikacji oraz
// struktura dokumentu elektronicznego deklaracji dostępności" v2.0.
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

function Subsection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-5 space-y-4">
      <h3 id={id} className="text-xl font-bold">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function AccessibilityStatementPage() {
  return (
    <article className="max-w-[75ch]">
      <h1 className="text-3xl font-bold">Deklaracja dostępności</h1>

      <div className="mt-5 space-y-4">
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
            Data publikacji strony internetowej:{" "}
            <time dateTime={PUBLISHED.iso}>{PUBLISHED.text}</time>
          </li>
          <li>
            Data ostatniej istotnej aktualizacji:{" "}
            <time dateTime={UPDATED.iso}>{UPDATED.text}</time>
          </li>
        </ul>
      </div>

      <Section id="status" title="Stan dostępności cyfrowej">
        <p>
          Strona internetowa jest częściowo zgodna z załącznikiem do ustawy z
          dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i
          aplikacji mobilnych podmiotów publicznych.
        </p>
        <p>
          Niezgodności i wyłączenia opisujemy poniżej. Oceniamy dostępność
          według WCAG 2.1 na poziomie AA.
        </p>
      </Section>

      <Section id="inaccessible" title="Niedostępne treści">
        <Subsection id="non-compliance" title="Niezgodność z załącznikiem">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Teksty tworzone przez sztuczną inteligencję (na przykład
              uzasadnienia dopasowań i odpowiedzi asystenta) mogą być
              nieprecyzyjne albo napisane zbyt trudnym językiem.
            </li>
            <li>
              Wykresy i wizualizacje danych mogą nie mieć pełnego opisu
              tekstowego.
            </li>
            <li>
              Serwis jest prototypem, więc część funkcji jest jeszcze w budowie
              i nie przeszła pełnych testów z użytkownikami technologii
              wspomagających.
            </li>
          </ul>
        </Subsection>
        <Subsection id="out-of-scope" title="Treści nieobjęte przepisami">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Filmy z serwisów zewnętrznych mogą nie mieć napisów ani
              audiodeskrypcji.
            </li>
            <li>
              Dokumenty do pobrania dodane przez użytkowników i instytucje mogą
              nie być w pełni dostępne cyfrowo.
            </li>
          </ul>
        </Subsection>
        <Subsection id="disproportionate-burden" title="Nadmierne koszty">
          <p>Nie powołujemy się na nadmierne koszty.</p>
        </Subsection>
      </Section>

      <Section id="preparation" title="Przygotowanie deklaracji dostępności">
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

      <Section
        id="features"
        title="Udogodnienia, ograniczenia i inne informacje"
      >
        <Subsection
          id="above-requirements"
          title="Elementy w których zapewniono wyższy od wymaganego poziom dostępności cyfrowej"
        >
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Odnośnik „Przejdź do treści głównej” jest pierwszym elementem
              każdej strony i przenosi fokus do głównej treści.
            </li>
            <li>
              Przyciski A, A+ i A++ w nagłówku zmieniają rozmiar tekstu (100%,
              115% i 130%).
            </li>
            <li>
              Przycisk „Wysoki kontrast” włącza czarne tło, biały tekst oraz
              żółte odnośniki i obramowanie fokusu.
            </li>
            <li>Element z fokusem ma zawsze wyraźne obramowanie.</li>
            <li>
              Wybrane ustawienia są zapamiętywane w przeglądarce. Serwis
              ogranicza animacje, gdy w systemie włączono redukcję ruchu.
            </li>
          </ul>
        </Subsection>
        <Subsection
          id="fix-plans"
          title="Plany likwidacji błędów dostępności cyfrowej"
        >
          <p>
            Przed uruchomieniem serwisu przeprowadzimy pełny przegląd z
            czytnikiem ekranu i poprawimy znalezione błędy.
          </p>
        </Subsection>
      </Section>

      <Section id="shortcuts" title="Skróty klawiszowe">
        <p>
          Całą stronę można obsłużyć klawiaturą: klawisz Tab przenosi do
          kolejnego elementu, Shift + Tab do poprzedniego, Enter uruchamia
          odnośnik lub przycisk, a Esc zamyka menu i okna dialogowe.
        </p>
        <p>
          W rozmowie Ctrl + Enter wysyła wiadomość. W asystencie pomysłów Enter
          wysyła pytanie, a Shift + Enter dodaje nową linię.
        </p>
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

      <Section
        id="procedure"
        title="Obsługa wniosków i skarg związanych z dostępnością"
      >
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

      <Section id="other" title="Pozostałe informacje">
        <Subsection id="mobile-apps" title="Aplikacje mobilne">
          <p>Serwis nie ma aplikacji mobilnej.</p>
        </Subsection>
        <Subsection id="architecture" title="Dostępność architektoniczna">
          <p>
            Nie dotyczy. HubMI.pl jest prototypem serwisu internetowego i nie ma
            siedziby, w której obsługuje się interesantów.
          </p>
        </Subsection>
        <Subsection
          id="communication"
          title="Dostępność komunikacyjno-informacyjna"
        >
          <p>
            Nie dotyczy. Prototyp nie prowadzi obsługi interesantów, w tym w
            polskim języku migowym. Informacje uzupełni operator serwisu.
          </p>
        </Subsection>
      </Section>
    </article>
  );
}
