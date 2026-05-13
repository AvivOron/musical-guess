import Pusher from 'pusher';
import { RoomState } from './store';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export function broadcastState(room: RoomState) {
  return pusher.trigger(`room-${room.roomCode}`, 'state', sanitizeRoom(room));
}

export function sanitizeRoom(room: RoomState) {
  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    players: room.players,
    phase: room.phase,
    currentSong: room.phase === 'revealing' || room.phase === 'gameover'
      ? room.currentSong
      : room.currentSong
        ? { previewUrl: room.currentSong.previewUrl }
        : null,
    guesses: room.phase === 'revealing' || room.phase === 'gameover' ? room.guesses : {},
    submittedIds: room.submittedIds,
    roundResults: room.roundResults,
    round: room.round,
    totalRounds: room.totalRounds,
  };
}
