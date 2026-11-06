import type { Metadata } from "next";
import { DM_Serif_Display, Geist, Great_Vibes } from "next/font/google";
import { notFound } from "next/navigation";
import LangProvider from "@/i18n/LangProvider";
import { creditsPath, dictionaries, isLang, LANGS } from "@/i18n/dictionaries";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

// Both languages are prerendered; any other first path segment is a 404.
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: "Family Time", description: dictionaries[lang].meta.description };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${greatVibes.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LangProvider lang={lang}>{children}</LangProvider>
        <footer className="mt-auto px-4 pt-2 pb-6 text-center text-[13px] text-muted">
          <a href={creditsPath[lang]} className="underline underline-offset-2 hover:text-ink">
            {dictionaries[lang].credits.title}
          </a>
        </footer>
      </body>
    </html>
  );
}
