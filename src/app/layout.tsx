import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/xflow/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "X-Flow by X-Motion — Operating System Automóvel",
  description:
    "Sistema operativo inteligente para empresas de proteção, personalização e acabamento automóvel.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#050606",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="dark" suppressHydrationWarning>
      <body className="bg-[#050606] text-[#f1ede5] min-h-screen" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
