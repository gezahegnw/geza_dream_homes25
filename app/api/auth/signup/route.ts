import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, sessionCookie } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, password_hash, approved: false } });

    // Send notification email to admin
    const notifyEmail = process.env.SIGNUP_NOTIFICATION_EMAIL;
    if (notifyEmail) {
      try {
        await sendEmail({
          to: notifyEmail,
          subject: 'New User Sign-Up on Geza Dream Homes',
          html: `<h1>New User Registration</h1>
                 <p>A new user has signed up and is awaiting approval.</p>
                 <ul>
                   <li><strong>Name:</strong> ${user.name}</li>
                   <li><strong>Email:</strong> ${user.email}</li>
                 </ul>
                 <p>You can approve them in the admin dashboard.</p>`,
        });
      } catch (emailError) {
        console.error("[SIGNUP_EMAIL_ERROR]", emailError);
        // Do not block the user creation process if email fails
      }
    }

    // Optionally issue a session so user can see their status
    const token = await createSessionToken({ sub: user.id, email: user.email, name: user.name, approved: user.approved, is_admin: user.is_admin });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, approved: user.approved } });
    res.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return res;
  } catch (e: any) {
    console.error("[SIGNUP_ERROR]", e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? 'An unknown error occurred') }, { status: 500 });
  }
}
