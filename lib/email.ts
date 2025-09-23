import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: MailOptions) {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
    console.error('Email environment variables are not fully configured. Skipping email.');
    // In a real app, you might want to throw an error or handle this more gracefully.
    return;
  }

  const transport = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      html: html,
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
