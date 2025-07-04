"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CheckCircle, Instagram } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { sendQuoteEmail } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  observations: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SimulationData {
  type: string
  option: string
  value: number
}

interface SimulationModalProps {
  isOpen: boolean
  onClose: () => void
  simulationData: SimulationData
}

const typeMap = {
  imoveis: "Imóvel",
  veiculos: "Veículo",
  servicos: "Serviço",
}

const optionMap = {
  parcela: "parcela",
  credito: "credito",
}

export function SimulationModal({ isOpen, onClose, simulationData }: SimulationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      observations: "",
    },
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)

    try {
      const emailData = {
        quoteType: optionMap[simulationData.option as keyof typeof optionMap],
        consorcioType:
          simulationData.type === "imoveis" ? "imovel" : simulationData.type === "veiculos" ? "veiculo" : "servico",
        value: formatCurrency(simulationData.value).replace("R$", "").trim(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        observations: data.observations || "",
      }

      const result = await sendQuoteEmail(emailData)
      if (result.success) {
        setIsSuccess(true)
        toast({
          title: "Simulação enviada com sucesso!",
          description: "Entraremos em contato em breve.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar simulação",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSuccess(false)
    form.reset()
    onClose()
  }

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-6 rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Simulação enviada com sucesso!</h3>
            <p className="mb-6 text-muted-foreground">
              Obrigado pelo seu interesse. Nossa equipe entrará em contato em breve com sua simulação personalizada.
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Finalizar Simulação</DialogTitle>
        </DialogHeader>

        {/* Simulation Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-2">Resumo da Simulação:</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Tipo:</span> {typeMap[simulationData.type as keyof typeof typeMap]}
            </p>
            <p>
              <span className="font-medium">Modalidade:</span>{" "}
              {simulationData.option === "parcela" ? "Valor da parcela" : "Valor do crédito"}
            </p>
            <p>
              <span className="font-medium">Valor:</span> {formatCurrency(simulationData.value)}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      {...field}
                      onChange={(e) => {
                        // Format phone number
                        const value = e.target.value.replace(/\D/g, "")
                        let formattedValue = value

                        if (value.length <= 11) {
                          if (value.length > 2) {
                            formattedValue = `(${value.slice(0, 2)}) ${value.slice(2)}`
                          }
                          if (value.length > 7) {
                            formattedValue = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
                          }
                        }

                        field.onChange(formattedValue)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhes específicos sobre sua necessidade..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Enviando..." : "Enviar Simulação"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Contact Info */}
        <div className="text-center pt-4 border-t space-y-2">
          <address className="not-italic text-sm text-muted-foreground">
            <p>luizclaudio.santos@gmail.com</p>
            <p>(21) 98276-5505</p>
            <p className="flex items-center justify-center gap-1">
              <Instagram className="h-4 w-4" />
              <a
                href="https://www.instagram.com/luirdi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                @luirdi
              </a>
            </p>
          </address>
        </div>
      </DialogContent>
    </Dialog>
  )
}
