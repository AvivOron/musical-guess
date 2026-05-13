'use client';

import { Trophy, ArrowLeft, Music2 } from 'lucide-react';
import { RoundResult, ServerPlayer } from '@/lib/server/store';

type Props = {
  song: { title: string; artist: string; year: number } | null;
  results: RoundResult[];
  players: ServerPlayer[];
  round: number;
  totalRounds: number;
  isHost: boolean;
  onNext: () => void;
};

export default function RevealScreen({ song, results, players, round, totalRounds, isHost, onNext }: Props) {
  const sorted = [...results].sort((a, b) => a.distance - b.distance);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-6 gap-6" dir="rtl">
      <div className="w-full max-w-sm space-y-5 pt-4">

        {/* Round indicator */}
        <div className="flex items-center justify-between text-zinc-600 text-xs">
          <span>תוצאות הסיבוב</span>
          <span>{round} / {totalRounds}</span>
        </div>

        {/* Song card */}
        {song && (
          <div className="rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 p-5 flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-yellow-400/10 border border-yellow-400/20 shrink-0 flex items-center justify-center">
              <Music2 className="w-7 h-7 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">{song.title}</p>
              <p className="text-zinc-400 text-sm truncate">{song.artist}</p>
              <p className="text-yellow-400 font-black text-3xl mt-0.5 tabular-nums">{song.year}</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-2">
          {sorted.map((result, i) => {
            const player = players.find((p) => p.id === result.playerId);
            const isWinner = result.won;
            return (
              <div
                key={result.playerId}
                className={`rounded-2xl border p-4 flex items-center gap-3 transition-colors ${
                  isWinner
                    ? 'bg-yellow-400/8 border-yellow-400/30'
                    : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                <span className={`text-lg font-black w-6 text-center shrink-0 ${isWinner ? 'text-yellow-400' : 'text-zinc-600'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{result.playerName}</span>
                    {isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    ניחש <span className="text-zinc-300 font-medium">{result.guess}</span>
                    {' · '}
                    <span className={result.distance === 0 ? 'text-green-400 font-semibold' : 'text-zinc-400'}>
                      {result.distance === 0 ? 'מדויק!' : `${result.distance} שנים הפרש`}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-yellow-400 tabular-nums">{player?.score ?? 0}</span>
                  <p className="text-zinc-600 text-xs">נק׳</p>
                </div>
              </div>
            );
          })}
        </div>

        {isHost ? (
          <button
            onClick={onNext}
            className="w-full py-4 rounded-2xl bg-yellow-400 text-zinc-950 font-bold text-base hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
          >
            {round >= totalRounds ? 'לוח התוצאות' : 'סיבוב הבא'}
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" />
            ממתין למארח...
          </div>
        )}
      </div>
    </div>
  );
}
