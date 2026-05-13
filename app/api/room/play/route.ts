import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/server/store';
import { pusher } from '@/lib/server/pusher';

export async function POST(req: NextRequest) {
  const { roomCode, hostId, playing } = await req.json();
  const room = await getRoom(roomCode);
  if (!room || room.hostId !== hostId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

  await pusher.trigger(`room-${roomCode}`, 'play', { playing });
  return NextResponse.json({ ok: true });
}
