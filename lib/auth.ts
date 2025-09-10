import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const tokenName = 'auth_token';
const algo = 'HS256';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET || process.env.ADMIN_TOKEN || 'dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: { sub: string; email: string; name: string; approved: boolean; is_admin?: boolean }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    email: payload.email,
    name: payload.name,
    approved: payload.approved,
    is_admin: !!payload.is_admin,
  })
    .setProtectedHeader({ alg: algo })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<null | { sub: string; email: string; name: string; approved: boolean; is_admin?: boolean }>
{
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [algo] });
    return {
      sub: String(payload.sub || ''),
      email: String(payload.email || ''),
      name: String(payload.name || ''),
      approved: Boolean(payload.approved),
      is_admin: Boolean(payload.is_admin),
    };
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: tokenName,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  },
};
