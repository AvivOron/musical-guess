import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  const artist = req.nextUrl.searchParams.get('artist');
  if (!title || !artist) return NextResponse.json({ error: 'missing params' }, { status: 400 });

  try {
    const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
    const res = await fetch(`https://api.deezer.com/search?q=${query}&limit=5`);
    if (!res.ok) return NextResponse.json({ previewUrl: null });
    const data = await res.json();
    const track = (data.data ?? []).find((t: { preview: string }) => t.preview);
    return NextResponse.json({ previewUrl: track?.preview ?? null });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
