import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from "@/components/GoogleAnalytics";
import DataDiveFeedback from "@/components/DataDiveFeedback";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "disordat — settle the debate",
  description:
    "Settle any \"X vs Y\" debate. Get an honest, dated verdict with a winner and the reasons, then send the link to whoever is wrong. No ads, no sign-up.",
  keywords:
    "vs, versus, which is better, who is better, debate, verdict, GOAT, comparison, settle the debate",
  authors: [{ name: "disordat" }],
  creator: "disordat",
  publisher: "disordat",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL("https://disordat.org"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "disordat — settle the debate",
    description:
      "Settle any \"X vs Y\" debate with an honest, dated verdict. Send the card to the group chat.",
    url: "https://disordat.org",
    siteName: "disordat",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "disordat — settle the debate",
    description:
      "Settle any \"X vs Y\" debate with an honest, dated verdict. Send the card to the group chat."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "oMNG-WDMNjLziDAovGUtgfrQxBJ7FrZHiJoXWF_37w8"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/genie-shrug.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "disordat",
              description:
                "Settles \"X vs Y\" debates with an honest, dated verdict on its own shareable URL.",
              url: "https://disordat.org",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
              },
              author: {
                "@type": "Organization",
                name: "disordat"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        {children}
        <DataDiveFeedback siteSlug="disordat" accentColor="#10b981" />
      </body>
    </html>
  );
}

