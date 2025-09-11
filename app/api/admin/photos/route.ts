import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const photosDir = join(process.cwd(), 'public', 'Photos');
    const files = await readdir(photosDir);
    
    const photos = await Promise.all(
      files
        .filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file))
        .map(async (file) => {
          const filePath = join(photosDir, file);
          const stats = await stat(filePath);
          
          return {
            id: file,
            filename: file,
            originalName: file,
            album: 'existing', // Default album for existing photos
            uploadedAt: stats.mtime.toISOString(),
            size: stats.size,
            url: `/Photos/${file}`
          };
        })
    );

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
