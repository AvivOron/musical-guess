import { NextRequest, NextResponse } from 'next/server';
import { submitGuess } from '@/lib/server/store';
import { broadcastState } from '@/lib/server/pusher';

export async function POST(req: NextRequest) {
  const { roomCode, playerId, year } = await req.json();
  if (!roomCode || !playerId || year == null)
    return NextResponse.json({ error: 'missing params' }, { status: 400 });

  const room = await submitGuess(roomCode, playerId, year);
  if (!room) return NextResponse.json({ error: 'room not found or already submitted' }, { status: 400 });

  await broadcastState(room);
  return NextResponse.json({ ok: true });
}
