import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EmailRequest {
  paymentId: string;
  type: "receipt" | "reminder" | "overdue";
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { paymentId, type }: EmailRequest = await req.json();

    // Créer le client Supabase avec service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer les détails du paiement
    const { data: payment, error: paymentError } = await supabase
      .from("payments_enriched")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Paiement introuvable");
    }

    // Récupérer l'email du groupe scolaire
    const { data: schoolGroup, error: groupError } = await supabase
      .from("school_groups")
      .select("contact_email, name")
      .eq("id", payment.school_group_id)
      .single();

    if (groupError || !schoolGroup?.contact_email) {
      throw new Error("Email du groupe scolaire introuvable");
    }

    // Préparer le contenu de l'email selon le type
    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "receipt":
        subject = `Reçu de paiement - ${payment.invoice_number}`;
        htmlContent = generateReceiptEmail(payment, schoolGroup);
        break;
      case "reminder":
        subject = `Rappel de paiement - ${payment.invoice_number}`;
        htmlContent = generateReminderEmail(payment, schoolGroup);
        break;
      case "overdue":
        subject = `Paiement en retard - ${payment.invoice_number}`;
        htmlContent = generateOverdueEmail(payment, schoolGroup);
        break;
    }

    // Créer un log d'email
    const { data: emailLog, error: logError } = await supabase
      .from("email_logs")
      .insert({
        payment_id: paymentId,
        recipient_email: schoolGroup.contact_email,
        email_type: type,
        subject,
        status: "pending",
      })
      .select()
      .single();

    if (logError) {
      console.error("Erreur création log:", logError);
    }

    // Envoyer l'email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "E-Pilot <noreply@e-pilot.com>",
        to: [schoolGroup.contact_email],
        subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(`Erreur Resend: ${JSON.stringify(errorData)}`);
    }

    const resendData = await resendResponse.json();

    // Mettre à jour le log avec succès
    if (emailLog) {
      await supabase
        .from("email_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailLog.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: "Email envoyé avec succès",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Erreur envoi email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur lors de l'envoi de l'email",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

// Templates d'emails
function generateReceiptEmail(payment: any, schoolGroup: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1D3557; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #2A9D8F; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E-Pilot Congo</h1>
            <p>Reçu de Paiement</p>
          </div>
          <div class="content">
            <h2>Bonjour ${schoolGroup.name},</h2>
            <p>Nous confirmons la réception de votre paiement.</p>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td><strong>Facture:</strong></td><td>${payment.invoice_number}</td></tr>
              <tr><td><strong>Montant:</strong></td><td class="amount">${payment.amount.toLocaleString()} ${payment.currency}</td></tr>
              <tr><td><strong>Plan:</strong></td><td>${payment.plan_name}</td></tr>
              <tr><td><strong>Date:</strong></td><td>${new Date(payment.paid_at).toLocaleDateString('fr-FR')}</td></tr>
            </table>
            <p>Merci pour votre confiance !</p>
          </div>
          <div class="footer">
            <p>E-Pilot Congo - Plateforme de Gestion Éducative</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateReminderEmail(payment: any, schoolGroup: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E9C46A; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #E76F51; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E-Pilot Congo</h1>
            <p>Rappel de Paiement</p>
          </div>
          <div class="content">
            <h2>Bonjour ${schoolGroup.name},</h2>
            <p>Nous vous rappelons qu'un paiement est en attente.</p>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td><strong>Facture:</strong></td><td>${payment.invoice_number}</td></tr>
              <tr><td><strong>Montant:</strong></td><td class="amount">${payment.amount.toLocaleString()} ${payment.currency}</td></tr>
              <tr><td><strong>Date d'échéance:</strong></td><td>${new Date(payment.due_date).toLocaleDateString('fr-FR')}</td></tr>
            </table>
            <p>Merci de régulariser votre situation dans les plus brefs délais.</p>
          </div>
          <div class="footer">
            <p>E-Pilot Congo - Plateforme de Gestion Éducative</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateOverdueEmail(payment: any, schoolGroup: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E63946; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #E63946; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E-Pilot Congo</h1>
            <p>⚠️ Paiement en Retard</p>
          </div>
          <div class="content">
            <h2>Bonjour ${schoolGroup.name},</h2>
            <p><strong>Votre paiement est en retard.</strong></p>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td><strong>Facture:</strong></td><td>${payment.invoice_number}</td></tr>
              <tr><td><strong>Montant:</strong></td><td class="amount">${payment.amount.toLocaleString()} ${payment.currency}</td></tr>
              <tr><td><strong>Date d'échéance:</strong></td><td>${new Date(payment.due_date).toLocaleDateString('fr-FR')}</td></tr>
            </table>
            <p>Merci de régulariser votre situation de toute urgence pour éviter la suspension de votre accès.</p>
          </div>
          <div class="footer">
            <p>E-Pilot Congo - Plateforme de Gestion Éducative</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
