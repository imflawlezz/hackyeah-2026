import type { Metadata } from "next";
import {
  DocumentSection,
  PrototypeNotice,
} from "@/components/layout/document-section";

export const metadata: Metadata = {
  title: "Polityka cookies",
  description:
    "Jakie pliki cookies i dane w pamięci przeglądarki wykorzystuje prototyp HubMI.pl.",
};

// Every key the code writes: lib/a11y/preferences.ts, lib/ideas/storage.ts,
// lib/institutions/form.ts, lib/testing/local-store.ts, lib/messages/mock-store.ts.
const BROWSER_STORAGE = [
  {
    name: "hubmi-font-size",
    purpose: "Wybrany rozmiar tekstu (A, A+, A++).",
    where: "Pamięć przeglądarki (localStorage)",
  },
  {
    name: "hubmi-theme",
    purpose: "Włączony lub wyłączony wysoki kontrast.",
    where: "Pamięć przeglądarki (localStorage)",
  },
  {
    name: "hubmi.ideas",
    purpose: "Pomysły zapisane bez logowania.",
    where: "Pamięć przeglądarki (localStorage)",
  },
  {
    name: "hubmi-institution-profile",
    purpose: "Odpowiedzi w formularzu dla instytucji, do zamknięcia karty.",
    where: "Pamięć karty (sessionStorage)",
  },
  {
    name: "hubmi-challenge-draft",
    purpose:
      "Opis problemu bez dopasowania, przekazywany do formularza wiadomości.",
    where: "Pamięć karty (sessionStorage)",
  },
  {
    name: "hubmi-test-signups, hubmi-test-feedback",
    purpose: "Zgłoszenia do testów i opinie w wersji demonstracyjnej.",
    where: "Pamięć przeglądarki (localStorage)",
  },
  {
    name: "hubmi-messages-v1",
    purpose: "Wiadomości w wersji demonstracyjnej.",
    where: "Pamięć przeglądarki (localStorage)",
  },
] as const;

export default function CookiesPage() {
  return (
    <article className="max-w-[75ch]">
      <h1 className="text-3xl font-bold">Polityka cookies</h1>

      <PrototypeNotice>
        To jest tekst prototypu przygotowanego na HackYeah 2026. Operator
        serwisu zatwierdzi go przed uruchomieniem.
      </PrototypeNotice>

      <DocumentSection id="summary" title="W skrócie">
        <p>
          Serwis nie używa plików cookies do statystyk ani reklam. Nie
          przekazuje danych o Twojej wizycie firmom zewnętrznym.
        </p>
      </DocumentSection>

      <DocumentSection id="cookies" title="Pliki cookies">
        <p>
          Gdy się zalogujesz, serwis zapisuje pliki cookies sesji logowania
          (nazwy zaczynają się od <span translate="no">sb-</span>). Bez nich nie
          da się pozostać zalogowanym. Znikają po wylogowaniu albo po
          wygaśnięciu sesji.
        </p>
      </DocumentSection>

      <DocumentSection id="storage" title="Dane w pamięci przeglądarki">
        <p>
          Część ustawień i szkiców zapisujemy tylko w Twojej przeglądarce. Nie
          trafiają na serwer. Możesz je usunąć, czyszcząc dane strony w
          ustawieniach przeglądarki.
        </p>
        <table className="w-full border-collapse text-left [overflow-wrap:anywhere]">
          <caption className="pb-2 text-left font-bold">
            Dane zapisywane w przeglądarce
          </caption>
          <thead>
            <tr className="border-b-2 border-border">
              <th scope="col" className="py-2 pr-4">
                Nazwa
              </th>
              <th scope="col" className="py-2 pr-4">
                Do czego służy
              </th>
              <th scope="col" className="py-2">
                Gdzie
              </th>
            </tr>
          </thead>
          <tbody>
            {BROWSER_STORAGE.map((item) => (
              <tr key={item.name} className="border-b border-border">
                <th
                  scope="row"
                  translate="no"
                  className="py-2 pr-4 align-top font-normal break-words"
                >
                  {item.name}
                </th>
                <td className="py-2 pr-4 align-top">{item.purpose}</td>
                <td className="py-2 align-top">{item.where}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocumentSection>
    </article>
  );
}
