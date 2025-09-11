import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the admin manual markdown file
    const manualPath = join(process.cwd(), 'ADMIN_MANUAL.md');
    const manualContent = readFileSync(manualPath, 'utf-8');
    
    return new NextResponse(manualContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': 'attachment; filename="ADMIN_MANUAL.md"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download manual' }, { status: 500 });
  }
}
