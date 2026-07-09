# Deployment Notes

Required public env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

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
- A photo task can open camera/file picker.
- Completed task state survives refresh.
