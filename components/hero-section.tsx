"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimulationModal } from "@/components/simulation-modal"

export default function HeroSection() {
  const [selectedType, setSelectedType] = useState("imoveis")
  const [selectedOption, setSelectedOption] = useState("parcela")
  const [value, setValue] = useState([1000])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleSimulate = () => {
    setIsModalOpen(true)
  }

  const simulationData = {
    type: selectedType,
    option: selectedOption,
    value: value[0],
  }

  // Configurações do slider baseadas na opção selecionada
  const getSliderConfig = () => {
    if (selectedOption === "parcela") {
      return {
        min: 250,
        max: 10000,
        step: 25,
        minLabel: "R$ 250",
        maxLabel: "R$ 10.000",
      }
    } else {
      return {
        min: 40000,
        max: 1000000,
        step: 10000,
        minLabel: "R$ 40.000",
        maxLabel: "R$ 1.000.000",
      }
    }
  }

  const sliderConfig = getSliderConfig()

  // Ajustar valor quando a opção muda
  const handleOptionChange = (option: string) => {
    setSelectedOption(option)
    if (option === "parcela" && value[0] > 10000) {
      setValue([1000])
    } else if (option === "credito" && value[0] < 40000) {
      setValue([200000])
    }
  }

  return (
    <>
      <section
        className="relative min-h-screen flex items-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/new_home_banner_fundo_14052025-3jgsmaLlTTwIezKZX3HkwWge9tOENI.png)",
        }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="text-white">
              <h1 className="text-4xl lg:text-6xl font-light leading-tight mb-8">
                Para cada
                <br />
                ponto de vista,
                <br />
                <span className="font-bold">
                  um consórcio
                  <br />
                  ConsórcioFácil
                </span>
              </h1>
            </div>

            {/* Right Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md bg-white p-6 shadow-xl">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">Você está perto de realizar</h2>
                  <h3 className="text-lg font-medium text-primary">o seu projeto de vida.</h3>
                </div>

                <div className="space-y-6">
                  {/* Type Selection */}
                  <div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imoveis">Imóveis</SelectItem>
                        <SelectItem value="veiculos">Veículos</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Option Selection */}
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Escolha uma opção:</p>
                    <div className="flex rounded-lg overflow-hidden border">
                      <button
                        onClick={() => handleOptionChange("parcela")}
                        className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                          selectedOption === "parcela"
                            ? "bg-primary text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Parcela
                      </button>
                      <button
                        onClick={() => handleOptionChange("credito")}
                        className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                          selectedOption === "credito"
                            ? "bg-primary text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Crédito
                      </button>
                    </div>
                  </div>

                  {/* Value Selection */}
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {selectedOption === "parcela" ? "Escolha o valor da parcela:" : "Escolha o valor do crédito:"}
                    </p>

                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-gray-800">{formatCurrency(value[0])}</span>
                    </div>

                    <div className="px-2">
                      <Slider
                        value={value}
                        onValueChange={setValue}
                        max={sliderConfig.max}
                        min={sliderConfig.min}
                        step={sliderConfig.step}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{sliderConfig.minLabel}</span>
                        <span>{sliderConfig.maxLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={handleSimulate}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
                    size="lg"
                  >
                    SIMULAR CONSÓRCIO
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <SimulationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} simulationData={simulationData} />
    </>
  )
}
