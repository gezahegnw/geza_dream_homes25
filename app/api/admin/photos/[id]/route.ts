import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const photoId = decodeURIComponent(params.id);
    
    // Parse the photo ID format: "album-filename" or "existing-filename"
    let album = '';
    let filename = '';
    
    if (photoId.startsWith('existing-')) {
      album = 'existing';
      filename = photoId.replace('existing-', '');
    } else {
      const parts = photoId.split('-');
      if (parts.length >= 2) {
        album = parts[0];
        filename = parts.slice(1).join('-');
      } else {
        filename = photoId;
      }
    }
    
    let filePath = '';
    let found = false;
    
    if (album === 'existing') {
      // Delete from Photos directory
      const photosDir = join(process.cwd(), 'public', 'Photos');
      filePath = join(photosDir, filename);
      found = existsSync(filePath);
    } else {
      // Delete from uploads directory
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      
      if (album) {
        // Try specific album first
        const albumPath = join(uploadsDir, album);
        filePath = join(albumPath, filename);
        found = existsSync(filePath);
      }
      
      // If not found and no album specified, search all albums
      if (!found && existsSync(uploadsDir)) {
        const { readdir } = await import('fs/promises');
        const albums = await readdir(uploadsDir);
        
        for (const albumName of albums) {
          const albumPath = join(uploadsDir, albumName);
          const potentialPath = join(albumPath, filename);
          
          if (existsSync(potentialPath)) {
            filePath = potentialPath;
            found = true;
            break;
          }
        }
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
