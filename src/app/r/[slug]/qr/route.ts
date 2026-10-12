import { NextRequest, NextResponse } from 'next/server';
import qrcode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = `${req.nextUrl.origin}/r/${slug}`;

  try {
    const svg = await qrcode.toString(url, {
      type: 'svg',
      color: {
        dark: '#ff6600',
        light: '#ffffff',
      },
      width: 320,
      margin: 2,
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    return new NextResponse('Erreur de génération QR code', { status: 500 });
  }
}
