# 12-29 Agent User Web Auth Motion, Profile Layout & Chat Glass Polish

Version: v1.8.20

## Goals

This iteration refines three user-web areas without changing the sandbox-first architecture:

1. Auth modal presentation and motion.
2. Profile page information hierarchy.
3. Chat composer glass treatment.

## Auth Modal

The login/register modal now uses a lighter backdrop treatment:

- Background blur is reduced to 50% of the previous full blur strength.
- Card surface is fully opaque white for readability.
- Login/register switch uses a sliding active indicator.
- Switching modes triggers a card expansion/contraction transition.
- Register mode supports additional fields without visually jumping.

The card remains a local mock flow. Later production integration should replace the submit handler with Core `/auth/login` and `/auth/register` calls without changing the modal structure.

## Profile Page

Profile layout is simplified:

- `Personal profile` text is removed from the hero card.
- Hero card focuses on avatar, nickname, and token balance.
- General Settings is separated into its own card.
- Email remains disabled and visually communicates that email changes require a future verified flow.

## Chat Composer

The input composer is refined as a higher-transparency glass layer:

- Lower white opacity.
- Higher blur radius.
- Stronger saturation.
- Existing floating-layer behavior remains unchanged.

## Production Readiness

All changes remain compatible with future real API integration:

- Auth modal -> `/auth/*`
- Profile -> `/me`
- Wallet -> `/billing/*`
- Chat -> `/chat` and `/voice`
