"use client"

import * as React from "react"

export function PwaRegister() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is progressive — never block the app on SW failure */
      })
    }
  }, [])
  return null
}
