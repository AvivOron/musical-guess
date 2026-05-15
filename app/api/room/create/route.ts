import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/server/store';
import { broadcastState } from '@/lib/server/pusher';

export async function POST(req: NextRequest) {
  const { hostId, hostName, totalRounds, genre } = await req.json();
  if (!hostId || !hostName) return NextResponse.json({ error: 'missing params' }, { status: 400 });

  const room = await createRoom(hostId, hostName, totalRounds ?? 10, genre ?? 'international');
  await broadcastState(room);
  return NextResponse.json({ roomCode: room.roomCode });
}
