'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { RoomState } from './server/store';

export type ClientRoom = Omit<RoomState, 'deck'> & {
  currentSong: { previewUrl: string; title?: string; artist?: string; year?: number } | null;
};

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<ClientRoom | null>(null);
  const [playing, setPlaying] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(`room-${roomCode}`);
    channel.bind('state', (data: ClientRoom) => {
      setRoom((prev) => {
        if (prev?.phase !== 'listening' && data.phase === 'listening') {
          setPlaying(false);
        }
        return data;
      });
    });
    channel.bind('play', ({ playing }: { playing: boolean }) => {
      setPlaying(playing);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomCode}`);
      pusher.disconnect();
    };
  }, [roomCode]);

  return { room, setRoom, playing, setPlaying };
}
