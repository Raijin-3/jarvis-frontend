import "./globals.css"
import type { ReactNode } from "react"
import { AppToaster } from "@/components/providers/app-toaster"
import { HeaderProvider } from "@/components/nav/header-provider"

export const metadata = { title: "Jarvis", description: "Personalized analytics learning" };

// Mark the root layout as dynamic since the header reads auth cookies/session
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <HeaderProvider />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
