import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "./_components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "UBB Events",
  description: "Discover and manage student events at UBB.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<header className="nav" aria-hidden />}>
          <Nav />
        </Suspense>
        <main className="main">{children}</main>
        <footer className="footer">
          <p>UBB Event Management — mid-semester MVP.</p>
        </footer>
      </body>
    </html>
  );
}
