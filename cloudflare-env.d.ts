declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    /** Endereço público do site (links nas mensagens). */
    SITE_URL: string;
    /** Código para criar a primeira conta de gestão em /configurar. */
    SETUP_TOKEN?: string;
    // Email (Resend)
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    // SMS / WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_SMS_FROM?: string;
    TWILIO_WHATSAPP_FROM?: string;
  }
}
