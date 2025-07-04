import type { Metadata } from "next"
import HeroSection from "@/components/hero-section"

export const metadata: Metadata = {
  title: "ConsórcioFácil - Realize seus sonhos",
  description:
    "Para cada ponto de vista, um consórcio ConsórcioFácil. Você está perto de realizar o seu projeto de vida.",
}

export default function Home() {
  return (
    <main className="min-h-[80vh]">
      <HeroSection />
    </main>
  )
}
