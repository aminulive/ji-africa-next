import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PwaInstallBanner from "./components/PwaInstallBanner";
import GoogleAuthWrapper from "./components/GoogleAuthWrapper";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ji.africa"),
  title: "ji.africa - Nigeria's Fast Classifieds Marketplace",
  description: "Buy & Sell Clean Used Items Anywhere in Nigeria",
  icons: {
    icon: [
      { url: "/icon?v=3", type: "image/png", sizes: "64x64" },
    ],
    shortcut: "/icon?v=3",
    apple: "/icon?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon?v=3" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('ji_theme') === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-brand-bg text-brand-dark antialiased flex flex-col min-h-screen transition-colors duration-200">
        <GoogleAuthWrapper>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[85vh]">
            {children}
          </main>
          <Footer />
          <PwaInstallBanner />
        </GoogleAuthWrapper>
      </body>
    </html>
  );
}
