"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Building2, Car, CheckCircle, Wrench, Instagram } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendQuoteEmail } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  quoteType: z.enum(["parcela", "credito"]),
  consorcioType: z.enum(["imovel", "veiculo", "servico"]),
  value: z.string().min(1, "Valor é obrigatório"),
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  observations: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function QuoteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quoteType: "parcela",
      consorcioType: "imovel",
      value: "",
      name: "",
      email: "",
      phone: "",
      observations: "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)

    try {
      const result = await sendQuoteEmail(data)
      if (result.success) {
        setIsSuccess(true)
        toast({
          title: "Cotação enviada com sucesso!",
          description: "Entraremos em contato em breve.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar cotação",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 rounded-full bg-green-100 p-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h3 className="mb-2 text-2xl font-bold">Cotação enviada com sucesso!</h3>
        <p className="mb-6 text-muted-foreground">
          Obrigado pelo seu interesse. Nossa equipe entrará em contato em breve com sua cotação personalizada.
        </p>
        <Button
          onClick={() => {
            setIsSuccess(false)
            form.reset()
          }}
        >
          Solicitar nova cotação
        </Button>
      </div>
    )
  }

  return (
    <div id="cotacao">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Solicite sua cotação</h2>
        <p className="text-muted-foreground">Preencha os dados abaixo e receba uma proposta personalizada</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="quoteType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">O que você deseja cotar?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2 sm:flex-row sm:space-x-6 sm:space-y-0"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="parcela" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Valor da parcela que posso pagar</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="credito" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Valor do crédito que desejo</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consorcioType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">Tipo de consórcio</FormLabel>
                <FormControl>
                  <Tabs defaultValue={field.value} onValueChange={field.onChange} className="w-full">
                    <TabsList className="grid grid-cols-3 h-auto">
                      <TabsTrigger value="imovel" className="flex items-center gap-2 py-3">
                        <Building2 className="h-4 w-4" />
                        <span>Imóvel</span>
                      </TabsTrigger>
                      <TabsTrigger value="veiculo" className="flex items-center gap-2 py-3">
                        <Car className="h-4 w-4" />
                        <span>Veículo</span>
                      </TabsTrigger>
                      <TabsTrigger value="servico" className="flex items-center gap-2 py-3">
                        <Wrench className="h-4 w-4" />
                        <span>Serviço</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="imovel">
                      <Card className="border-t-0 rounded-t-none p-4">
                        <p className="text-sm text-muted-foreground">
                          Consórcio para casas, apartamentos, terrenos, salas comerciais e outros imóveis.
                        </p>
                      </Card>
                    </TabsContent>
                    <TabsContent value="veiculo">
                      <Card className="border-t-0 rounded-t-none p-4">
                        <p className="text-sm text-muted-foreground">
                          Consórcio para carros, motos, caminhões e outros veículos novos ou usados.
                        </p>
                      </Card>
                    </TabsContent>
                    <TabsContent value="servico">
                      <Card className="border-t-0 rounded-t-none p-4">
                        <p className="text-sm text-muted-foreground">
                          Consórcio para cirurgias, estudos, viagens, reformas e outros serviços.
                        </p>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">
                  {form.watch("quoteType") === "parcela"
                    ? "Valor da parcela que deseja pagar (R$)"
                    : "Valor do crédito que deseja (R$)"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0,00"
                    {...field}
                    onChange={(e) => {
                      // Format as currency
                      const value = e.target.value.replace(/\D/g, "")
                      const formattedValue = new Intl.NumberFormat("pt-BR", {
                        minimumFractionDigits: 2,
                      }).format(Number(value) / 100)

                      field.onChange(formattedValue)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
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
          </div>

          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva detalhes específicos sobre sua necessidade, preferências ou qualquer informação adicional que possa ajudar na cotação..."
                    className="min-h-[100px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Solicitar cotação"}
          </Button>

          <div className="text-right pt-6 border-t space-y-2">
            <address className="not-italic text-sm text-muted-foreground">
              <p>luizclaudio.santos@gmail.com</p>
              <p>(21) 98276-5505</p>
              <p className="flex items-center justify-end gap-1">
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
        </form>
      </Form>
    </div>
  )
}
