import { NextRequest, NextResponse } from 'next/server';
import { kickPlayer } from '@/lib/server/store';
import { broadcastState } from '@/lib/server/pusher';

export async function POST(req: NextRequest) {
  const { roomCode, hostId, targetId } = await req.json();
  const room = await kickPlayer(roomCode, hostId, targetId);
  if (!room) return NextResponse.json({ error: 'unauthorized or invalid state' }, { status: 403 });
  await broadcastState(room);
  return NextResponse.json({ ok: true });
}
