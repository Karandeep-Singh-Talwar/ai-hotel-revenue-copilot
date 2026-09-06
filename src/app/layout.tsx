import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RevCommand - AI Hotel Revenue Intelligence Platform",
  description: "High-density hotel revenue command center and WhatsApp Copilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0B132B] text-white selection:bg-[#2EC4B6] selection:text-[#0B132B]">
        {children}
      </body>
    </html>
  );
}
