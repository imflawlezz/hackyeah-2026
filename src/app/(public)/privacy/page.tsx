import type { Metadata } from "next";
import {
  DocumentSection,
  PrototypeNotice,
} from "@/components/layout/document-section";
export const metadata: Metadata = {
  title: "Klauzula informacyjna RODO",
  description: "Gdzie i po co HubMI.pl przetwarza dane.",
};
const linkClassName =
  "rounded-sm text-primary underline underline-offset-4 hover:decoration-2";
export default function PrivacyPage() {
  return (
    <article className="max-w-[75ch]">
      <h1 className="text-3xl font-bold">Klauzula informacyjna RODO</h1>
      <DocumentSection id="data" title="Gdzie trafiają dane">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Supabase (region UE): konta, pomysły, zgłoszenia do testów,
            wiadomości, powiadomienia, opinie i zanonimizowane opisy problemów —
            do obsługi kont, współpracy i analizy potrzeb.
          </li>
          <li>
            OpenAI: opisy problemów, teksty pomysłów i pytania do asystenta — do
            dopasowań i odpowiedzi; nagrania głosowe — do transkrypcji. HubMI
            nie przechowuje nagrań.
          </li>
          <li>
            Tylko przeglądarka: rozmiar tekstu, motyw, lokalne szkice oraz
            wiadomości i zgłoszenia w trybie bez połączenia z Supabase.
          </li>
        </ul>
      </DocumentSection>
      <PrototypeNotice>
        Informacja dla prototypu; docelowy administrator (ROPS) musi uzupełnić
        klauzulę przed wdrożeniem.
      </PrototypeNotice>
      <DocumentSection id="controller" title="Administrator danych">
        <p>
          ROPS określi podstawy prawne, okresy przechowywania, dane
          administratora i inspektora ochrony danych oraz sposób realizacji praw
          użytkowników.
        </p>
      </DocumentSection>
      <DocumentSection id="rights" title="Twoje prawa">
        <p>
          Możesz żądać dostępu do danych, sprostowania, usunięcia i ograniczenia
          przetwarzania oraz złożyć skargę do Prezesa UODO.
        </p>
      </DocumentSection>
      <DocumentSection id="contact" title="Kontakt projektu">
        <p>
          <a href="mailto:kontakt@hubmi.example" className={linkClassName}>
            kontakt@hubmi.example
          </a>{" "}
          (adres demonstracyjny).
        </p>
      </DocumentSection>
    </article>
  );
}
