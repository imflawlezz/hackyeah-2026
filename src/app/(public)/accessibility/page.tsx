import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deklaracja dostępności",
  description:
    "Deklaracja dostępności serwisu HubMI.pl: status zgodności, treści niedostępne, ułatwienia i dane kontaktowe.",
};

const PUBLISHED = { iso: "2026-10-03", text: "3 października 2026 r." };
const UPDATED = { iso: "2026-10-04", text: "4 października 2026 r." };
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

      <Section id="status" title="Stan dostępności cyfrowej">
        <p>
          Serwis jest częściowo zgodny z WCAG 2.1 AA oraz załącznikiem do ustawy
          z 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i
          aplikacji mobilnych podmiotów publicznych.
        </p>
      </Section>
      <div className="mt-5 space-y-4">
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

      <Section id="inaccessible" title="Niedostępne treści">
        <Subsection id="non-compliance" title="Niezgodność z załącznikiem">
          <ul className="list-disc space-y-2 pl-6">
            <li>Teksty AI mogą być nieprecyzyjne lub trudne do zrozumienia.</li>
            <li>
              Wykresy i wizualizacje danych mogą nie mieć pełnego opisu
              tekstowego.
            </li>
            <li>
              Nie wszystkie funkcje przeszły testy z użytkownikami technologii
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
          Deklaracja opiera się na samoocenie: Lighthouse, axe i testach
          klawiaturą; pełny przegląd z czytnikiem ekranu pozostaje do wykonania.
        </p>
      </Section>

      <Section
        id="features"
        title="Udogodnienia, ograniczenia i inne informacje"
      >
        <Subsection id="above-requirements" title="Ułatwienia">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Odnośnik „Przejdź do treści głównej” przenosi fokus do treści.
            </li>
            <li>A, A+ i A++ zmieniają rozmiar tekstu: 100%, 115%, 130%.</li>
            <li>
              Wysoki kontrast: czarne tło, biały tekst, żółte linki i fokus.
            </li>
            <li>Element z fokusem ma zawsze wyraźne obramowanie.</li>
            <li>
              Ustawienia pozostają w przeglądarce; animacje respektują redukcję
              ruchu.
            </li>
          </ul>
        </Subsection>
        <Subsection
          id="fix-plans"
          title="Plany likwidacji błędów dostępności cyfrowej"
        >
          <p>
            Do wykonania: przegląd z czytnikiem ekranu i usunięcie wykrytych
            błędów.
          </p>
        </Subsection>
      </Section>

      <Section id="shortcuts" title="Skróty klawiszowe">
        <p>
          Tab i Shift + Tab zmieniają fokus, Enter uruchamia odnośnik, Enter lub
          Spacja — przycisk, a Esc zamyka menu i okna dialogowe.
        </p>
        <p>
          W rozmowie Ctrl + Enter wysyła wiadomość. W asystencie pomysłów Enter
          wysyła pytanie, a Shift + Enter dodaje nową linię.
        </p>
      </Section>

      <Section id="contact" title="Informacje zwrotne i dane kontaktowe">
        <p>
          Zgłoszenie powinno wskazywać problem i sposób kontaktu; można też
          poprosić o alternatywną formę informacji.
        </p>
        <p>
          E-mail:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClassName}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>Adres demonstracyjny — nie służy do składania wniosków.</p>
      </Section>

      <Section
        id="procedure"
        title="Obsługa wniosków i skarg związanych z dostępnością"
      >
        <p>
          Każdy może żądać dostępności serwisu lub informacji w alternatywnej
          formie.
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
          Podmiot publiczny realizuje żądanie w ciągu 7 dni; przy opóźnieniu
          podaje przyczynę i nowy termin, maksymalnie 2 miesiące od zgłoszenia.
          Jeśli dostępność jest niemożliwa, proponuje alternatywny dostęp.
        </p>
        <p>
          Po odmowie lub przekroczeniu terminu można złożyć skargę do podmiotu,
          a po wyczerpaniu tej procedury — wniosek do{" "}
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
          <p>Nie dotyczy — serwis nie ma siedziby obsługującej interesantów.</p>
        </Subsection>
        <Subsection
          id="communication"
          title="Dostępność komunikacyjno-informacyjna"
        >
          <p>Nie prowadzimy obsługi interesantów w polskim języku migowym.</p>
        </Subsection>
      </Section>
    </article>
  );
}
