import { NextResponse } from 'next/server';

export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  return NextResponse.json({
    hasSiteKey: !!siteKey,
    hasSecretKey: !!secretKey,
    siteKeyPrefix: siteKey ? siteKey.substring(0, 10) + '...' : 'missing',
    secretKeyPrefix: secretKey ? secretKey.substring(0, 10) + '...' : 'missing',
    environment: process.env.NODE_ENV || 'unknown'
  });
}
