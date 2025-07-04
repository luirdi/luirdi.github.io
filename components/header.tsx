"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-b-0 border-r-0"></div>
            </div>
            <div>
              <span className="font-bold text-xl text-gray-800">CONSÓRCIOFÁCIL</span>
              <div className="text-xs text-gray-500">consórcio e investimento</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors cursor-pointer"></div>
            <div className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors cursor-pointer"></div>
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-primary font-medium">
                Início
              </a>
              <a href="#" className="text-gray-600">
                Sobre
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
