import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to parse PDF';
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'PDF is too large. Please upload a file smaller than 4MB.',
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

    let text = '';
    try {
      const result = await parser.getText();
      text = result.text;
    } finally {
      await parser.destroy();
    }

    return NextResponse.json({
      text,
    });
  } catch (error) {
    console.error('PDF Parsing Error:', error);

    return NextResponse.json(
      {
        error: extractMessage(error),
      },
      { status: 500 }
    );
  }
}