import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const albums = [];
    
    // Get existing photos album
    const photosDir = join(process.cwd(), 'public', 'Photos');
    if (existsSync(photosDir)) {
      const files = await readdir(photosDir);
      const photoFiles = files.filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));
      
      albums.push({
        name: 'existing',
        count: photoFiles.length,
        coverPhoto: photoFiles.length > 0 ? `/Photos/${photoFiles[0]}` : undefined
      });
    }
    
    // Get uploaded albums from filesystem
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (existsSync(uploadsDir)) {
      const albumDirs = await readdir(uploadsDir);
      
      for (const albumName of albumDirs) {
        const albumPath = join(uploadsDir, albumName);
        const albumStat = await stat(albumPath);
        
        if (albumStat.isDirectory()) {
          const files = await readdir(albumPath);
          const photoFiles = files.filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));
          
          albums.push({
            name: albumName,
            count: photoFiles.length,
            coverPhoto: photoFiles.length > 0 ? `/uploads/${albumName}/${photoFiles[0]}` : undefined
          });
        }
      }
    }

    return NextResponse.json({ albums });
  } catch (error) {
    console.error('Failed to fetch albums:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 });
    }

    const albumName = name.trim();
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const albumPath = join(uploadsDir, albumName);
    
    // Check if album already exists
    if (existsSync(albumPath)) {
      return NextResponse.json({ error: 'Album already exists' }, { status: 400 });
    }

    // Create the album directory
    const { mkdir } = await import('fs/promises');
    await mkdir(albumPath, { recursive: true });
    
    return NextResponse.json({ success: true, album: { name: albumName, count: 0 } });
  } catch (error) {
    console.error('Failed to create album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
