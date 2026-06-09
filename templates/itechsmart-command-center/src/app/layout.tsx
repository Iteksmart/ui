import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import { Providers } from "@/components/providers"
import { Shell } from "@/components/shell"

import "./globals.css"

export const metadata: Metadata = {
  title: "iTechSmart Command Center",
  description:
    "GTM Command Center for the iTechSmart UAIO platform — live platform health, AG2 incident response, governance approvals, and the ProofLink cryptographic audit ledger.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`} suppressHydrationWarning>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
