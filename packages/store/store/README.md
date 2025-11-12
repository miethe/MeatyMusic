# @meaty/store

Centralized Zustand store for onboarding flow and user preferences.

## Installation

```bash
pnpm add @meaty/store
```

## Usage

```ts
import { useOnboardingState, usePreferences, useTheme } from '@meaty/store';

const onboarding = useOnboardingState();
const theme = useTheme();
```

## Actions

```ts
const setStep = useOnboardingState((s) => s.setStep);
const setTheme = usePreferences((s) => s.setTheme);
```

State changes persist to `localStorage` and sync to the API with retry and
exponential backoff. Middleware is debounced to reduce network and storage
load.
Enable Zustand devtools in development for observability.

## Store Slices

- `useOnboardingState` – Progress through the onboarding flow
- `usePreferences` – User locale and feature preferences
- `useTheme` – Active UI theme and system settings
- **onboarding** – `tourActive`, `currentStep`, `completedSteps`, `dismissed`
- **preferences** – `theme`, `density`

## Troubleshooting

- **State not persisting** – check that `localStorage` is available and not blocked.
- **API sync failures** – ensure the network is reachable; retries handle temporary errors.
- **Type errors** – run `pnpm typecheck` to validate slice typings.
- **Hydration mismatch** – avoid reading the store during server-side rendering.
- **Excess re-renders** – use selector functions to subscribe to minimal state.
