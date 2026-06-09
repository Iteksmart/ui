import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import { Providers } from "@/components/providers"
import { PwaRegister } from "@/components/pwa-register"
import { SuiteShell } from "@/components/suite-shell"

import "./globals.css"

export const metadata: Metadata = {
  title: "iTechSmart Suite",
  description:
    "The iTechSmart UAIO platform suite — twenty frontends, one design system. ProofLink verification, incident command, governance, business impact, and more.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`} suppressHydrationWarning>
      <body>
        <Providers>
          <PwaRegister />
          <SuiteShell>{children}</SuiteShell>
        </Providers>
      </body>
    </html>
  )
}
