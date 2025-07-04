import { Instagram, Phone, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="text-white py-8 pb-6 pt-6 bg-[rgba(40,0,0,1)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-400" />
            <a href="mailto:luizclaudio.santos@gmail.com" className="text-gray-300 hover:text-white transition-colors">
              luizclaudio.santos@gmail.com
            </a>
          </div>

          {/* Instagram */}
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-gray-400" />
            <a
              href="https://www.instagram.com/luirdi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              @luirdi
            </a>
          </div>

          {/* WhatsApp Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-400" />
            <a
              href="https://wa.me/5521982765505"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              (21) 98276-5505
            </a>
          </div>
        </div>

        {/* Copyright */}
        
      </div>
    </footer>
  )
}
