import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  intent: z.string().optional(),
  timeframe: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  // Property preferences
  interested_location: z.string().optional(),
  property_type: z.string().optional(),
  min_bedrooms: z.string().optional(),
  min_bathrooms: z.string().optional(),
  min_sqft: z.string().optional(),
  max_sqft: z.string().optional(),
  current_status: z.string().optional(),
  move_in_date: z.string().optional(),
  features: z.string().optional(),
  // Audit & marketing fields (all optional)
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  referrer: z.string().optional(),
  landing_page: z.string().optional(),
  
  token: z.string().optional(), // reCAPTCHA token (optional for now)
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = leadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues:
            process.env.NODE_ENV !== "production" ? parsed.error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA only in production (if keys are configured)
    if (
      process.env.NODE_ENV === "production" &&
      process.env.RECAPTCHA_SECRET_KEY &&
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    ) {
      const token = parsed.data.token;
      if (!token) {
        return NextResponse.json({ error: "Missing reCAPTCHA token" }, { status: 400 });
      }
      try {
        const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: token,
          }),
        });
        const data = (await res.json()) as any;
        if (!data.success || (typeof data.score === "number" && data.score < 0.5)) {
          return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
        }
      } catch (err) {
        console.error("reCAPTCHA verify error", err);
        return NextResponse.json({ error: "reCAPTCHA verification error" }, { status: 400 });
      }
    }

    const ua = req.headers.get("user-agent") ?? undefined;
    const ip =
      (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        undefined) as string | undefined;

    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        intent: parsed.data.intent,
        timeframe: parsed.data.timeframe,
        budget: parsed.data.budget,
        message: parsed.data.message,
        user_agent: ua,
        ip,
        // Property preferences
        interested_location: parsed.data.interested_location,
        property_type: parsed.data.property_type,
        min_bedrooms: parsed.data.min_bedrooms,
        min_bathrooms: parsed.data.min_bathrooms,
        min_sqft: parsed.data.min_sqft,
        max_sqft: parsed.data.max_sqft,
        current_status: parsed.data.current_status,
        move_in_date: parsed.data.move_in_date,
        features: parsed.data.features,
        // Audit fields
        source: parsed.data.source,
        utm_source: parsed.data.utm_source,
        utm_medium: parsed.data.utm_medium,
        utm_campaign: parsed.data.utm_campaign,
        utm_term: parsed.data.utm_term,
        utm_content: parsed.data.utm_content,
        referrer: parsed.data.referrer,
        landing_page: parsed.data.landing_page,
      },
    });

    // Optional: email notifications
    try {
      const notifyEmail = process.env.LEAD_NOTIFICATION_EMAIL;
      const subjectOwner = `New Lead: ${lead.name}`;
      const textBody = `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone ?? "-"}\nIntent: ${lead.intent ?? "-"}\nTimeframe: ${lead.timeframe ?? "-"}\nBudget: ${lead.budget ?? "-"}\nMessage: ${lead.message ?? "-"}`;
      const subjectLead = `Thanks, ${lead.name}! I received your message`;
      const leadText = `Hi ${lead.name},\n\nThanks for reaching out to Geza Dream Homes. I will contact you shortly.\n\n— Gezahegn Worku\n(913) 407-8620\n`;

      // Prefer Resend
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        if (notifyEmail) {
          await resend.emails.send({
            from: "Geza Dream Homes <onboarding@resend.dev>",
            to: notifyEmail,
            subject: subjectOwner,
            text: textBody,
          });
        }
        // Confirmation email to lead
        await resend.emails.send({
          from: "Geza Dream Homes <onboarding@resend.dev>",
          to: lead.email,
          subject: subjectLead,
          text: leadText,
        });
      }
    } catch (e) {
      console.error("Email send failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Error in leads API route:', e);
    
    // Log detailed error information
    if (e instanceof Error) {
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
    }
    
    // Check for database connection issues
    if (e.code === 'P1001') {
      return NextResponse.json(
        { error: "Database connection error", message: "Could not connect to the database" },
        { status: 500 }
      );
    }
    
    // Check for validation errors
    if (e.code === 'P2002') {
      return NextResponse.json(
        { error: "Validation error", message: "A record with this email already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV !== "production" ? 
          `Error: ${e?.message || 'Unknown error'}. Code: ${e?.code || 'N/A'}` : 
          'An error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}
