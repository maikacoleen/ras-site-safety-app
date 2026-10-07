import { type NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(request: NextRequest) {
  // 1. Add authentication here if needed (e.g., check session or JWT)

  const pathname = request.nextUrl.searchParams.get('pathname');

  if (!pathname) {
    return NextResponse.json({ error: 'Missing pathname parameter' }, { status: 400 });
  }

  try {
    const result = await get(pathname, { access: 'private' });

    if (result?.statusCode !== 200) {
      return new NextResponse('File not found', { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving private blob:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}