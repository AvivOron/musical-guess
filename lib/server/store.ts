import { Redis } from '@upstash/redis';
import { SongSeed, shuffleDeck, SONG_SEEDS } from '../songs';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL = 60 * 60 * 6; // 6 hours

export type ServerPlayer = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
};

export type RoundResult = {
  playerId: string;
  playerName: string;
  guess: number;
  distance: number;
  won: boolean;
};

export type GamePhase = 'lobby' | 'loading' | 'listening' | 'revealing' | 'gameover';

export type RoomState = {
  roomCode: string;
  hostId: string;
  players: ServerPlayer[];
  phase: GamePhase;
  currentSong: { title: string; artist: string; year: number; previewUrl: string } | null;
  guesses: Record<string, number>;
  submittedIds: string[];
  roundResults: RoundResult[];
  deck: SongSeed[];
  round: number;
  totalRounds: number;
};

function key(code: string) {
  return `room:${code.toUpperCase()}`;
}

async function getRoom(code: string): Promise<RoomState | null> {
  return redis.get<RoomState>(key(code));
}

async function saveRoom(room: RoomState): Promise<void> {
  await redis.set(key(room.roomCode), room, { ex: TTL });
}

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(hostId: string, hostName: string, totalRounds: number): Promise<RoomState> {
  let code = makeCode();
  while (await getRoom(code)) code = makeCode();

  const room: RoomState = {
    roomCode: code,
    hostId,
    players: [{ id: hostId, name: hostName, score: 0, isHost: true }],
    phase: 'lobby',
    currentSong: null,
    guesses: {},
    submittedIds: [],
    roundResults: [],
    deck: shuffleDeck(SONG_SEEDS),
    round: 0,
    totalRounds,
  };
  await saveRoom(room);
  return room;
}

export { getRoom };

export async function restartRoom(code: string, hostId: string, totalRounds?: number): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== hostId || room.phase !== 'gameover') return null;
  room.phase = 'lobby';
  room.round = 0;
  room.totalRounds = totalRounds ?? room.totalRounds;
  room.currentSong = null;
  room.guesses = {};
  room.submittedIds = [];
  room.roundResults = [];
  room.deck = shuffleDeck(SONG_SEEDS);
  room.players.forEach((p) => { p.score = 0; });
  await saveRoom(room);
  return room;
}

export async function joinRoom(code: string, playerId: string, playerName: string): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room) return null;
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) return room;
  if (room.phase !== 'lobby') return null;
  room.players.push({ id: playerId, name: playerName, score: 0, isHost: false });
  await saveRoom(room);
  return room;
}

export async function setRoomLoading(code: string): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room) return null;
  room.phase = 'loading';
  room.round += 1;
  await saveRoom(room);
  return room;
}

export async function setRoomSong(
  code: string,
  song: { title: string; artist: string; year: number; previewUrl: string }
): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room) return null;
  room.currentSong = song;
  room.phase = 'listening';
  room.guesses = {};
  room.submittedIds = [];
  room.roundResults = [];
  await saveRoom(room);
  return room;
}

export async function submitGuess(code: string, playerId: string, year: number): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room || room.submittedIds.includes(playerId)) return null;

  room.guesses[playerId] = year;
  room.submittedIds.push(playerId);

  if (room.submittedIds.length === room.players.length) {
    const correctYear = room.currentSong!.year;
    const results: RoundResult[] = room.players.map((p) => {
      const guess = room.guesses[p.id] ?? 0;
      const distance = Math.abs(guess - correctYear);
      return { playerId: p.id, playerName: p.name, guess, distance, won: false };
    });
    const minDist = Math.min(...results.map((r) => r.distance));
    results.forEach((r) => {
      if (r.distance === minDist) {
        r.won = true;
        const player = room.players.find((p) => p.id === r.playerId)!;
        player.score += r.distance === 0 ? 2 : 1;
      }
    });
    room.roundResults = results;
    room.phase = 'revealing';
  }

  await saveRoom(room);
  return room;
}

export async function forceReveal(code: string, hostId: string): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== hostId || room.phase !== 'listening') return null;

  const correctYear = room.currentSong!.year;
  const NO_GUESS = -1;
  const results: RoundResult[] = room.players.map((p) => {
    const guessVal = room.guesses[p.id] ?? null;
    const distance = guessVal !== null ? Math.abs(guessVal - correctYear) : NO_GUESS;
    return { playerId: p.id, playerName: p.name, guess: guessVal ?? 0, distance, won: false };
  });
  const submitted = results.filter((r) => r.distance !== NO_GUESS);
  const minDist = submitted.length > 0 ? Math.min(...submitted.map((r) => r.distance)) : NO_GUESS;
  results.forEach((r) => {
    if (minDist !== NO_GUESS && r.distance === minDist) {
      r.won = true;
      const player = room.players.find((p) => p.id === r.playerId)!;
      player.score += r.distance === 0 ? 2 : 1;
    }
  });
  room.roundResults = results;
  room.phase = 'revealing';
  await saveRoom(room);
  return room;
}

export async function nextRound(code: string): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.round >= room.totalRounds) {
    room.phase = 'gameover';
  } else {
    room.phase = 'loading';
    room.round += 1;
  }
  await saveRoom(room);
  return room;
}

export async function popNextSeed(code: string): Promise<SongSeed | null> {
  const room = await getRoom(code);
  if (!room || room.deck.length === 0) return null;
  const seed = room.deck.shift()!;
  await saveRoom(room);
  return seed;
}
