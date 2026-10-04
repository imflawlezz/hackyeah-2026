import type { Metadata } from "next";
import Link from "next/link";
import {
  DocumentSection,
  PrototypeNotice,
} from "@/components/layout/document-section";

export const metadata: Metadata = {
  title: "Klauzula informacyjna RODO",
  description:
    "Jakie dane przetwarza prototyp HubMI.pl i co jeszcze musi uzupełnić administrator przed uruchomieniem serwisu.",
};

const linkClassName =
  "rounded-sm text-primary underline underline-offset-4 hover:decoration-2";

export default function PrivacyPage() {
  return (
    <article className="max-w-[75ch]">
      <h1 className="text-3xl font-bold">Klauzula informacyjna RODO</h1>

      <PrototypeNotice>
        To jest tekst prototypu przygotowanego na HackYeah 2026. Nie jest
        klauzulą informacyjną w rozumieniu art. 13 RODO. Administratora danych,
        podstawę prawną, okresy przechowywania i dane inspektora ochrony danych
        uzupełni operator serwisu przed jego uruchomieniem.
      </PrototypeNotice>

      <DocumentSection id="controller" title="Administrator danych">
        <p>
          Docelowym operatorem serwisu ma być Regionalny Ośrodek Polityki
          Społecznej w Krakowie. Administrator danych, jego adres i dane
          kontaktowe zostaną wpisane tutaj po decyzji operatora.
        </p>
      </DocumentSection>

      <DocumentSection id="data" title="Jakie dane zbiera prototyp">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Opis problemu wpisany w wyszukiwarce rozwiązań. Zapisujemy go bez
            adresów e-mail i numerów telefonów, żeby pokazać zespołowi Hubu,
            jakich rozwiązań brakuje.
          </li>
          <li>
            Adres e-mail, nazwa wyświetlana, rola i gmina, jeśli założysz konto.
          </li>
          <li>
            Pomysły, zgłoszenia do testów, opinie i wiadomości, które sam
            wyślesz.
          </li>
          <li>
            Ustawienia dostępności i szkice zapisane w Twojej przeglądarce.
            Opisujemy je w{" "}
            <Link href="/cookies" className={linkClassName}>
              polityce cookies
            </Link>
            .
          </li>
        </ul>
        <p>
          W wersji demonstracyjnej serwis nie wysyła tych danych na serwer.
          Zostają w Twojej przeglądarce.
        </p>
      </DocumentSection>

      <DocumentSection id="rights" title="Twoje prawa">
        <p>
          Gdy serwis zacznie działać, opiszemy tutaj, jak skorzystać z prawa do
          dostępu do danych, ich sprostowania, usunięcia i ograniczenia
          przetwarzania oraz jak złożyć skargę do Prezesa Urzędu Ochrony Danych
          Osobowych.
        </p>
      </DocumentSection>

      <DocumentSection id="contact" title="Kontakt">
        <p>
          Pytania o dane w prototypie wyślij na adres{" "}
          <a href="mailto:kontakt@hubmi.example" className={linkClassName}>
            kontakt@hubmi.example
          </a>
          .
        </p>
      </DocumentSection>
    </article>
  );
}
