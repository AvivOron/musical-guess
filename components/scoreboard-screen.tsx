'use client';

import { useState } from 'react';
import { Trophy, RotateCcw, Crown } from 'lucide-react';
import Spinner from './spinner';
import { ServerPlayer } from '@/lib/server/store';

type Props = {
  players: ServerPlayer[];
  onRestart?: () => Promise<void>;
};

export default function ScoreboardScreen({ players, onRestart }: Props) {
  const [loading, setLoading] = useState(false);

  const handleRestart = async () => {
    if (!onRestart || loading) return;
    setLoading(true);
    try { await onRestart(); } finally { setLoading(false); }
  };
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const medals = ['🥇', '🥈', '🥉'];
  const uniqueScores = [...new Set(sorted.map((p) => p.score))];
  const ranks = sorted.map((player) => uniqueScores.indexOf(player.score));

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-sm space-y-8">

        {/* Winner banner */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center">
              <Crown className="w-9 h-9 text-yellow-400" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 text-sm">{ranks.filter((r) => r === 0).length > 1 ? 'הזוכים הם' : 'הזוכה הוא'}</p>
            <h2 className="text-3xl font-black mt-1">{sorted.filter((_, i) => ranks[i] === 0).map((p) => p.name).join(' ו־')}</h2>
            <p className="text-yellow-400 font-bold text-lg mt-1">{winner.score} נקודות</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={`rounded-2xl border p-4 flex items-center gap-4 transition-colors ${
                ranks[i] === 0 ? 'bg-yellow-400/8 border-yellow-400/30' : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              <span className="text-2xl w-8 text-center shrink-0">
                {medals[ranks[i]] ?? <span className="text-zinc-600 font-bold text-lg">{ranks[i] + 1}</span>}
              </span>
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0">
                {player.name[0]}
              </div>
              <span className="flex-1 font-semibold">{player.name}</span>
              <div className="text-right">
                <span className="text-xl font-black text-yellow-400 tabular-nums">{player.score}</span>
                <p className="text-zinc-600 text-xs">נק׳</p>
              </div>
            </div>
          ))}
        </div>

        {onRestart && (
          <button
            onClick={handleRestart}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-bold text-base hover:border-yellow-400/40 hover:text-yellow-400 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Spinner /> : <><RotateCcw className="w-5 h-5" />משחק חדש</>}
          </button>
        )}
      </div>
    </div>
  );
}
