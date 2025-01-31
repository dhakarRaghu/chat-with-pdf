import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
 
  if (!filename) {
    return NextResponse.json({ error: 'here1 Filename is required' }, { status: 400 });
  }

  const body = request.body ? Buffer.from(await request.arrayBuffer()) : null;
  if (!body) {
    return NextResponse.json({ error: 'File content is required' }, { status: 400 });
  }

  try {
    const blob = await put(filename, body, {
      access: 'public',
    });
    // console.log('blob : ', blob);
    return NextResponse.json(blob);
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed and file size should be less than 4Mb' }, { status: 500 });
  }
}