import type { Metadata } from "next";
import {
  DocumentSection,
  PrototypeNotice,
} from "@/components/layout/document-section";
export const metadata: Metadata = {
  title: "Polityka cookies",
  description: "Cookies sesji i dane zapisane w przeglądarce.",
};
export default function CookiesPage() {
  return (
    <article className="max-w-[75ch]">
      <h1 className="text-3xl font-bold">Polityka cookies</h1>
      <DocumentSection id="cookies" title="Cookies logowania">
        <p>
          Cookies Supabase o nazwach zaczynających się od{" "}
          <span translate="no">sb-</span> utrzymują sesję logowania.
        </p>
        <p>Nie używamy cookies reklamowych ani statystycznych.</p>
      </DocumentSection>
      <PrototypeNotice>
        Polityka dotyczy prototypu i wymaga zatwierdzenia przez docelowego
        operatora.
      </PrototypeNotice>
      <DocumentSection id="storage" title="Pamięć przeglądarki">
        <p>
          <span translate="no">localStorage</span> przechowuje rozmiar tekstu,
          motyw i lokalne szkice, a w trybie bez Supabase także pomysły,
          wiadomości, zgłoszenia do testów i opinie.
        </p>
        <p>
          Profil instytucji i szkic problemu przekazywany do wiadomości
          pozostają w <span translate="no">sessionStorage</span> do zamknięcia
          karty.
        </p>
        <p>Usuń te dane w ustawieniach przeglądarki, czyszcząc dane strony.</p>
      </DocumentSection>
    </article>
  );
}
