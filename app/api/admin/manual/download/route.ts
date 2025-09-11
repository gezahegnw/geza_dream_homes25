import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the admin manual markdown file
    const manualPath = join(process.cwd(), 'ADMIN_MANUAL.md');
    const manualContent = readFileSync(manualPath, 'utf-8');
    
    // Create a simple HTML version for PDF conversion
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Geza Dream Homes - Admin Manual</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px; }
        h3 { color: #1e3a8a; margin-top: 25px; }
        code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
        pre { background: #f9fafb; padding: 15px; border-radius: 5px; overflow-x: auto; border-left: 4px solid #2563eb; }
        ul, ol { margin-left: 20px; }
        li { margin: 5px 0; }
        .checklist { background: #f0f9ff; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; }
        .info { background: #ecfdf5; padding: 15px; border-radius: 5px; border-left: 4px solid #10b981; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .page-break { page-break-before: always; }
        @media print {
            body { font-size: 12px; }
            h1 { font-size: 24px; }
            h2 { font-size: 20px; }
            h3 { font-size: 16px; }
        }
    </style>
</head>
<body>
${convertMarkdownToHTML(manualContent)}
</body>
</html>`;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="Geza-Dream-Homes-Admin-Manual.html"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate manual' }, { status: 500 });
  }
}

function convertMarkdownToHTML(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    
    // Bold and italic
    .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/gim, '<em>$1</em>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    
    // Line breaks
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    
    // Wrap in paragraphs
    .replace(/^(?!<[h|u|o|p|d])/gim, '<p>')
    .replace(/(?<!>)$/gim, '</p>')
    
    // Clean up
    .replace(/<p><\/p>/gim, '')
    .replace(/<p>(<[h|u|o])/gim, '$1')
    .replace(/(<\/[h|u|o]>)<\/p>/gim, '$1');
}
