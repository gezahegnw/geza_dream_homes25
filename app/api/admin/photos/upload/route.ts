import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('photos') as File[];
    const album = formData.get('album') as string || 'general';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const albumDir = join(uploadsDir, album);

    // Create directories if they don't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(albumDir)) {
      await mkdir(albumDir, { recursive: true });
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.name;
      const extension = originalName.split('.').pop();
      const filename = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filePath = join(albumDir, filename);
      await writeFile(filePath, buffer);
      
      uploadedFiles.push({
        id: filename,
        filename,
        originalName,
        album,
        uploadedAt: new Date().toISOString(),
        size: buffer.length,
        url: `/uploads/${album}/${filename}`
      });
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload files',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
