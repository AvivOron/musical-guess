'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Check, Music2, Volume2 } from 'lucide-react';
import Spinner from './spinner';
import { ServerPlayer } from '@/lib/server/store';

const VOLUME_KEY = 'hitster_volume';

type Props = {
  previewUrl: string;
  players: ServerPlayer[];
  submittedIds: string[];
  playerId: string;
  isHost: boolean;
  playing: boolean;
  onPlay: (playing: boolean) => Promise<void>;
  onGuess: (year: number) => Promise<void>;
  onReveal: () => Promise<void>;
  onKick?: (targetId: string) => Promise<void>;
};

export default function GameScreen({ previewUrl, players, submittedIds, playerId, isHost, playing, onPlay, onGuess, onReveal, onKick }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [guess, setGuess] = useState('');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [loading, setLoading] = useState<'guess' | 'reveal' | null>(null);
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 1;
    return parseFloat(localStorage.getItem(VOLUME_KEY) ?? '1');
  });

  const wrap = (key: 'guess' | 'reveal', fn: () => void | Promise<void>) => async () => {
    if (loading) return;
    setLoading(key);
    try { await fn(); } finally { setLoading(null); }
  };
  const submitted = submittedIds.includes(playerId);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = previewUrl;
    setProgress(0);
    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => onPlay(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [previewUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && (isHost || audioUnlocked)) audio.play().catch(() => {});
    else audio.pause();
  }, [playing, audioUnlocked]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleVolume = (v: number) => {
    setVolume(v);
    localStorage.setItem(VOLUME_KEY, String(v));
  };

  const togglePlay = () => onPlay(!playing);

  const submitGuess = wrap('guess', () => {
    const val = parseInt(guess);
    if (isNaN(val) || val < 1900 || val > 2025) return;
    return onGuess(val);
  });

  const answeredCount = submittedIds.length;
  const totalCount = players.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-6 gap-8" dir="rtl">
      <audio ref={audioRef} />

      {/* Header */}
      <div className="w-full max-w-sm pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Music2 className="w-4 h-4" />
          <span>ניחושים מוזיקליים</span>
        </div>
        <span className="text-zinc-500 text-sm">{answeredCount}/{totalCount} ענו</span>
      </div>

      {/* Player controls */}
      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        {isHost ? (
          <>
            <button
              onClick={togglePlay}
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
                playing
                  ? 'bg-zinc-800 border-2 border-zinc-700 text-white hover:bg-zinc-700'
                  : 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-yellow-400/30'
              }`}
            >
              {playing ? <Pause className="w-11 h-11" /> : <Play className="w-11 h-11 mr-[-4px]" />}
            </button>
            <div className="w-full space-y-1.5">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              {playing && (
                <p className="text-center text-zinc-600 text-xs">כולם שומעים את השיר</p>
              )}
            </div>
            <button
              onClick={wrap('reveal', () => onReveal())}
              disabled={loading === 'reveal'}
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading === 'reveal' ? <Spinner /> : 'סיים סיבוב'}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              onClick={() => {
                const audio = audioRef.current;
                if (!audio) return;
                setAudioUnlocked(true);
                if (playing) audio.play().catch(() => {});
              }}
              className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${
                playing ? 'border-yellow-400/50 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {playing && audioUnlocked ? (
                <div className="flex gap-1.5 items-end h-8">
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s`, height: `${[60,100,80,40][i-1]}%` }}
                    />
                  ))}
                </div>
              ) : (
                <Music2 className={`w-10 h-10 ${playing ? 'text-yellow-400' : 'text-zinc-700'}`} />
              )}
            </button>
            <p className="text-zinc-500 text-sm">
              {playing && !audioUnlocked ? 'הקש להאזנה' : playing ? 'השיר מתנגן...' : 'ממתין למארח...'}
            </p>
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="w-full max-w-sm flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-zinc-500 shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => handleVolume(parseFloat(e.target.value))}
          className="flex-1 accent-yellow-400 h-1 rounded-full"
        />
      </div>

      {/* Guess input */}
      <div className="w-full max-w-sm">
        {submitted ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-green-400 font-semibold">ניחוש נשלח!</span>
            <span className="text-zinc-600 text-sm">ממתין לשאר השחקנים...</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <p className="text-center text-zinc-400 text-sm font-medium">באיזו שנה יצא השיר?</p>
            <input
              type="number"
              placeholder="למשל: 1985"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
              min={1940}
              max={2025}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white text-center placeholder-zinc-700 focus:outline-none focus:border-yellow-400/60 text-2xl font-bold tracking-widest transition-colors"
            />
            <button
              onClick={submitGuess}
              disabled={!guess || loading === 'guess'}
              className="w-full py-3.5 rounded-xl bg-yellow-400 text-zinc-950 font-bold text-base hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-yellow-400/20"
            >
              {loading === 'guess' ? <Spinner /> : 'שלח ניחוש'}
            </button>
          </div>
        )}
      </div>

      {/* Players list */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2">
        {players.map((p) => {
          const done = submittedIds.includes(p.id);
          const isMe = p.id === playerId;
          return (
            <div
              key={p.id}
              className={`rounded-xl px-3 py-2.5 flex items-center gap-2 border transition-colors ${
                done ? 'border-green-500/20 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/40'
              } ${isMe ? 'ring-1 ring-yellow-400/30' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? 'bg-green-400' : 'bg-zinc-700'}`} />
              <span className={`text-sm truncate flex-1 ${isMe ? 'text-white font-semibold' : 'text-zinc-400'}`}>{p.name}</span>
              {p.isHost && <span className="text-yellow-400 text-xs shrink-0">★</span>}
              {isHost && !p.isHost && (
                <button
                  onClick={() => onKick?.(p.id)}
                  className="text-zinc-700 hover:text-red-400 transition-colors text-xs shrink-0 leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
