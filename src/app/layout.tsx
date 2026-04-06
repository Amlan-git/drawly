import { AuthProvider } from "@/hooks/useAuth";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drawly — Collaborative Whiteboard for Engineers",
  description:
    "Start drawing instantly. Create live collaboration rooms. Save important work as persistent diagrams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#121212" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
