import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
  try {
    const photosDir = path.join(process.cwd(), 'public', 'Photos');
    const entries = await fs.readdir(photosDir, { withFileTypes: true });
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const urls = files.map((name) => `/Photos/${name}`);

    return NextResponse.json({ images: urls });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to read Photos directory' }, { status: 500 });
  }
}
