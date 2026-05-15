'use client';

import { useState, useRef } from 'react';
import { Music2, Users, Share2, Check } from 'lucide-react';
import { Genre } from '@/lib/songs';
import Spinner from './spinner';
import { ClientRoom } from '@/lib/use-room';

type Props = {
  onCreate: (hostName: string, totalRounds: number, genre: Genre) => void;
  onJoin: (code: string, playerName: string) => void;
  room?: ClientRoom;
  isHost?: boolean;
  onStart?: () => Promise<void>;
  onKick?: (targetId: string) => Promise<void>;
  inviteCode?: string | null;
};

export default function LobbyScreen({ onCreate, onJoin, room, isHost, onStart, onKick, inviteCode }: Props) {
  const [tab, setTab] = useState<'create' | 'join'>(inviteCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode ? inviteCode.toUpperCase().split('') : ['', '', '', '']);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const wrap = (fn: () => void | Promise<void>) => async () => {
    if (loading) return;
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };
  const [rounds, setRounds] = useState(10);
  const [genre, setGenre] = useState<Genre>('international');
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const codeStr = code.join('');

  const shareInvite = (roomCode: string) => {
    const url = `${window.location.origin}${window.location.pathname}?code=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (room) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 gap-10" dir="rtl">
        <div className="text-center space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-widest">קוד חדר</p>
          <div className="flex gap-3 justify-center mt-2" dir="ltr">
            {room.roomCode.split('').map((ch, i) => (
              <div key={i} className="w-14 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl font-black text-yellow-400 tracking-normal">
                {ch}
              </div>
            ))}
          </div>
          <button
            onClick={() => shareInvite(room.roomCode)}
            className="mt-3 flex items-center gap-2 mx-auto text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'הקישור הועתק!' : 'שתף קישור הצטרפות'}
          </button>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Users className="w-4 h-4" />
            <span>{room.players.length} שחקנים</span>
          </div>
          {room.players.map((p) => (
            <div key={p.id} className="bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 text-sm font-bold shrink-0">
                {p.name[0]}
              </div>
              <span className="flex-1 font-medium">{p.name}</span>
              {p.isHost && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">מארח</span>}
              {isHost && !p.isHost && (
                <button
                  onClick={() => onKick?.(p.id)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-0.5 rounded-full hover:bg-red-400/10"
                >
                  הסר
                </button>
              )}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={wrap(() => onStart?.())}
            disabled={loading}
            className="w-full max-w-xs py-4 rounded-2xl bg-yellow-400 text-zinc-950 font-bold text-lg hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-60"
          >
            {loading ? <Spinner /> : 'התחל משחק'}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
            ממתין למארח שיתחיל...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 gap-10" dir="rtl">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto">
          <Music2 className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="text-3xl font-black text-white">ניחושים מוזיקליים</h1>
        <p className="text-zinc-500 text-sm">נחשו את שנת השיר</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex rounded-2xl overflow-hidden bg-zinc-900 p-1 gap-1">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === 'create' ? 'bg-yellow-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            צור חדר
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === 'join' ? 'bg-yellow-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            הצטרף
          </button>
        </div>

        {tab === 'create' ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="השם שלך"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-right placeholder-zinc-600 focus:outline-none focus:border-yellow-400/60 transition-colors"
            />
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
              <span className="text-zinc-500 text-sm shrink-0">מספר סיבובים</span>
              <input
                type="number"
                min={1}
                max={30}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="flex-1 bg-transparent text-white text-left focus:outline-none w-12"
              />
            </div>
            <div className="flex rounded-2xl overflow-hidden bg-zinc-900 p-1 gap-1">
              <button
                onClick={() => setGenre('international')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${genre === 'international' ? 'bg-yellow-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                🌍 בינלאומי
              </button>
              <button
                onClick={() => setGenre('israeli')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${genre === 'israeli' ? 'bg-yellow-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                🇮🇱 ישראלי
              </button>
            </div>
            <button
              onClick={wrap(() => { if (name.trim()) return onCreate(name.trim(), rounds, genre); })}
              disabled={!name.trim() || loading}
              className="w-full py-4 rounded-2xl bg-yellow-400 text-zinc-950 font-bold text-base hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-yellow-400/20"
            >
              {loading ? <Spinner /> : 'צור חדר'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="השם שלך"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-right placeholder-zinc-600 focus:outline-none focus:border-yellow-400/60 transition-colors"
            />
            <div className="flex gap-2 justify-center" dir="ltr">
              {[0,1,2,3].map((i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={code[i]}
                  dir="ltr"
                  onChange={(e) => {
                    const ch = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
                    const next = [...code];
                    next[i] = ch;
                    setCode(next);
                    if (ch && i < 3) codeRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !code[i] && i > 0) {
                      codeRefs.current[i - 1]?.focus();
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`w-14 h-16 rounded-2xl border text-center text-2xl font-black uppercase bg-zinc-900 focus:outline-none transition-colors caret-transparent ${
                    code[i] ? 'border-yellow-400/40 text-yellow-400' : 'border-zinc-800 text-zinc-700 focus:border-yellow-400/40'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={wrap(() => { if (name.trim() && codeStr.length === 4) return onJoin(codeStr, name.trim()); })}
              disabled={!name.trim() || codeStr.length !== 4 || loading}
              className="w-full py-4 rounded-2xl bg-yellow-400 text-zinc-950 font-bold text-base hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-yellow-400/20"
            >
              {loading ? <Spinner /> : 'הצטרף'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
