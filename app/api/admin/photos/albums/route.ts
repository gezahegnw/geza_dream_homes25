import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

// In-memory album storage (in production, you'd use a database)
let albums: { [key: string]: string[] } = {
  'general': [],
  'existing': []
};

export async function GET() {
  try {
    const photosDir = join(process.cwd(), 'public', 'Photos');
    const files = await readdir(photosDir);
    const photoFiles = files.filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));
    
    // Count existing photos
    albums['existing'] = photoFiles;
    
    const albumsWithCounts = Object.entries(albums).map(([name, photos]) => ({
      name,
      count: photos.length,
      coverPhoto: photos.length > 0 ? `/Photos/${photos[0]}` : undefined
    }));

    return NextResponse.json({ albums: albumsWithCounts });
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
    if (albums[albumName]) {
      return NextResponse.json({ error: 'Album already exists' }, { status: 400 });
    }

    albums[albumName] = [];
    
    return NextResponse.json({ success: true, album: { name: albumName, count: 0 } });
  } catch (error) {
    console.error('Failed to create album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
