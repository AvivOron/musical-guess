import { NextRequest, NextResponse } from 'next/server';
import { setRoomLoading, popNextSeed, setRoomSong, getRoom } from '@/lib/server/store';
import { broadcastState } from '@/lib/server/pusher';

async function fetchPreview(title: string, artist: string): Promise<string | null> {
  const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
  const res = await fetch(`https://api.deezer.com/search?q=${query}&limit=5`);
  if (!res.ok) return null;
  const data = await res.json();
  const track = (data.data ?? []).find((t: { preview: string }) => t.preview);
  return track?.preview ?? null;
}

export async function POST(req: NextRequest) {
  const { roomCode, hostId } = await req.json();
  const room = await getRoom(roomCode);
  if (!room || room.hostId !== hostId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

  const loadingRoom = await setRoomLoading(roomCode);
  if (!loadingRoom) return NextResponse.json({ error: 'room not found' }, { status: 404 });
  await broadcastState(loadingRoom);

  let previewUrl: string | null = null;
  let seed = await popNextSeed(roomCode);
  while (seed && !previewUrl) {
    previewUrl = await fetchPreview(seed.title, seed.artist);
    if (!previewUrl) seed = await popNextSeed(roomCode);
  }

  if (!seed || !previewUrl) return NextResponse.json({ error: 'no songs left' }, { status: 500 });

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
