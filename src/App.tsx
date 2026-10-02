import { useState } from "react"
import { Nav } from "@/components/site/nav"
import type { ExperienceId } from "@/lib/content"
import { Booking } from "@/sections/booking"
import { Experiences } from "@/sections/experiences"
import { Footer } from "@/sections/footer"
import { Hero } from "@/sections/hero"
import { Manifesto } from "@/sections/manifesto"
import { NightPhases } from "@/sections/night-phases"
import { Stats } from "@/sections/stats"

export default function App() {
  const [experience, setExperience] = useState<ExperienceId>("observacion")

  const chooseExperience = (id: ExperienceId) => {
    setExperience(id)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById("reserva")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
  }

  return (
    <>
      <a
        href="#reserva"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ember focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Ir a la reserva
      </a>
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <NightPhases />
        <Experiences onChoose={chooseExperience} />
        <Stats />
        <Booking experience={experience} onExperienceChange={setExperience} />
      </main>
      <Footer />
    </>
  )
}
