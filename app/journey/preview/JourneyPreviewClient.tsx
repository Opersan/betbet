"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye, Gamepad2, Gift, Lock, Sparkles, Unlock } from "lucide-react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { PremiumCard } from "@/components/ui/PremiumCard";

type PreviewScene = {
  id: string;
  slug: string;
  type: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  date_label: string | null;
  sort_order: number;
  background_variant: string | null;
  is_locked: boolean;
  unlock_condition: string | null;
};

type PreviewBlock = {
  id: string;
  scene_slug: string;
  block_type: string;
  title: string | null;
  body: string | null;
  media_url: string | null;
  media_path: string | null;
  alt_text: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
};

type PreviewMiniGame = {
  id: string;
  scene_slug: string;
  game_key: string;
  game_type: string;
  title: string;
  instructions: string | null;
  config: Record<string, unknown>;
  reward_key: string | null;
  sort_order: number;
};

type PreviewReward = {
  id: string;
  scene_slug: string;
  reward_key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
};

type RpcSceneStatus = {
  slug: string;
  is_locked: boolean;
  progress_is_unlocked: boolean;
  progress_is_completed: boolean;
};

type SceneBundle = {
  scene: PreviewScene;
  blocks: PreviewBlock[];
  games: PreviewMiniGame[];
  rewards: PreviewReward[];
  status?: RpcSceneStatus;
};

type PreviewState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; bundles: SceneBundle[] };

export function JourneyPreviewClient({
  supabaseUrl,
  supabaseKey,
  code,
}: {
  supabaseUrl: string | null;
  supabaseKey: string | null;
  code: string;
}) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      if (!supabaseUrl || !supabaseKey) {
        setState({
          status: "error",
          error: "Supabase env eksik: NEXT_PUBLIC_SUPABASE_URL ve publishable key gerekli.",
        });
        return;
      }

      const result = await getPreviewBundles({ supabaseUrl, supabaseKey, code });
      if (!isMounted) return;

      setState(result.ok ? { status: "ready", bundles: result.bundles } : { status: "error", error: result.error });
    }

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [code, supabaseKey, supabaseUrl]);

  const summary = useMemo(() => {
    if (state.status !== "ready") {
      return "Kilitli sahne içerikleri yükleniyor.";
    }

    const lockedCount = state.bundles.filter((item) => item.scene.is_locked || item.status?.is_locked).length;
    const gameCount = state.bundles.reduce((total, item) => total + item.games.length, 0);
    return `${state.bundles.length} sahne, ${lockedCount} kilitli, ${gameCount} mini game`;
  }, [state]);

  return (
    <MobileSceneLayout title="Journey Preview" subtitle={summary} backgroundVariant="deep">
      <div className="w-full space-y-3 pb-4">
        <PremiumCard className="w-full p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <Eye size={21} strokeWidth={1.7} />
          </div>
          <p className="text-xl font-semibold leading-tight text-[#fffaf2]">Manuel içerik kontrolü</p>
          <p className="mt-3 text-sm leading-6 text-[#fffaf2]/62">
            Bu sayfa normal journey kilitlerini değiştirmez; sadece edit/test için aktif Supabase içeriklerini
            listeler. Ana `/journey` akışı aynı kalır.
          </p>
        </PremiumCard>

        {state.status === "loading" ? (
          <PremiumCard className="w-full p-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-[#d9a7a0]" />
            </div>
            <p className="mt-4 text-sm text-[#fffaf2]/58">Sahne içerikleri okunuyor.</p>
          </PremiumCard>
        ) : null}

        {state.status === "error" ? (
          <PremiumCard className="w-full p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
              <Lock size={21} strokeWidth={1.7} />
            </div>
            <p className="text-lg leading-8 text-[#fffaf2]/78">{state.error}</p>
          </PremiumCard>
        ) : null}

        {state.status === "ready" ? state.bundles.map((bundle) => <PreviewSceneCard key={bundle.scene.slug} bundle={bundle} />) : null}
      </div>
    </MobileSceneLayout>
  );
}

function PreviewSceneCard({ bundle }: { bundle: SceneBundle }) {
  const { scene, status } = bundle;
  const isLocked = status?.is_locked ?? scene.is_locked;
  const isCompleted = Boolean(status?.progress_is_completed);

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/68">
            {scene.date_label ?? scene.type} · #{scene.sort_order}
          </p>
          <h2 className="mt-2 break-words text-xl font-semibold leading-tight text-[#fffaf2]">{scene.title}</h2>
          <p className="mt-2 break-all text-xs text-[#fffaf2]/42">{scene.slug}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.07] px-3 py-1 text-xs font-medium text-[#fffaf2]/75">
          {isLocked ? <Lock size={14} strokeWidth={1.8} /> : <Unlock size={14} strokeWidth={1.8} />}
          {isLocked ? "Kilitli" : isCompleted ? "Tamamlandı" : "Açık"}
        </span>
      </div>

      {scene.subtitle ? <p className="text-sm leading-6 text-[#fffaf2]/62">{scene.subtitle}</p> : null}
      {scene.content ? <p className="mt-4 text-base leading-7 text-[#fffaf2]/78">{scene.content}</p> : null}
      {scene.unlock_condition ? (
        <p className="mt-4 rounded-[8px] border border-[#f4dcc0]/14 bg-[#f4dcc0]/8 p-3 text-sm leading-6 text-[#f4dcc0]/76">
          {scene.unlock_condition}
        </p>
      ) : null}

      <MediaLinks imageUrl={scene.image_url} videoUrl={scene.video_url} />

      {bundle.blocks.length > 0 ? (
        <PreviewSection title="Content Blocks" icon={<Sparkles size={16} strokeWidth={1.7} />}>
          {bundle.blocks.map((block) => (
            <div key={block.id} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f4dcc0]/68">
                {block.block_type}
              </p>
              {block.title ? <p className="mt-2 text-sm font-semibold text-[#fffaf2]">{block.title}</p> : null}
              {block.body ? <p className="mt-2 text-sm leading-6 text-[#fffaf2]/64">{block.body}</p> : null}
              <MediaLinks imageUrl={block.media_url} videoUrl={null} />
              <JsonPreview value={block.metadata} />
            </div>
          ))}
        </PreviewSection>
      ) : null}

      {bundle.games.length > 0 ? (
        <PreviewSection title="Mini Games" icon={<Gamepad2 size={16} strokeWidth={1.7} />}>
          {bundle.games.map((game) => (
            <div key={game.id} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f4dcc0]/68">
                {game.game_type} · {game.game_key}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#fffaf2]">{game.title}</p>
              {game.instructions ? <p className="mt-2 text-sm leading-6 text-[#fffaf2]/64">{game.instructions}</p> : null}
              {game.reward_key ? <p className="mt-2 text-xs text-[#f4dcc0]/72">Reward: {game.reward_key}</p> : null}
              <JsonPreview value={game.config} />
            </div>
          ))}
        </PreviewSection>
      ) : null}

      {bundle.rewards.length > 0 ? (
        <PreviewSection title="Rewards" icon={<Gift size={16} strokeWidth={1.7} />}>
          {bundle.rewards.map((reward) => (
            <div key={reward.id} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f4dcc0]/68">
                {reward.reward_key}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#fffaf2]">{reward.title}</p>
              {reward.subtitle ? <p className="mt-1 text-sm text-[#fffaf2]/58">{reward.subtitle}</p> : null}
              {reward.body ? <p className="mt-2 text-sm leading-6 text-[#fffaf2]/64">{reward.body}</p> : null}
              <MediaLinks imageUrl={reward.image_url} videoUrl={reward.video_url} />
              <JsonPreview value={reward.metadata} />
            </div>
          ))}
        </PreviewSection>
      ) : null}
    </PremiumCard>
  );
}

function PreviewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#f4dcc0]/78">
        {icon}
        {title}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function MediaLinks({ imageUrl, videoUrl }: { imageUrl: string | null; videoUrl: string | null }) {
  if (!imageUrl && !videoUrl) return null;

  return (
    <div className="mt-3 grid gap-2 text-xs leading-5 text-[#fffaf2]/54">
      {imageUrl ? (
        <a className="break-all text-[#f4dcc0]/78 underline decoration-[#f4dcc0]/30" href={imageUrl}>
          Image: {imageUrl}
        </a>
      ) : null}
      {videoUrl ? (
        <a className="break-all text-[#f4dcc0]/78 underline decoration-[#f4dcc0]/30" href={videoUrl}>
          Video: {videoUrl}
        </a>
      ) : null}
    </div>
  );
}

function JsonPreview({ value }: { value: Record<string, unknown> }) {
  if (Object.keys(value).length === 0) return null;

  return (
    <pre className="mt-3 max-h-56 overflow-auto rounded-[8px] border border-white/10 bg-black/20 p-3 text-[0.7rem] leading-5 text-[#fffaf2]/58 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

async function getPreviewBundles({
  supabaseUrl,
  supabaseKey,
  code,
}: {
  supabaseUrl: string;
  supabaseKey: string;
  code: string;
}): Promise<{ ok: true; bundles: SceneBundle[] } | { ok: false; error: string }> {
  const [scenesResult, blocksResult, gamesResult, rewardsResult, statusResult] = await Promise.all([
    supabaseRest<PreviewScene[]>(
      supabaseUrl,
      supabaseKey,
      "/journey_scenes?select=id,slug,type,title,subtitle,content,image_url,video_url,date_label,sort_order,background_variant,is_locked,unlock_condition&is_active=eq.true&order=sort_order.asc",
    ),
    supabaseRest<PreviewBlock[]>(supabaseUrl, supabaseKey, "/journey_scene_content_blocks?select=*&is_active=eq.true&order=sort_order.asc"),
    supabaseRest<PreviewMiniGame[]>(supabaseUrl, supabaseKey, "/journey_mini_games?select=*&is_active=eq.true&order=sort_order.asc"),
    supabaseRest<PreviewReward[]>(supabaseUrl, supabaseKey, "/journey_rewards?select=*&is_active=eq.true&order=sort_order.asc"),
    supabaseRpc<RpcSceneStatus[]>(supabaseUrl, supabaseKey, "/get_journey_scenes", { p_code: code }),
  ]);

  const firstError = [scenesResult, blocksResult, gamesResult, rewardsResult, statusResult].find((item) => !item.ok);
  if (firstError && !firstError.ok) {
    return { ok: false, error: firstError.error };
  }

  const scenes = scenesResult.ok ? scenesResult.data : [];
  const blocks = groupByScene(blocksResult.ok ? blocksResult.data : []);
  const games = groupByScene(gamesResult.ok ? gamesResult.data : []);
  const rewards = groupByScene(rewardsResult.ok ? rewardsResult.data : []);
  const statusBySlug = new Map((statusResult.ok ? statusResult.data : []).map((item) => [item.slug, item]));

  return {
    ok: true,
    bundles: scenes.map((scene) => ({
      scene,
      blocks: blocks.get(scene.slug) ?? [],
      games: games.get(scene.slug) ?? [],
      rewards: rewards.get(scene.slug) ?? [],
      status: statusBySlug.get(scene.slug),
    })),
  };
}

async function supabaseRest<T>(
  supabaseUrl: string,
  supabaseKey: string,
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  return supabaseFetch<T>(supabaseUrl, supabaseKey, path, { method: "GET" });
}

async function supabaseRpc<T>(
  supabaseUrl: string,
  supabaseKey: string,
  functionPath: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  return supabaseFetch<T>(supabaseUrl, supabaseKey, `/rpc${functionPath}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function supabaseFetch<T>(
  supabaseUrl: string,
  supabaseKey: string,
  path: string,
  init: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: text || `Supabase REST hata kodu: ${response.status}` };
  }

  return { ok: true, data: (await response.json()) as T };
}

function groupByScene<T extends { scene_slug: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const next = grouped.get(item.scene_slug) ?? [];
    next.push(item);
    grouped.set(item.scene_slug, next);
  }

  return grouped;
}
