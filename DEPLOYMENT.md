# Deployment Notes

Required public env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional private env vars:

- `JOURNEY_PREVIEW_TOKEN`: required in production for `/journey/preview?token=20TEMMUZ-PREVIEW`, which opens the playable preview flow for locked scenes. The value must match the preview RPC rule: access code + `-PREVIEW`.

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
- `/journey/preview?token=20TEMMUZ-PREVIEW` shows all scenes unlocked and lets you test mini games locally without changing public journey progress.
- A photo task can open camera/file picker.
- Completed task state survives refresh.
