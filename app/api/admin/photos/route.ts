import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const allPhotos = [];
    
    // Get existing photos from /public/Photos/
    const photosDir = join(process.cwd(), 'public', 'Photos');
    if (existsSync(photosDir)) {
      const files = await readdir(photosDir);
      const existingPhotos = await Promise.all(
        files
          .filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file))
          .map(async (file) => {
            const filePath = join(photosDir, file);
            const stats = await stat(filePath);
            
            return {
              id: `existing-${file}`,
              filename: file,
              originalName: file,
              album: 'existing',
              uploadedAt: stats.mtime.toISOString(),
              size: stats.size,
              url: `/Photos/${file}`
            };
          })
      );
      allPhotos.push(...existingPhotos);
    }
    
    // Get uploaded photos from /public/uploads/
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (existsSync(uploadsDir)) {
      const albums = await readdir(uploadsDir);
      
      for (const album of albums) {
        const albumDir = join(uploadsDir, album);
        const albumStat = await stat(albumDir);
        
        if (albumStat.isDirectory()) {
          const files = await readdir(albumDir);
          const albumPhotos = await Promise.all(
            files
              .filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file))
              .map(async (file) => {
                const filePath = join(albumDir, file);
                const stats = await stat(filePath);
                
                return {
                  id: `${album}-${file}`,
                  filename: file,
                  originalName: file.replace(/^\d+-/, ''), // Remove timestamp prefix
                  album: album,
                  uploadedAt: stats.mtime.toISOString(),
                  size: stats.size,
                  url: `/uploads/${album}/${file}`
                };
              })
          );
          allPhotos.push(...albumPhotos);
        }
      }
    }

    return NextResponse.json({ photos: allPhotos });
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
