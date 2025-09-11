import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const photoId = params.id;
    
    // Check in uploads directory first
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const photosDir = join(process.cwd(), 'public', 'Photos');
    
    let filePath = '';
    let found = false;
    
    // Search in uploads subdirectories
    if (existsSync(uploadsDir)) {
      const { readdir } = await import('fs/promises');
      const albums = await readdir(uploadsDir);
      
      for (const album of albums) {
        const albumPath = join(uploadsDir, album);
        const potentialPath = join(albumPath, photoId);
        
        if (existsSync(potentialPath)) {
          filePath = potentialPath;
          found = true;
          break;
        }
      }
    }
    
    // Check in Photos directory
    if (!found) {
      const photosPath = join(photosDir, photoId);
      if (existsSync(photosPath)) {
        filePath = photosPath;
        found = true;
      }
    }
    
    if (!found) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    
    await unlink(filePath);
    
    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete photo',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
