import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reviews?page=1&pageSize=10
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const [total, items, avg] = await Promise.all([
      prisma.review.count({ where: { approved: true } }),
      prisma.review.findMany({
        where: { approved: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          created_at: true,
          name: true,
          rating: true,
          title: true,
          content: true,
          image_url: true,
        }
      }),
      prisma.review.aggregate({
        where: { approved: true },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      average: avg._avg.rating ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const title = String(body?.title || '').trim();
    const content = String(body?.content || '').trim();
    const imageUrl = String(body?.imageUrl || body?.image_url || '').trim();
    const ratingNum = Number(body?.rating);
    const token = String(body?.token || '').trim();

    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Name is required';
    if (!content) errors.content = 'Review content is required';
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) errors.rating = 'Rating must be 1-5';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    // TEMPORARILY DISABLED: reCAPTCHA v3 verification - domain configuration issue
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    console.log('[RECAPTCHA_DEBUG] reCAPTCHA temporarily disabled for testing - secret:', !!recaptchaSecret, 'token:', !!token);
    
    // TODO: Re-enable after fixing domain configuration in Google reCAPTCHA console
    // The browser-error indicates the site key is registered for different domains
    /*
    if (recaptchaSecret && token) {
      try {
        console.log('[RECAPTCHA_DEBUG] Starting verification, token length:', token.length);
        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret: recaptchaSecret, response: token }),
        });
        const verifyJson: any = await verifyRes.json();
        console.log('[RECAPTCHA_DEBUG] Google response:', JSON.stringify(verifyJson));
        
        const ok = verifyJson?.success && (verifyJson?.score ?? 0) >= 0.4;
        if (!ok) {
          console.log('[RECAPTCHA_DEBUG] Verification failed. Success:', verifyJson?.success, 'Score:', verifyJson?.score, 'Error codes:', verifyJson?.['error-codes']);
          return NextResponse.json({ 
            error: 'reCAPTCHA verification failed', 
            debug: { success: verifyJson?.success, score: verifyJson?.score, errors: verifyJson?.['error-codes'] }
          }, { status: 400 });
        }
        console.log('[RECAPTCHA_DEBUG] Verification passed with score:', verifyJson?.score);
      } catch (err) {
        console.error('[RECAPTCHA_DEBUG] Exception during verification:', err);
        return NextResponse.json({ error: 'reCAPTCHA verification error' }, { status: 400 });
      }
    } else {
      console.log('[RECAPTCHA_DEBUG] Skipping verification - secret:', !!recaptchaSecret, 'token:', !!token);
    }
    */

    // capture ip and user-agent when available
    const ua = (req.headers.get('user-agent') || '').slice(0, 255);
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '')
      .split(',')[0]
      .trim()
      .slice(0, 64);

    const created = await prisma.review.create({
      data: {
        name,
        email: email || null,
        title: title || null,
        content,
        rating: Math.round(ratingNum),
        approved: process.env.REVIEW_REQUIRE_APPROVAL === 'true' ? false : true,
        user_agent: ua || null,
        ip: ip || null,
        image_url: imageUrl ? imageUrl : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
