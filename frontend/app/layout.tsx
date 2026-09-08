import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "../components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "EV Battery Intelligence Platform | Multi-Zone Fleet AI",
  description:
    "Cyber-physical tri-pillar EV battery intelligence system combining state estimation, deep thermal safety, and behavior-aware prognostics.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col antialiased transition-colors selection:bg-cyan-500/20 selection:text-cyan-800 dark:selection:text-cyan-200"
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
