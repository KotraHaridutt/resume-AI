import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert the File to a Buffer that pdf-parse can read
    const arrayBuffer = await file.arrayBuffer();
    
    // Create parser and extract text
    const parser = new PDFParse({ data: arrayBuffer });
    const result = await parser.getText();
    await parser.destroy();
    
    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}