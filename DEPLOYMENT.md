# Deployment Notes

Required public env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional private env vars:

- `JOURNEY_PREVIEW_TOKEN`: required in production for `/journey/preview?token=20TEMMUZ2`, which opens the playable preview flow for locked scenes. The value is only the public page gate token and can be any private value; the RPC preview token is derived internally from the access code.
- `NEXT_PUBLIC_CONTENT_STUDIO_ENABLED`: set to `true` only while using `/content-studio` for temporary desktop content editing. Keep `false` when not actively preparing content.

Supabase objects required by the current frontend have been applied to the connected project:

- RPC: `get_journey_scenes`, `initialize_journey_progress`, `complete_journey_scene`, `save_journey_task_response`, `claim_journey_reward`
- Storage buckets: `journey-content`, `journey-task-uploads`

Before a production redeploy, run:

```bash
npm run lint
npm run build
```

After deploy, verify on mobile:

- `/unlock` accepts `20TEMMUZ`.
- `/journey` loads from RPC.
- `/journey/preview?token=20TEMMUZ2` shows all scenes unlocked and lets you test mini games locally without changing public journey progress.
- `/content-studio` returns 404 unless `NEXT_PUBLIC_CONTENT_STUDIO_ENABLED=true`.
- A photo task can open camera/file picker.
- Completed task state survives refresh.
