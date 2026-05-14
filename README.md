# Hitster

A multiplayer music guessing game. Players listen to a song clip and guess the year it was released. Closest guess wins the round.

## How to play

1. One player creates a room and shares the code (or invite link) with friends.
2. The host presses play — everyone hears the same 30-second clip via Deezer.
3. Each player submits their year guess independently.
4. Once all players have guessed (or the host ends the round early), the correct year is revealed.
5. The player closest to the correct year scores 1 point (2 points for an exact match). Ties share the points.
6. After the configured number of rounds, the scoreboard shows the winner.

## Architecture

```
Browser (React)
     │  REST (fetch)          Pusher WebSocket
     ▼                              ▲
Next.js App Router  ──────────────►│
  API routes                  Pusher channels
     │                         (per room)
     ▼
Upstash Redis
 (room state)
```

### State store — `lib/server/store.ts`

All game state lives in a single Redis key per room (`room:<CODE>`), stored as JSON with a 24-hour TTL. The `RoomState` object contains:

| Field | Description |
|---|---|
| `phase` | `lobby` → `loading` → `listening` → `revealing` → `gameover` |
| `players` | Array of players with names and scores |
| `currentSong` | Title, artist, year, and Deezer preview URL |
| `guesses` | Map of `playerId → year` |
| `submittedIds` | Players who have submitted this round |
| `roundResults` | Computed distances and winners for the reveal screen |
| `deck` | Shuffled array of remaining song seeds |

Guess submission is atomic — it uses a Redis Lua script so two players submitting at the exact same millisecond cannot overwrite each other's guess.

### Real-time sync — Pusher

Two event types are sent on the channel `room-<CODE>`:

- **`state`** — full room state after any mutation (join, guess, reveal, next round, etc.)
- **`play`** — play/pause signal from the host, sent without persisting to Redis so latency is minimal

The client hook `lib/use-room.ts` subscribes to both events and keeps a local `ClientRoom` state (which omits the deck to avoid leaking upcoming songs).

### Song pipeline — `app/api/room/start/route.ts`

Songs are sourced from a static list of ~200 seeds in `lib/songs.ts` (title, artist, year, Spotify ID). On each round start:

1. The deck is popped from Redis (seeds shuffled at room creation).
2. The Deezer public search API is queried for a 30-second preview URL.
3. Seeds without a preview are skipped and the next one is tried.
4. The preview URL (not the Spotify ID) is what gets stored and broadcast.

### Phase flow

```
lobby      → (host clicks Start)   → loading
loading    → (preview fetched)     → listening
listening  → (all guessed / host ends round) → revealing
revealing  → (host clicks Next)    → loading  (next round)
                                   → gameover (last round)
gameover   → (host restarts)       → lobby
```

### Client routing — `app/page.tsx`

There is a single page component that renders a different screen component based on `room.phase`. Player identity is a random ID persisted in `sessionStorage`. The host's `playerId` doubles as the `hostId`.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Upstash Redis** — serverless Redis for room state
- **Pusher** — WebSocket channels for real-time updates
- **Deezer API** — free public API for 30-second song previews
- **Tailwind CSS v4**
- Deployed on **Vercel**

## Local development

Copy `.env.local.example` (or set these variables manually):

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

```bash
npm install
npm run dev
```
