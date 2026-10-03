import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { fontSizeInitScript } from "@/lib/a11y/preferences";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HubMI.pl – strona główna",
    template: "%s · HubMI.pl",
  },
  description:
    "Małopolski Hub Innowacji Społecznych — platforma kojarzenia potrzeb z innowacjami.",
};

export const viewport: Viewport = {
  themeColor: "#2462ad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontSizeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <ThemeProvider>
          <SkipLink />
          <SiteHeader />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
          >
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
