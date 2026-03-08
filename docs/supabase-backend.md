# NameKura Supabase Backend Design

## Goal

This backend is designed for the current frontend shape:

- fullscreen honeycomb name canvas
- copy-to-clipboard interaction
- lightweight upvote/downvote
- minimal name submission
- anonymous-first interaction with optional auth later

The design keeps the first version narrow. It does not add comments, follower graphs, moderation queues, or full CMS behavior yet.

## Stack Boundary

Use Supabase for:

- Postgres
- Row Level Security
- SQL functions / RPC
- Realtime only if later needed for live vote updates
- Storage only if avatars are later required

The frontend should remain a thin client. Business rules that affect trust should live in SQL or RLS, not only in React.

Auth is no longer required for the first usable version. Anonymous identity is represented by a durable browser `session_id`.

## Core Entities

### `profiles`

Maps `auth.users` to a public app profile.

Fields:

- `id`
- `handle`
- `avatar_url`
- timestamps

Why it exists:

- avoids reading directly from `auth.users`
- gives a stable public identity for future social features

### `names`

Main name pool.

Fields:

- `surname`
- `given_name`
- generated `full_name`
- `source`
- `submitted_by`
- `submitted_session_id`
- `status`
- `description`
- `tags[]`
- denormalized counters:
  - `copy_count`
  - `upvotes_count`
  - `downvotes_count`
  - `score`

Why denormalized counters:

- the canvas reads many cards at once
- list rendering should not aggregate votes client-side
- sorting by score/copies must be cheap

### `name_votes`

One row per actor per name.

Fields:

- `name_id`
- `user_id`
- `session_id`
- `value` in `(-1, 1)`

Why separate table:

- supports idempotent voting for both signed-in and anonymous users
- makes per-user state easy to query
- lets the name table keep only counters

### `name_bookmarks`

Optional persistence for a later logged-in mode. Not needed for the current anonymous-first product.

### `copy_events`

Tracks copy action for analytics and popularity.

Supports:

- authenticated user copy
- anonymous session copy

Why keep events instead of only incrementing a counter:

- auditability
- later analytics by day/session/user
- can still project back into `names.copy_count`

## Data Rules

### Name constraints

- surname length 1 to 2 for v1
- given name length 1 to 3
- full name unique globally

This keeps the first version narrow while still allowing common compound surnames like `欧阳`.

### Status model

Current statuses:

- `draft`
- `published`
- `archived`

Recommended first behavior:

- seeded names => `published`
- user submitted names => either `published` directly or `draft` if manual review is added later

## Access Model

### Anonymous users

Can:

- read published names
- submit names with `session_id`
- vote with `session_id`
- record copy events with `session_id`

Cannot:

- manage profile data
- use bookmark persistence

### Authenticated users

Can:

- do everything anonymous users can
- optionally persist ownership on `user_id`
- update their own profile

## RLS Design

Important principle:

- feed data is public
- anonymous writes must still be bound to a durable `session_id`
- authenticated writes should prefer `auth.uid()` when present

Implemented policies in `schema.sql` cover:

- public profile read
- public published-name read
- self-only profile update
- anonymous or authenticated name creation
- anonymous or authenticated voting
- bookmark CRUD reserved for future logged-in mode
- copy event insert with either authenticated user or anonymous `session_id`

## RPC / SQL Functions

### `vote_name(target_name_id, target_value, target_session_id)`

Purpose:

- upsert a vote
- refresh counters
- return the updated `names` row

Why RPC instead of direct table write from client:

- removes client-side counter logic
- keeps update path idempotent
- gives a single trusted mutation API
- lets anonymous users vote without exposing conflict logic to the client

### `record_copy(target_name_id, target_session_id)`

Purpose:

- log copy action
- refresh `copy_count`

Frontend should call this after successful clipboard write.

## Read Models

### `name_feed` view

Feed-safe projection for the canvas.

Returns only published rows plus:

- submitter handle
- counters
- display fields

This is the preferred source for the homepage instead of reading raw tables.

## Recommended Frontend Query Shape

### Initial canvas load

Read from `name_feed`:

```ts
supabase
  .from("name_feed")
  .select("*")
  .order("score", { ascending: false })
  .order("created_at", { ascending: false })
  .range(0, 199)
```

### Search / filter

For the current UI, search can stay simple:

- `full_name ilike`
- `tags cs {tag}`

If later you want stronger search quality, add:

- `tsvector` search column
- trigram index on `full_name`

### Vote

```ts
supabase.rpc("vote_name", {
  target_name_id: id,
  target_value: 1,
  target_session_id: sessionId,
})
```

### Record copy

```ts
supabase.rpc("record_copy", {
  target_name_id: id,
  target_session_id: sessionId,
})
```

## Operational Notes

### Session ID for anonymous copy tracking

Generate once in browser and persist in `localStorage`, for example:

- key: `namekura_session_id`
- value: random UUID

This `session_id` should be used for:

- anonymous name submission
- anonymous voting
- anonymous copy tracking

### Moderation

Not implemented in schema beyond `status`.

When needed, add:

- `reviewed_by`
- `reviewed_at`
- `rejection_reason`

Do not overload `description` for moderation notes.

### Rate limiting

Supabase RLS is not a rate limiter.

For abuse-sensitive endpoints, recommended escalation path:

1. add client debounce
2. add SQL guardrails where possible
3. add Edge Functions for IP/session-aware throttling

### Realtime

Do not turn on Realtime by default for all tables.

If you need live updates later, start only with:

- `names`

Even then, consider polling or manual refresh first. The product does not require collaborative editing.

## Migration Order

Apply in this order:

1. `supabase/schema.sql`
2. seed initial names
3. generate TS types from Supabase
4. add browser `session_id` utility
5. replace frontend mock data with `name_feed`
6. replace local vote/copy simulation with RPC calls

## Suggested Next Integration Step

For this repo, the most practical next step is:

1. add typed API wrappers for `name_feed`, `vote_name`, `record_copy`
2. pass durable `session_id` from the browser
3. switch vote/copy from local state to RPC
