'use client';

import { Music2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
      <Music2 className="w-12 h-12 text-yellow-400 animate-bounce" />
      <p className="text-zinc-400">טוען שיר...</p>
    </div>
  );
}
