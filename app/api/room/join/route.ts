import { NextRequest, NextResponse } from 'next/server';
import { joinRoom, getRoom } from '@/lib/server/store';
import { broadcastState, sanitizeRoom } from '@/lib/server/pusher';

export async function POST(req: NextRequest) {
  const { roomCode, playerId, playerName } = await req.json();
  if (!roomCode || !playerId || !playerName)
    return NextResponse.json({ error: 'missing params' }, { status: 400 });

  const room = await joinRoom(roomCode, playerId, playerName);
  if (!room) return NextResponse.json({ error: 'room not found or game already started' }, { status: 404 });

  await broadcastState(room);
  return NextResponse.json(sanitizeRoom(room));
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 });
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(sanitizeRoom(room));
}
