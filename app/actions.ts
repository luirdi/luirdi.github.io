"use server"

import { z } from "zod"

const quoteSchema = z.object({
  quoteType: z.enum(["parcela", "credito"]),
  consorcioType: z.enum(["imovel", "veiculo", "servico"]),
  value: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  observations: z.string().optional(),
})

type QuoteData = z.infer<typeof quoteSchema>

const consorcioTypeMap = {
  imovel: "Imóvel",
  veiculo: "Veículo",
  servico: "Serviço",
}

const quoteTypeMap = {
  parcela: "Valor da parcela",
  credito: "Valor do crédito",
}

export async function sendQuoteEmail(data: QuoteData) {
  // Validate data
  const validatedData = quoteSchema.parse(data)

  // Check if SendGrid is configured
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    console.log("SendGrid não configurado - simulando envio de email")
    console.log("Dados da cotação:", validatedData)

    // In development mode without SendGrid, just log the data
    return {
      success: true,
      message: "Cotação processada com sucesso! (Modo desenvolvimento)",
    }
  }

  // Create email content
  const emailData = {
    personalizations: [
      {
        to: [
          {
            email: "l1c9s8s0@me.com",
            name: "Luirdi",
          },
        ],
        subject: `Nova cotação de consórcio - ${consorcioTypeMap[validatedData.consorcioType]}`,
      },
    ],
    from: {
      email: fromEmail,
      name: "ConsórcioFácil - Luirdi",
    },
    content: [
      {
        type: "text/html",
        value: `
<div style="max-width: 600px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; background: #f8fafc;">
  
  <!-- Content -->
  <div style="background: #f8fafc; padding: 32px; border: 1px solid #d1d5db;">
    
    <!-- Cliente -->
    <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #d1d5db;">
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Cliente</h2>
      <p style="margin: 0 0 8px; color: #374151;"><strong style="color: #1f2937;">Nome:</strong> ${validatedData.name}</p>
      <p style="margin: 0 0 8px; color: #374151;"><strong style="color: #1f2937;">Email:</strong> ${validatedData.email}</p>
      <p style="margin: 0; color: #374151;"><strong style="color: #1f2937;">Telefone:</strong> ${validatedData.phone}</p>
    </div>
    
    <!-- Cotação -->
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #d1d5db;">
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Detalhes da Cotação</h2>
      <p style="margin: 0 0 8px; color: #374151;"><strong style="color: #1f2937;">Tipo:</strong> 
        <span style="background: #1f2937; color: #f8fafc; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${consorcioTypeMap[validatedData.consorcioType]}</span>
      </p>
      <p style="margin: 0 0 8px; color: #374151;"><strong style="color: #1f2937;">${quoteTypeMap[validatedData.quoteType]}:</strong> 
        <span style="color: #1f2937; font-weight: 700; font-size: 18px;">R$ ${validatedData.value}</span>
      </p>
      <p style="margin: 0; color: #374151;"><strong style="color: #1f2937;">Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
    </div>
    
    ${
      validatedData.observations
        ? `
<!-- Observações -->
<div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #374151;">
  <h2 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Observações</h2>
  <p style="color: #1f2937; margin: 0; font-style: italic;">"${validatedData.observations}"</p>
</div>
`
        : ""
    }
    
    
  </div>
  
</div>
`,
      },
    ],
  }

  try {
    // Send email using SendGrid API
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("SendGrid API Error:", response.status, errorText)

      // Return more specific error messages
      if (response.status === 401) {
        throw new Error("Erro de autenticação SendGrid - verifique a API Key")
      } else if (response.status === 403) {
        throw new Error("Email remetente não verificado no SendGrid")
      } else {
        throw new Error(`Erro SendGrid: ${response.status}`)
      }
    }

    console.log("Email enviado com sucesso via SendGrid para l1c9s8s0@me.com")

    return {
      success: true,
      message: "Cotação enviada com sucesso!",
    }
  } catch (error) {
    console.error("Erro ao enviar email:", error)

    // Return user-friendly error message
    if (error instanceof Error) {
      throw new Error(error.message)
    } else {
      throw new Error("Falha ao enviar cotação - tente novamente")
    }
  }
}
