# Content Guide

This project uses Supabase as the source of truth for the romantic journey. The frontend reads the main flow through `get_journey_scenes('20TEMMUZ')` and does not query `journey_scenes` directly.

For manual testing, use `/journey/preview` locally or `/journey/preview?token=20TEMMUZ2` in production after setting `JOURNEY_PREVIEW_TOKEN=20TEMMUZ2` or any other private value. This preview page uses `get_journey_preview_scenes` so all active scenes are visible and playable without changing the public `/journey` lock flow. The URL token is only the page gate; the RPC preview token is derived internally from the access code. Task completions in preview are local-only and reset on refresh.

For temporary desktop content editing, set `NEXT_PUBLIC_CONTENT_STUDIO_ENABLED=true` and open `/content-studio`. This route is not linked from the public journey. It uses the existing journey tables through `get_content_studio_data` and `content_studio_mutation` RPCs.

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
- RPC `get_content_studio_data(...)`
- RPC `content_studio_mutation(...)`
- Storage policies for `journey-content` uploads from Content Studio
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
- `reaction_duel`
- `couple_quiz`
- `penalty_picker`
- `progressive_penalty`
- `memory_match`
- `scratch_reveal`
- `choice` with `mode = couple_quiz` or `mode = penalty_picker`

The complete field reference and LLM-ready examples live in [`MINI_GAME_CONFIG_GUIDE.md`](./MINI_GAME_CONFIG_GUIDE.md).

`tap_sequence` example config:

```json
{
  "sequence": ["rose", "champagne", "deep"],
  "labels": ["Gül", "Işık", "Gece"],
  "successScore": 3
}
```

`memory_match` turns every configured pair into two shuffled cards and completes when all pairs are found.

```json
{
  "pairs": [
    { "id": "first-date", "label": "İlk Buluşma" },
    { "id": "our-song", "label": "Bizim Şarkımız" },
    { "id": "best-trip", "label": "En Güzel Yolculuk" },
    { "id": "favorite-photo", "label": "Sevdiğimiz Fotoğraf" }
  ],
  "backLabel": "Kartı aç",
  "matchedLabel": "Eşleşti",
  "completionText": "Bütün anılar eşleşti. Oyunu tamamladınız."
}
```

`scratch_reveal` provides a touch and pointer scratch surface plus an accessible one-tap reveal action.

```json
{
  "revealTitle": "Bu Gece İçin Bir Sürpriz",
  "revealText": "Bir sonraki durağımızı sen seçiyorsun. Bütün plan benden.",
  "imageUrl": null,
  "imageAlt": "Kazıma alanının altındaki sürpriz görsel",
  "coverLabel": "Sürprizi görmek için alanı kazı",
  "revealButtonLabel": "Tek Dokunuşla Aç",
  "completionText": "Sürpriz tamamen açıldı.",
  "successThreshold": 55
}
```

`reaction_duel` is a same-phone couple game. Put the phone between both players, wait for the light, and the first valid tap wins. Early tap is a foul.

```json
{
  "players": ["Sen", "Ben"],
  "readyText": "Telefon ortada. Parmaklar hazır, ama ışık yanmadan dokunmak yok.",
  "liveText": "Şimdi! İlk dokunan kazanır.",
  "waitMinMs": 1200,
  "waitMaxMs": 3200,
  "penalties": [
    "Kaybeden bir shot içer.",
    "Kaybeden bir yudum su içer ve kazanana güzel bir iltifat eder.",
    "Kaybeden bugünün en sevdiği anını anlatır."
  ],
  "alcoholNote": "Shot cezası sadece ikiniz de istiyorsanız; yerine su, iltifat veya küçük görev seçilebilir."
}
```

`couple_quiz` is a pass-and-play quiz for two people on the same phone.

```json
{
  "players": ["Sen", "Ben"],
  "questions": [
    {
      "prompt": "İlk birlikte planımız en çok neye benziyordu?",
      "options": ["Gece yürüyüşü", "Erken uyumak", "Sessiz kalmak"],
      "correctIndex": 0
    }
  ],
  "penalties": ["Kaybeden kazanana bir iltifat eder."]
}
```

`penalty_picker` is a two-card game. One player picks a card; the result decides who receives the configured penalty.

```json
{
  "players": ["Sen", "Ben"],
  "penalties": [
    "Kaybeden bir shot içer.",
    "Kaybeden kazananın seçeceği şarkının nakaratını söyler."
  ],
  "alcoholNote": "Alkol tamamen opsiyoneldir; config içinde alkolsüz alternatifler de tutulabilir."
}
```

`progressive_penalty` is a config-driven, multi-round two-player game. It must be attached to a `task` scene. The loss plan is balanced and created once; there is no skip or reroll.

```json
{
  "version": 1,
  "players": ["Sen", "Ben"],
  "rounds": [
    { "id": "round-1", "title": "İlk Tur", "kind": "penalty", "penalty": "Kaybeden güzel bir anısını anlatır." },
    { "id": "round-2", "title": "İkinci Tur", "kind": "penalty", "penalty": "Kaybeden bir iltifat eder." }
  ],
  "balanceMode": "strict",
  "allowReroll": false,
  "revealLabel": "Kartları Aç",
  "confirmLabel": "Cezayı Tamamladık",
  "completeLabel": "Oyunu Tamamla",
  "finalText": "Tüm turlar tamamlandı."
}
```

All fields above are required. `players` must contain exactly two distinct names, round IDs must be unique, `balanceMode` must be `strict`, and `allowReroll` must be `false`. Invalid configs are shown as errors and are never replaced with runtime defaults.

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
- `sat-task-01-morning-proof`: one `reaction_duel` same-phone mini game and `morning-proof-reward`

Locked scenes still hide `content_blocks`, `mini_game`, `task_response`, and reward content through `get_journey_scenes`.
