# ZeroRIR Firestore PWA

Realtime strength coaching app for two users (coach + client), built as a Next.js PWA with no custom backend APIs.

## Stack

- Next.js App Router
- TypeScript
- Firebase Firestore (realtime sync + offline persistence)
- PWA via `next-pwa`
- Mobile-first dark UI

## Architecture

- `src/app/**`: App Router pages and layouts
- `src/components/**`: UI components
- `src/lib/firebase.ts`: Firebase initialization
- `src/lib/firestoreRepo.ts`: Firestore data access and subscriptions
- `src/lib/workoutLogic.ts`: templates + 1RM/PR logic
- `src/lib/types.ts`: domain types

## Key Features

- Simple login for two fixed users (coach/client)
- Coach can create/edit programs, blocks, exercises, and assign a program
- Client sees assigned program updates in realtime
- Fast set logging (weight + reps) from mobile workout screen
- PR detection and 1RM estimation for Squat, Bench Press, Deadlift
- Workout history and progression chart
- Offline-first behavior via Firestore local cache + PWA app shell
- JSON export/import backup

## 1RM Formula

For Squat, Bench Press, and Deadlift:

$$
1RM = weight \times \left(1 + \frac{reps}{30}\right)
$$

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env.local
```

3. Fill Firebase values in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. Optional local PIN overrides:

```env
NEXT_PUBLIC_COACH_PIN=coach123
NEXT_PUBLIC_CLIENT_PIN=client123
```

5. Run app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Demo Login

- Coach: `coach@zerorir.app` + `coach123`
- Client: `client@zerorir.app` + `client123`

## Firebase Notes

- Firestore collections used:
  - `programs`
  - `workoutLogs`
  - `appMeta/assignment`
- Templates are auto-seeded on first launch if no programs exist.
- Firestore offline cache is enabled in the client.

## Deploy (Vercel)

1. Push repository to GitHub.
2. Import to Vercel.
3. Add all `NEXT_PUBLIC_FIREBASE_*` variables.
4. Deploy.
