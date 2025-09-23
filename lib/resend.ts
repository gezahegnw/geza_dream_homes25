import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key is not configured. Skipping email.');
    return;
  }

  try {
    const data = await resend.emails.send({
      from: params.from || 'Geza Dream Homes <onboarding@resend.dev>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    console.log('Email sent successfully via Resend:', data.id);
    return data;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw error;
  }
}
