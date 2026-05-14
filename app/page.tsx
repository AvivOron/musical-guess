'use client';

import { useState, useEffect, useRef } from 'react';
import { useRoom } from '@/lib/use-room';
import LobbyScreen from '@/components/lobby-screen';
import LoadingScreen from '@/components/loading-screen';
import GameScreen from '@/components/game-screen';
import RevealScreen from '@/components/reveal-screen';
import ScoreboardScreen from '@/components/scoreboard-screen';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Home() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId] = useState(() => {
    if (typeof window === 'undefined') return generateId();
    const stored = sessionStorage.getItem('hitster_player_id');
    if (stored) return stored;
    const id = generateId();
    sessionStorage.setItem('hitster_player_id', id);
    return id;
  });

  const [inviteCode, setInviteCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('code');
  });

  const { room, setRoom, playing, setPlaying } = useRoom(roomCode);

  const handleCreate = async (hostName: string, totalRounds: number) => {
    const res = await fetch(`${BASE}/api/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: playerId, hostName, totalRounds }),
    });
    const { roomCode: code } = await res.json();
    const roomRes = await fetch(`${BASE}/api/room/join?code=${code}`);
    const roomData = await roomRes.json();
    setRoom(roomData);
    setRoomCode(code);
  };

  const handleJoin = async (code: string, playerName: string) => {
    const res = await fetch(`${BASE}/api/room/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: code, playerId, playerName }),
    });
    if (!res.ok) { alert('Room not found or game already started'); return; }
    const data = await res.json();
    setRoom(data);
    setRoomCode(code);
  };

  const handleStart = async () => {
    await fetch(`${BASE}/api/room/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, hostId: playerId }),
    });
  };

  const handleGuess = async (year: number) => {
    await fetch(`${BASE}/api/room/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, playerId, year }),
    });
  };

  const handlePlay = async (p: boolean) => {
    setPlaying(p);
    await fetch(`${BASE}/api/room/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, hostId: playerId, playing: p }),
    });
  };

  const handleNext = async () => {
    setPlaying(false);
    await fetch(`${BASE}/api/room/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, hostId: playerId }),
    });
  };

  const handleReveal = async () => {
    setPlaying(false);
    await fetch(`${BASE}/api/room/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, hostId: playerId }),
    });
  };

  const handleRestart = async () => {
    await fetch(`${BASE}/api/room/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, hostId: playerId }),
    });
  };

  if (!roomCode || !room) {
    return <LobbyScreen onCreate={handleCreate} onJoin={handleJoin} inviteCode={inviteCode} />;
  }

  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);

  if (room.phase === 'lobby') {
    return (
      <LobbyScreen
        onCreate={handleCreate}
        onJoin={handleJoin}
        room={room}
        isHost={isHost}
        onStart={handleStart}
      />
    );
  }

  if (room.phase === 'loading') return <LoadingScreen />;

  if (room.phase === 'listening') {
    return (
      <GameScreen
        previewUrl={room.currentSong?.previewUrl ?? ''}
        players={room.players}
        submittedIds={room.submittedIds}
        playerId={playerId}
        isHost={isHost}
        playing={playing}
        onPlay={handlePlay}
        onGuess={handleGuess}
        onReveal={handleReveal}
      />
    );
  }

  if (room.phase === 'revealing') {
    return (
      <RevealScreen
        song={room.currentSong as { title: string; artist: string; year: number; previewUrl: string }}
        results={room.roundResults}
        players={room.players}
        round={room.round}
        totalRounds={room.totalRounds}
        isHost={isHost}
        onNext={handleNext}
      />
    );
  }

  if (room.phase === 'gameover') {
    return <ScoreboardScreen players={room.players} onRestart={isHost ? handleRestart : undefined} />;
  }

  return null;
}
