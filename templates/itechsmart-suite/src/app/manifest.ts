import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "iTechSmart Suite",
    short_name: "iTechSmart",
    description:
      "UAIO platform on mobile — live incidents, ProofLink verification, and Arbiter approvals from your phone.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0710",
    theme_color: "#5b2d8e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  }
}
