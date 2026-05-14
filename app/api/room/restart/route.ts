import { NextRequest, NextResponse } from 'next/server';
import { restartRoom } from '@/lib/server/store';
import { broadcastState } from '@/lib/server/pusher';

export async function POST(req: NextRequest) {
  const { roomCode, hostId } = await req.json();
  const room = await restartRoom(roomCode, hostId);
  if (!room) return NextResponse.json({ error: 'unauthorized or invalid state' }, { status: 403 });
  await broadcastState(room);
  return NextResponse.json({ ok: true });
}
