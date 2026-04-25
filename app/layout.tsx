import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { IncidentProvider } from "@/components/incident-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeroMTTR",
  description: "AI-powered incident RCA for PayZen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceCodePro.variable}`}>
      <body>
        <IncidentProvider>
          <AppShell>{children}</AppShell>
        </IncidentProvider>
      </body>
    </html>
  );
}
