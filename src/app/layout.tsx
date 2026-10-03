import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { fontSizeInitScript } from "@/lib/a11y/preferences";
import { getCurrentUser } from "@/lib/auth/session";
import { hasSupabase } from "@/lib/supabase/server";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  weight: ["400", "600"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HubMI.pl. Innowacje dla Małopolski",
    template: "%s · HubMI.pl",
  },
  description:
    "Opisz potrzeby swojej okolicy i poznaj rozwiązania z bazy Małopolskiego Hubu Innowacji Społecznych.",
};

export const viewport: Viewport = {
  themeColor: "#2462ad",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const headerUser = user
    ? {
        displayName: user.profile?.displayName ?? user.email,
        role: user.profile?.role ?? "resident",
      }
    : null;

  return (
    <html
      lang="pl"
      className={`${sourceSans.variable} ${sourceSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontSizeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <ThemeProvider>
          <SkipLink />
          <SiteHeader user={headerUser} demo={!hasSupabase} />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
          >
            {children}
          </main>
          <SiteFooter />
          <Toaster containerAriaLabel="Powiadomienia" />
        </ThemeProvider>
      </body>
    </html>
  );
}
