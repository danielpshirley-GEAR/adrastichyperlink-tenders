import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Adrastichyperlink — Business Development OS",
  description:
    "Internal Business Development Operating System for Adrastichyperlink, founded & led by Daniel Shirley.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#09090b]">
      <body className="bg-studio-bg text-studio-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
