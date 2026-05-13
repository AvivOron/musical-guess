import { NextRequest, NextResponse } from 'next/server';
import { nextRound, getRoom, popNextSeed, setRoomSong } from '@/lib/server/store';
import { broadcastState } from '@/lib/server/pusher';

async function fetchPreview(title: string, artist: string): Promise<string | null> {
  const params = new URLSearchParams({ title, artist });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/preview?${params}`);
  if (!res.ok) return null;
  const { previewUrl } = await res.json();
  return previewUrl ?? null;
}

export async function POST(req: NextRequest) {
  const { roomCode, hostId } = await req.json();
  const room = await getRoom(roomCode);
  if (!room || room.hostId !== hostId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

  const advanced = await nextRound(roomCode);
  if (!advanced) return NextResponse.json({ error: 'room not found' }, { status: 404 });

  if (advanced.phase === 'gameover') {
    await broadcastState(advanced);
    return NextResponse.json({ ok: true });
  }

  await broadcastState(advanced);

  let previewUrl: string | null = null;
  let seed = await popNextSeed(roomCode);
  while (seed && !previewUrl) {
    previewUrl = await fetchPreview(seed.title, seed.artist);
    if (!previewUrl) seed = await popNextSeed(roomCode);
  }

  if (!seed || !previewUrl) {
    const r = await getRoom(roomCode);
    if (r) { r.phase = 'gameover'; await broadcastState(r); }
    return NextResponse.json({ ok: true });
  }

  const updatedRoom = await setRoomSong(roomCode, {
    title: seed.title,
    artist: seed.artist,
    year: seed.year,
    previewUrl,
  });
  if (!updatedRoom) return NextResponse.json({ error: 'room not found' }, { status: 404 });

  await broadcastState(updatedRoom);
  return NextResponse.json({ ok: true });
}
