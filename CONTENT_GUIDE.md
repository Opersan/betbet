# Content Guide

This project uses Supabase as the source of truth for the romantic journey. The frontend reads the main flow through `get_journey_scenes('20TEMMUZ')` and does not query `journey_scenes` directly.

## Supabase Changes Applied

The following objects were created directly in Supabase through MCP:

- `public.journey_scene_content_blocks`
- `public.journey_task_responses`
- `public.journey_rewards`
- `public.journey_reward_claims`
- `public.journey_mini_games`
- Storage bucket `journey-content` for public image/video scene assets
- Storage bucket `journey-task-uploads` for private photo task uploads
- RPC `save_journey_task_response(...)`
- RPC `claim_journey_reward(...)`
- Extended RPC `get_journey_scenes(p_code text)` with optional JSON fields:
  - `content_blocks`
  - `task_response`
  - `rewards`
  - `mini_game`

RLS is enabled on new public tables. Content config tables have read policies for active rows. Task responses and reward claims are written through RPC only.

## Scene Content Blocks

Use `journey_scene_content_blocks` to attach multiple blocks to any scene without changing frontend code.

Supported `block_type` values:

- `text`
- `quote`
- `image`
- `video`
- `audio`
- `divider`
- `prompt`
- `reward`
- `game`
- `photo_task`

Common fields:

- `scene_slug`: target scene slug
- `title`: optional short label
- `body`: text content
- `media_url`: public URL for image/video/audio
- `media_path`: optional Storage path
- `metadata`: JSON config
- `sort_order`: lower numbers render first
- `is_active`: set false to hide without deleting

For public content files, upload to `journey-content` and use the public URL in `media_url`.

## Photo Tasks

To make a task scene behave as a photo task, add a `photo_task` content block:

```json
{
  "response_key": "primary",
  "capture": "camera_or_upload",
  "reward_key": "photo-memory"
}
```

When the user submits a photo:

1. The file uploads to `journey-task-uploads`.
2. `save_journey_task_response` stores the response.
3. The scene is marked completed.
4. If `reward_key` exists, the matching reward is unlocked.
5. On revisit, the app creates a signed URL and shows the saved photo again.

## Mini Games

Create a row in `journey_mini_games` for a task scene.

Current frontend support:

- `tap_sequence`

Example config:

```json
{
  "sequence": ["rose", "champagne", "deep"],
  "labels": ["Gül", "Işık", "Gece"],
  "successScore": 3
}
```

When completed, the frontend calls `save_journey_task_response` with `response_type = 'mini_game'` and opens the configured reward key.

## Rewards

Use `journey_rewards` to define reusable reveal content for a task:

- `scene_slug`
- `reward_key`
- `title`
- `subtitle`
- `body`
- `image_url`
- `video_url`
- `metadata`

Unlocked rewards are persisted in `journey_reward_claims` and returned through `get_journey_scenes`.

## Seed Examples

The following example rows were added:

- `fri-01-welcome`: one text content block
- `fri-task-01-heart-stamp`: one `photo_task` block and `photo-memory` reward
- `sat-task-01-morning-proof`: one `tap_sequence` mini game and `morning-proof-reward`

Locked scenes still hide `content_blocks`, `mini_game`, `task_response`, and reward content through `get_journey_scenes`.
