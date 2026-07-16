"use client";

import {
  AlertTriangle,
  Clipboard,
  Copy,
  Download,
  Eye,
  Lock,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { ChapterRevealScene } from "@/components/scene/ChapterRevealScene";
import { JourneySceneRenderer, type CompleteMiniGameParams } from "@/components/scene/JourneySceneRenderer";
import { buildChatGptPrompt, type ExportScope } from "@/lib/content-studio/chatgpt-export";
import { buildImportChanges, parseChatGptJson, type ImportChange } from "@/lib/content-studio/chatgpt-import";
import { getContentReadinessIssues } from "@/lib/content-studio/readiness";
import {
  CONTENT_STUDIO_ACCESS_CODE,
  CONTENT_STUDIO_TIMEZONE,
  getTaskUploadSignedUrl,
  loadContentStudioData,
  mutateContentStudio,
  removeTaskUploadFiles,
} from "@/lib/content-studio/scenes";
import type {
  BackgroundVariant,
  ContentStudioData,
  JsonRecord,
  SceneType,
  StudioContentBlock,
  StudioDependency,
  StudioMediaRequirement,
  StudioMiniGame,
  StudioProgress,
  StudioReward,
  StudioRewardClaim,
  StudioScene,
  StudioTaskResponse,
  StudioUnlockRule,
  StudioUnlockSchedule,
} from "@/lib/content-studio/types";
import type { JourneyContentBlock, JourneyMiniGame, JourneyReward, JourneyScene, JourneyTaskResponse } from "@/lib/journey/types";
import { getChapterNumber } from "@/lib/journey/chapters";
import { createDefaultProgressivePenaltyConfig, validateProgressivePenaltyConfig } from "@/lib/journey/progressive-penalty";
import { cn } from "@/lib/utils";
import { JsonConfigEditor } from "./JsonConfigEditor";
import { MediaUploadField } from "./MediaUploadField";
import { ProgressivePenaltyConfigEditor } from "./ProgressivePenaltyConfigEditor";

type TabKey = "scene" | "blocks" | "unlock" | "game" | "reward" | "progress" | "json" | "timeline";
type PreviewMode = "normal" | "locked" | "unlocked" | "task_pending" | "task_done";
type PreviewSizeMode = "fit" | "actual";

const studioPreviewWidth = 390;
const studioPreviewHeight = 844;

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "scene", label: "Sahne" },
  { key: "blocks", label: "İçerik Blokları" },
  { key: "unlock", label: "Kilit ve Zaman" },
  { key: "game", label: "Mini Oyun" },
  { key: "reward", label: "Ödül" },
  { key: "progress", label: "Progress ve Sonuçlar" },
  { key: "json", label: "JSON / ChatGPT" },
  { key: "timeline", label: "Timeline" },
];

const sceneTypes: SceneType[] = ["welcome", "story", "task", "memory", "locked", "final", "chapter"];
const backgroundVariants: BackgroundVariant[] = ["night", "rose", "champagne", "deep"];
const blockTypes: StudioContentBlock["block_type"][] = ["text", "quote", "image", "video", "audio", "divider", "prompt", "reward", "game", "photo_task"];
const gameTypes: StudioMiniGame["game_type"][] = ["reaction_duel", "couple_quiz", "penalty_picker", "progressive_penalty", "tap_sequence", "memory_match", "scratch_reveal", "choice"];
const unlockModes: StudioUnlockRule["unlock_mode"][] = ["manual", "time", "all_completed", "time_and_all_completed"];

const emptyData: ContentStudioData = {
  scenes: [],
  accessCodes: [],
  progress: [],
  unlockRules: [],
  unlockSchedule: [],
  dependencies: [],
  mediaRequirements: [],
  contentBlocks: [],
  taskResponses: [],
  miniGames: [],
  rewards: [],
  rewardClaims: [],
};

export function ContentStudio() {
  const [data, setData] = useState<ContentStudioData>(emptyData);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("scene");
  const [selectedAccessCodeId, setSelectedAccessCodeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | SceneType>("all");
  const [lockFilter, setLockFilter] = useState<"all" | "locked" | "open">("all");
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("normal");
  const [previewSizeMode, setPreviewSizeMode] = useState<PreviewSizeMode>("fit");
  const [previewKey, setPreviewKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resetInFlightRef = useRef(false);

  const selectedScene = useMemo(
    () => data.scenes.find((scene) => scene.slug === selectedSlug) ?? data.scenes[0] ?? null,
    [data.scenes, selectedSlug],
  );

  const activeAccessCode = useMemo(
    () => data.accessCodes.find((code) => code.id === selectedAccessCodeId) ?? data.accessCodes[0] ?? null,
    [data.accessCodes, selectedAccessCodeId],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextData = await loadContentStudioData(CONTENT_STUDIO_ACCESS_CODE);
      setData(nextData);
      setPreviewKey((key) => key + 1);
      setSelectedSlug((currentSlug) => currentSlug ?? nextData.scenes[0]?.slug ?? null);
      setSelectedAccessCodeId((currentId) => currentId ?? nextData.accessCodes[0]?.id ?? null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  async function runMutation(
    label: string,
    table: Parameters<typeof mutateContentStudio>[0],
    action: Parameters<typeof mutateContentStudio>[1],
    payload: Record<string, unknown>,
  ) {
    setIsSaving(true);
    setError(null);
    try {
      await mutateContentStudio(table, action, payload);
      setNotice(label);
      await refresh();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function resetTestState() {
    if (resetInFlightRef.current) return;
    if (!activeAccessCode) {
      setError("Sıfırlanacak access code bulunamadı.");
      return;
    }

    const taskResponses = data.taskResponses.filter((response) => response.access_code_id === activeAccessCode.id);
    const testFiles = taskResponses.flatMap((response) =>
      response.storage_bucket && response.storage_path
        ? [{ bucket: response.storage_bucket, path: response.storage_path }]
        : [],
    );
    const confirmed = window.confirm(
      `${activeAccessCode.code} için progress, ${taskResponses.length} görev sonucu ve reward claim kayıtları sıfırlansın mı? Bu işlem gerçek içerikleri ve sahne sırasını değiştirmez.`,
    );
    if (!confirmed) return;
    resetInFlightRef.current = true;
    const deleteTestFiles =
      testFiles.length > 0 &&
      window.confirm(
        `${testFiles.length} test görevi dosyası Storage alanından da silinsin mi?\n\n${testFiles.map((file) => file.path).join("\n")}`,
      );

    setIsSaving(true);
    setError(null);
    try {
      await mutateContentStudio("journey_reward_claims", "reset_for_access_code", {
        access_code_id: activeAccessCode.id,
      });
      for (const response of taskResponses) {
        await mutateContentStudio("journey_task_responses", "delete", { id: response.id });
      }
      await mutateContentStudio("journey_progress", "reset_for_access_code", {
        access_code_id: activeAccessCode.id,
      });

      if (deleteTestFiles) {
        await removeTaskUploadFiles(testFiles);
      }

      setNotice(
        "Test durumu sıfırlandı. Tarayıcı konumunu da başa almak için journey sayfasının site verilerindeki romanticJourney.* localStorage anahtarlarını temizle.",
      );
      await refresh();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      resetInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  const filteredScenes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.scenes
      .filter((scene) => {
        if (typeFilter !== "all" && scene.type !== typeFilter) return false;
        if (lockFilter === "locked" && !scene.is_locked) return false;
        if (lockFilter === "open" && scene.is_locked) return false;
        if (!normalizedQuery) return true;
        return `${scene.title} ${scene.slug}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((first, second) => first.sort_order - second.sort_order);
  }, [data.scenes, lockFilter, query, typeFilter]);

  return (
    <main className="min-h-[100dvh] bg-[#060712] text-[#fffaf2] xl:h-[100dvh] xl:overflow-hidden">
      <div className="hidden h-[100dvh] min-w-[1280px] grid-rows-[4rem_minmax(0,1fr)] overflow-hidden xl:grid">
        <ContentStudioToolbar
          activeAccessCode={activeAccessCode}
          accessCodes={data.accessCodes}
          isLoading={isLoading}
          isSaving={isSaving}
          notice={notice}
          error={error}
          onRefresh={refresh}
          onAccessCodeChange={setSelectedAccessCodeId}
          onDownload={() => downloadBackup(data)}
        />

        <div className="grid min-h-0 grid-cols-[350px_minmax(540px,1fr)_430px] gap-4 overflow-hidden px-4 pb-4">
          <SceneListPanel
            scenes={filteredScenes}
            allScenes={data.scenes}
            selectedScene={selectedScene}
            selectedSceneIds={selectedSceneIds}
            query={query}
            typeFilter={typeFilter}
            lockFilter={lockFilter}
            data={data}
            onQueryChange={setQuery}
            onTypeFilterChange={setTypeFilter}
            onLockFilterChange={setLockFilter}
            onSelect={(scene) => {
              setSelectedSlug(scene.slug);
              if (scene.type === "chapter" && activeTab !== "scene" && activeTab !== "unlock") {
                setActiveTab("scene");
              }
            }}
            onToggleSelected={(sceneId) =>
              setSelectedSceneIds((ids) => (ids.includes(sceneId) ? ids.filter((id) => id !== sceneId) : [...ids, sceneId]))
            }
            onAddScene={() => {
              const nextOrder = Math.max(0, ...data.scenes.map((scene) => scene.sort_order)) + 10;
              runMutation("Yeni sahne eklendi.", "journey_scenes", "insert", {
                slug: `new-scene-${Date.now()}`,
                type: "story",
                title: "Yeni sahne",
                sort_order: nextOrder,
                background_variant: "night",
                is_active: true,
              });
            }}
            onAddChapter={() => {
              const nextOrder = Math.max(0, ...data.scenes.map((scene) => scene.sort_order)) + 10;
              const slug = `chapter-${Date.now()}`;
              setSelectedSlug(slug);
              setActiveTab("scene");
              runMutation("Yeni bölüm eklendi.", "journey_scenes", "insert", {
                slug,
                type: "chapter",
                title: "Yeni Bölüm",
                subtitle: null,
                sort_order: nextOrder,
                background_variant: "night",
                primary_action_label: null,
                is_locked: false,
                is_active: true,
              });
            }}
            onDuplicate={(scene) =>
              runMutation("Sahne kopyalandı.", "journey_scenes", "insert", {
                ...scene,
                id: undefined,
                slug: `${scene.slug}-copy-${Date.now()}`,
                title: `${scene.title} Kopya`,
                sort_order: scene.sort_order + 1,
              })
            }
            onDelete={(scene) => {
              const related = countRelatedRecords(data, scene);
              if (!window.confirm(`${scene.title} silinsin mi?\nBağlı kayıt sayısı: ${related}`)) return;
              runMutation("Sahne silme denendi.", "journey_scenes", "delete", { id: scene.id });
            }}
            onReorder={(sceneId, direction) => reorderScene(data.scenes, sceneId, direction, runMutation)}
            onMoveScene={(draggedId, targetId) => moveSceneTo(data.scenes, draggedId, targetId, runMutation)}
            onBulkLock={(locked) =>
              runMutation("Toplu kilit durumu güncellendi.", "journey_scenes", "bulk_update", {
                rows: selectedSceneIds.map((id) => ({ id, is_locked: locked })),
              })
            }
            onBulkBackground={(variant) =>
              runMutation("Toplu arka plan güncellendi.", "journey_scenes", "bulk_update", {
                rows: selectedSceneIds.map((id) => ({ id, background_variant: variant })),
              })
            }
          />

          <SceneEditorPanel
            data={data}
            scene={selectedScene}
            activeTab={activeTab}
            accessCode={activeAccessCode}
            isSaving={isSaving}
            onTabChange={setActiveTab}
            onMutation={runMutation}
            onRefresh={refresh}
            onResetTestState={resetTestState}
          />

          <ScenePreviewPanel
            key={`${selectedScene?.id ?? "empty"}-${previewMode}-${previewKey}`}
            data={data}
            scene={selectedScene}
            previewMode={previewMode}
            previewSizeMode={previewSizeMode}
            previewRunKey={previewKey}
            onPreviewModeChange={setPreviewMode}
            onPreviewSizeModeChange={setPreviewSizeMode}
            onReplay={() => setPreviewKey((key) => key + 1)}
          />
        </div>
      </div>

      <div className="flex min-h-[100dvh] items-center justify-center px-6 text-center xl:hidden">
        <div className="max-w-md rounded-[8px] border border-white/12 bg-white/[0.07] p-6 backdrop-blur">
          <p className="text-2xl font-semibold">Content Studio masaüstü ekran kullanımı için hazırlanmıştır.</p>
          <p className="mt-3 text-sm leading-6 text-[#fffaf2]/62">Lütfen en az 1280px genişlikte bir ekran kullan.</p>
        </div>
      </div>
    </main>
  );
}

function ContentStudioToolbar({
  activeAccessCode,
  accessCodes,
  isLoading,
  isSaving,
  notice,
  error,
  onRefresh,
  onAccessCodeChange,
  onDownload,
}: {
  activeAccessCode: { id: string; code: string; is_active: boolean } | null;
  accessCodes: Array<{ id: string; code: string; is_active: boolean }>;
  isLoading: boolean;
  isSaving: boolean;
  notice: string | null;
  error: string | null;
  onRefresh: () => void;
  onAccessCodeChange: (id: string) => void;
  onDownload: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#080a16]/92 px-4 backdrop-blur">
      <div>
        <p className="text-lg font-semibold leading-none">Content Studio</p>
        <p className="mt-1 text-xs text-[#fffaf2]/52">Kısa süreli içerik hazırlama aracı</p>
      </div>
      <div className="flex items-center gap-3">
        {notice ? <span className="rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 px-3 py-1 text-xs text-[#f4dcc0]">{notice}</span> : null}
        {error ? <span className="max-w-[420px] truncate rounded-full border border-[#f0b7c6]/30 bg-[#f0b7c6]/10 px-3 py-1 text-xs text-[#f0b7c6]">{error}</span> : null}
        <select
          className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-[#fffaf2] outline-none"
          value={activeAccessCode?.id ?? ""}
          onChange={(event) => onAccessCodeChange(event.target.value)}
        >
          {accessCodes.map((code) => (
            <option key={code.id} className="bg-[#080a16]" value={code.id}>
              {code.code} {code.is_active ? "" : "(pasif)"}
            </option>
          ))}
        </select>
        <button className="studio-button" type="button" onClick={onDownload}>
          <Download size={16} /> Yedek İndir
        </button>
        <button className="studio-button" type="button" onClick={onRefresh} disabled={isLoading || isSaving}>
          <RefreshCcw size={16} /> {isLoading ? "Yükleniyor" : isSaving ? "Kaydediliyor" : "Yenile"}
        </button>
      </div>
    </header>
  );
}

function SceneListPanel({
  scenes,
  allScenes,
  selectedScene,
  selectedSceneIds,
  query,
  typeFilter,
  lockFilter,
  data,
  onQueryChange,
  onTypeFilterChange,
  onLockFilterChange,
  onSelect,
  onToggleSelected,
  onAddScene,
  onAddChapter,
  onDuplicate,
  onDelete,
  onReorder,
  onMoveScene,
  onBulkLock,
  onBulkBackground,
}: {
  scenes: StudioScene[];
  allScenes: StudioScene[];
  selectedScene: StudioScene | null;
  selectedSceneIds: string[];
  query: string;
  typeFilter: "all" | SceneType;
  lockFilter: "all" | "locked" | "open";
  data: ContentStudioData;
  onQueryChange: (value: string) => void;
  onTypeFilterChange: (value: "all" | SceneType) => void;
  onLockFilterChange: (value: "all" | "locked" | "open") => void;
  onSelect: (scene: StudioScene) => void;
  onToggleSelected: (sceneId: string) => void;
  onAddScene: () => void;
  onAddChapter: () => void;
  onDuplicate: (scene: StudioScene) => void;
  onDelete: (scene: StudioScene) => void;
  onReorder: (sceneId: string, direction: "up" | "down") => void;
  onMoveScene: (draggedId: string, targetId: string) => void;
  onBulkLock: (locked: boolean) => void;
  onBulkBackground: (variant: BackgroundVariant) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const readinessIssues = useMemo(() => getContentReadinessIssues(data), [data]);
  const readinessErrors = readinessIssues.filter((issue) => issue.severity === "error").length;
  const readinessWarnings = readinessIssues.length - readinessErrors;

  return (
    <aside className="studio-panel flex min-h-0 flex-col">
      <div className="space-y-3 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Sahneler</p>
            <p className="mt-1 text-xs text-[#fffaf2]/50">{allScenes.length} kayıt</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="studio-button px-2.5 py-1.5 text-xs" type="button" onClick={onAddChapter} title="Yeni bölüm">
              <Plus size={14} /> Bölüm
            </button>
            <button className="studio-icon-button" type="button" onClick={onAddScene} title="Yeni sahne">
              <Plus size={17} />
            </button>
          </div>
        </div>
        <input className="studio-input" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Başlık veya slug ara" />
        <div className="grid grid-cols-2 gap-2">
          <select className="studio-input" value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as "all" | SceneType)}>
            <option value="all">Tüm tipler</option>
            {sceneTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select className="studio-input" value={lockFilter} onChange={(event) => onLockFilterChange(event.target.value as "all" | "locked" | "open")}>
            <option value="all">Tüm kilitler</option>
            <option value="locked">Kilitli</option>
            <option value="open">Açık</option>
          </select>
        </div>
        {selectedSceneIds.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 rounded-[8px] border border-[#f4dcc0]/14 bg-[#f4dcc0]/8 p-2">
            <button className="studio-mini-button" type="button" onClick={() => onBulkLock(true)}>
              Kilitle
            </button>
            <button className="studio-mini-button" type="button" onClick={() => onBulkLock(false)}>
              Aç
            </button>
            <select className="studio-input col-span-2" onChange={(event) => event.target.value && onBulkBackground(event.target.value as BackgroundVariant)} defaultValue="">
              <option value="">Arka plan değiştir</option>
              {backgroundVariants.map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[#fffaf2]/82">Yayına Hazırlık Kontrolü</p>
            <span className="text-[10px] text-[#fffaf2]/48">
              {readinessErrors} hata, {readinessWarnings} uyarı
            </span>
          </div>
          {readinessIssues.length > 0 ? (
            <div className="mt-2 max-h-32 space-y-2 overflow-y-auto pr-1">
              {readinessIssues.map((issue, index) => (
                <button
                  key={`${issue.code}-${issue.sceneId}-${index}`}
                  className={cn(
                    "block w-full rounded-[6px] border px-2 py-1.5 text-left text-[10px] leading-4",
                    issue.severity === "error"
                      ? "border-[#f0b7c6]/24 bg-[#f0b7c6]/8 text-[#f0b7c6]"
                      : "border-[#f4dcc0]/18 bg-[#f4dcc0]/7 text-[#f4dcc0]/76",
                  )}
                  type="button"
                  onClick={() => {
                    const issueScene = allScenes.find((scene) => scene.id === issue.sceneId);
                    if (issueScene) onSelect(issueScene);
                  }}
                >
                  <span className="font-semibold">{issue.sceneSlug}</span>: {issue.message}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[10px] leading-4 text-[#b9dfca]/72">İçerik ve ilişki kontrollerinde sorun bulunmadı.</p>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {scenes.map((scene) => {
          const rule = data.unlockRules.find((item) => item.target_scene_slug === scene.slug);
          const hasMissingMedia = hasRequiredMediaGap(scene, data.mediaRequirements);
          return (
            <button
              key={scene.id}
              className={cn(
                "mb-2 w-full rounded-[8px] border p-3 text-left transition hover:bg-white/[0.08]",
                selectedScene?.id === scene.id ? "border-[#f4dcc0]/36 bg-[#f4dcc0]/10" : "border-white/10 bg-white/[0.045]",
                draggingId === scene.id && "opacity-55",
              )}
              type="button"
              draggable
              onDragStart={() => setDraggingId(scene.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggingId && draggingId !== scene.id) onMoveScene(draggingId, scene.id);
                setDraggingId(null);
              }}
              onClick={() => onSelect(scene)}
            >
              <div className="flex items-start gap-2">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={selectedSceneIds.includes(scene.id)}
                  onChange={(event) => {
                    event.stopPropagation();
                    onToggleSelected(scene.id);
                  }}
                  onClick={(event) => event.stopPropagation()}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#f4dcc0]/76">{scene.sort_order}</span>
                    {scene.is_locked ? <Lock size={13} className="text-[#f4dcc0]/72" /> : null}
                    {hasMissingMedia ? <AlertTriangle size={13} className="text-[#f0b7c6]" /> : null}
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-[#fffaf2]/62">{scene.type}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-[#fffaf2]">{scene.title}</p>
                  <p className="mt-1 truncate text-xs text-[#fffaf2]/46">{scene.slug}</p>
                  <p className="mt-2 truncate text-[11px] text-[#f4dcc0]/58">{rule ? summarizeRule(rule) : "Rule yok"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1">
                <button className="studio-row-action" type="button" onClick={(event) => { event.stopPropagation(); onReorder(scene.id, "up"); }}>
                  ↑
                </button>
                <button className="studio-row-action" type="button" onClick={(event) => { event.stopPropagation(); onReorder(scene.id, "down"); }}>
                  ↓
                </button>
                <button className="studio-row-action" type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(scene); }}>
                  <Copy size={13} />
                </button>
                <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={(event) => { event.stopPropagation(); onDelete(scene); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function SceneEditorPanel({
  data,
  scene,
  activeTab,
  accessCode,
  isSaving,
  onTabChange,
  onMutation,
  onRefresh,
  onResetTestState,
}: {
  data: ContentStudioData;
  scene: StudioScene | null;
  activeTab: TabKey;
  accessCode: { id: string; code: string } | null;
  isSaving: boolean;
  onTabChange: (tab: TabKey) => void;
  onMutation: (
    label: string,
    table: Parameters<typeof mutateContentStudio>[0],
    action: Parameters<typeof mutateContentStudio>[1],
    payload: Record<string, unknown>,
  ) => Promise<void>;
  onRefresh: () => void;
  onResetTestState: () => void;
}) {
  if (!scene) {
    return (
      <section className="studio-panel flex items-center justify-center">
        <p className="text-[#fffaf2]/56">Sahne seç.</p>
      </section>
    );
  }

  const visibleTabs = scene.type === "chapter"
    ? tabs.filter((tab) => tab.key === "scene" || tab.key === "unlock")
    : tabs;
  const effectiveTab = visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "scene";

  return (
    <section className="studio-panel flex min-h-0 flex-col">
      <div className="border-b border-white/10 p-4">
        <p className="text-xl font-semibold">{scene.title}</p>
        <p className="mt-1 text-xs text-[#fffaf2]/50">{scene.slug}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              className={cn("rounded-full border px-3 py-1.5 text-xs", effectiveTab === tab.key ? "border-[#f4dcc0]/34 bg-[#f4dcc0]/12 text-[#f4dcc0]" : "border-white/10 bg-white/[0.04] text-[#fffaf2]/62")}
              type="button"
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {effectiveTab === "scene" ? <SceneDetailsForm key={`${scene.id}-${scene.slug}-${scene.sort_order}`} scene={scene} isSaving={isSaving} onSave={(payload) => onMutation("Sahne kaydedildi.", "journey_scenes", "update", payload)} /> : null}
        {effectiveTab === "blocks" ? <ContentBlocksEditor scene={scene} blocks={data.contentBlocks.filter((block) => block.scene_slug === scene.slug).sort((a, b) => a.sort_order - b.sort_order)} onMutation={onMutation} /> : null}
        {effectiveTab === "unlock" ? <UnlockSettingsEditor key={`${scene.id}-${data.unlockRules.find((rule) => rule.target_scene_slug === scene.slug)?.updated_at ?? "no-rule"}-${data.unlockSchedule.find((item) => item.scene_slug === scene.slug)?.unlock_at ?? "no-schedule"}`} scene={scene} scenes={data.scenes} rule={data.unlockRules.find((rule) => rule.target_scene_slug === scene.slug) ?? null} schedule={data.unlockSchedule.find((item) => item.scene_slug === scene.slug) ?? null} dependencies={data.dependencies.filter((item) => item.target_scene_slug === scene.slug)} onMutation={onMutation} /> : null}
        {effectiveTab === "game" ? <MiniGameEditor key={`${scene.id}-${data.miniGames.find((item) => item.scene_slug === scene.slug)?.updated_at ?? "no-game"}`} scene={scene} game={data.miniGames.find((item) => item.scene_slug === scene.slug) ?? null} onMutation={onMutation} /> : null}
        {effectiveTab === "reward" ? <RewardEditor scene={scene} rewards={data.rewards.filter((reward) => reward.scene_slug === scene.slug)} claims={data.rewardClaims.filter((claim) => claim.scene_id === scene.id)} onMutation={onMutation} /> : null}
        {effectiveTab === "progress" ? <ProgressViewer scene={scene} accessCode={accessCode} progress={data.progress.find((item) => item.scene_id === scene.id && item.access_code_id === accessCode?.id) ?? null} taskResponses={data.taskResponses.filter((item) => item.scene_id === scene.id && item.access_code_id === accessCode?.id)} rewardClaims={data.rewardClaims.filter((item) => item.scene_id === scene.id && item.access_code_id === accessCode?.id)} accessTaskResponses={data.taskResponses.filter((item) => item.access_code_id === accessCode?.id)} onResetTestState={onResetTestState} onMutation={onMutation} /> : null}
        {effectiveTab === "json" ? <ChatGptPanel data={data} scene={scene} onMutation={onMutation} onRefresh={onRefresh} /> : null}
        {effectiveTab === "timeline" ? <TimelineView data={data} onMutation={onMutation} /> : null}
      </div>
    </section>
  );
}

function SceneDetailsForm({ scene, isSaving, onSave }: { scene: StudioScene; isSaving: boolean; onSave: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState(scene);
  const isChapter = form.type === "chapter";

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        {isChapter ? (
          <div className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="studio-label">Sistem kimliği</span>
            <p className="truncate text-sm text-[#fffaf2]/62">{form.slug}</p>
          </div>
        ) : (
          <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
        )}
        <SelectField label="Sahne tipi" value={form.type} options={sceneTypes} onChange={(value) => setForm({ ...form, type: value as SceneType })} />
      </div>
      <Field label={isChapter ? "Bölüm başlığı" : "Başlık"} value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
      <Field label={isChapter ? "Opsiyonel alt cümle" : "Subtitle"} value={form.subtitle ?? ""} onChange={(value) => setForm({ ...form, subtitle: value || null })} />
      {isChapter ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sort order" type="number" value={String(form.sort_order)} onChange={(value) => setForm({ ...form, sort_order: Number(value) })} />
            <CheckField label="Temel kilitli" checked={form.is_locked} onChange={(checked) => setForm({ ...form, is_locked: checked })} />
            <CheckField label="Aktif" checked={form.is_active} onChange={(checked) => setForm({ ...form, is_active: checked })} />
          </div>
          <TextAreaField label="Unlock condition text" value={form.unlock_condition ?? ""} onChange={(value) => setForm({ ...form, unlock_condition: value || null })} rows={3} />
          <p className="rounded-[8px] border border-[#f4dcc0]/14 bg-[#f4dcc0]/7 px-3 py-2 text-xs leading-5 text-[#f4dcc0]/68">
            Medya, içerik blokları, görev, mini oyun ve ödül alanları chapter sahnelerinde kullanılmaz. Ayrıntılı zamanlama için Kilit ve Zaman sekmesini kullan.
          </p>
        </>
      ) : (
        <>
          <TextAreaField label="Ana içerik" value={form.content ?? ""} onChange={(value) => setForm({ ...form, content: value || null })} rows={8} />
          <div className="grid grid-cols-2 gap-3">
            <MediaUploadField enableImagePlacement sceneSlug={form.slug} label="Image URL" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            <MediaUploadField sceneSlug={form.slug} label="Video URL" value={form.video_url} onChange={(url) => setForm({ ...form, video_url: url })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date label" value={form.date_label ?? ""} onChange={(value) => setForm({ ...form, date_label: value || null })} />
            <Field label="Sort order" type="number" value={String(form.sort_order)} onChange={(value) => setForm({ ...form, sort_order: Number(value) })} />
            <SelectField label="Background" value={form.background_variant ?? ""} options={["", ...backgroundVariants]} onChange={(value) => setForm({ ...form, background_variant: value ? (value as BackgroundVariant) : null })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <CheckField label="Temel kilitli" checked={form.is_locked} onChange={(checked) => setForm({ ...form, is_locked: checked })} />
            <CheckField label="Aktif" checked={form.is_active} onChange={(checked) => setForm({ ...form, is_active: checked })} />
            <Field label="Primary action" value={form.primary_action_label ?? ""} onChange={(value) => setForm({ ...form, primary_action_label: value || null })} />
          </div>
          <TextAreaField label="Unlock condition text" value={form.unlock_condition ?? ""} onChange={(value) => setForm({ ...form, unlock_condition: value || null })} rows={3} />
        </>
      )}
      <button className="studio-primary-button justify-self-start" type="button" disabled={isSaving} onClick={() => onSave(form)}>
        <Save size={16} /> {isSaving ? "Kaydediliyor" : "Kaydet"}
      </button>
    </div>
  );
}

function ContentBlocksEditor({
  scene,
  blocks,
  onMutation,
}: {
  scene: StudioScene;
  blocks: StudioContentBlock[];
  onMutation: ContentStudioMutation;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#fffaf2]/58">{blocks.length} blok</p>
        <button
          className="studio-primary-button"
          type="button"
          onClick={() =>
            onMutation("Blok eklendi.", "journey_scene_content_blocks", "insert", {
              scene_slug: scene.slug,
              block_type: "text",
              title: "Yeni blok",
              sort_order: Math.max(0, ...blocks.map((block) => block.sort_order)) + 10,
              metadata: {},
              is_active: true,
            })
          }
        >
          <Plus size={16} /> Blok Ekle
        </button>
      </div>
      {blocks.map((block) => (
        <div
          key={`${block.id}-${block.updated_at}`}
          draggable
          onDragStart={() => setDraggingId(block.id)}
          onDragEnd={() => setDraggingId(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (draggingId && draggingId !== block.id) moveBlockTo(blocks, draggingId, block.id, onMutation);
            setDraggingId(null);
          }}
          className={cn(draggingId === block.id && "opacity-55")}
        >
          <ContentBlockForm block={block} blocks={blocks} onMutation={onMutation} />
        </div>
      ))}
    </div>
  );
}

function ContentBlockForm({ block, blocks, onMutation }: { block: StudioContentBlock; blocks: StudioContentBlock[]; onMutation: ContentStudioMutation }) {
  const [form, setForm] = useState(block);

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#f4dcc0]/70">#{form.sort_order}</span>
          <SelectField label="" compact value={form.block_type} options={blockTypes} onChange={(value) => setForm({ ...form, block_type: value as StudioContentBlock["block_type"] })} />
          <CheckField compact label="Aktif" checked={form.is_active} onChange={(checked) => setForm({ ...form, is_active: checked })} />
        </div>
        <div className="flex gap-1">
          <button className="studio-row-action" type="button" onClick={() => moveBlock(blocks, form.id, "up", onMutation)}>↑</button>
          <button className="studio-row-action" type="button" onClick={() => moveBlock(blocks, form.id, "down", onMutation)}>↓</button>
          <button className="studio-row-action" type="button" onClick={() => onMutation("Blok kopyalandı.", "journey_scene_content_blocks", "insert", { ...form, id: undefined, title: `${form.title ?? "Blok"} Kopya`, sort_order: form.sort_order + 1 })}>
            <Copy size={13} />
          </button>
          <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={() => window.confirm("Blok silinsin mi?") && onMutation("Blok silindi.", "journey_scene_content_blocks", "delete", { id: form.id })}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Başlık" value={form.title ?? ""} onChange={(value) => setForm({ ...form, title: value || null })} />
          <Field label="Sort order" type="number" value={String(form.sort_order)} onChange={(value) => setForm({ ...form, sort_order: Number(value) })} />
        </div>
        <TextAreaField label={form.block_type === "quote" ? "Alıntı / body" : "Metin / body"} value={form.body ?? ""} onChange={(value) => setForm({ ...form, body: value || null })} rows={4} />
        {["image", "video", "audio"].includes(form.block_type) ? (
          <div className="grid grid-cols-2 gap-3">
            <MediaUploadField enableImagePlacement={form.block_type === "image"} sceneSlug={form.scene_slug} label="Media URL" value={form.media_url} onChange={(url) => setForm({ ...form, media_url: url })} />
            <Field label="Alt text / caption" value={form.alt_text ?? ""} onChange={(value) => setForm({ ...form, alt_text: value || null })} />
          </div>
        ) : null}
        <JsonConfigEditor label="Metadata JSON" value={form.metadata} onChange={(metadata) => setForm({ ...form, metadata: metadata as JsonRecord })} />
        <button className="studio-primary-button justify-self-start" type="button" onClick={() => onMutation("Blok kaydedildi.", "journey_scene_content_blocks", "update", form as unknown as Record<string, unknown>)}>
          <Save size={16} /> Bloku Kaydet
        </button>
      </div>
    </div>
  );
}

function UnlockSettingsEditor({
  scene,
  scenes,
  rule,
  schedule,
  dependencies,
  onMutation,
}: {
  scene: StudioScene;
  scenes: StudioScene[];
  rule: StudioUnlockRule | null;
  schedule: StudioUnlockSchedule | null;
  dependencies: StudioDependency[];
  onMutation: ContentStudioMutation;
}) {
  const [mode, setMode] = useState<"always" | StudioUnlockRule["unlock_mode"]>(rule?.unlock_mode ?? (scene.is_locked ? "manual" : "always"));
  const [unlockAt, setUnlockAt] = useState(toLocalDateTimeInput(rule?.unlock_at ?? schedule?.unlock_at ?? null));
  const [description, setDescription] = useState(rule?.description ?? scene.unlock_condition ?? "");
  const [dependencySlug, setDependencySlug] = useState("");

  async function save() {
    if (mode === "always") {
      await onMutation("Kilit kuralı kaldırıldı.", "journey_scene_unlock_rules", "delete", { target_scene_slug: scene.slug });
      return;
    }

    const required = dependencies.map((item) => item.trigger_scene_slug);
    await onMutation("Kilit kuralı kaydedildi.", "journey_scene_unlock_rules", "upsert", {
      target_scene_slug: scene.slug,
      unlock_mode: mode,
      unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
      required_scene_slugs: required,
      description,
    });

    if ((mode === "time" || mode === "time_and_all_completed") && unlockAt) {
      await onMutation("Schedule kaydedildi.", "journey_scene_unlock_schedule", "upsert", {
        scene_slug: scene.slug,
        unlock_at: new Date(unlockAt).toISOString(),
        label: description,
      });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold">Bu sahne nasıl açılacak?</p>
        <p className="mt-1 text-xs text-[#fffaf2]/48">Timezone: {CONTENT_STUDIO_TIMEZONE}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SelectField label="Açılma tipi" value={mode} options={["always", ...unlockModes]} onChange={(value) => setMode(value as typeof mode)} />
          {(mode === "time" || mode === "time_and_all_completed") ? (
            <Field label="Tarih ve saat" type="datetime-local" value={unlockAt} onChange={setUnlockAt} />
          ) : null}
        </div>
        <TextAreaField label="Açıklama" value={description} onChange={setDescription} rows={3} />
        <div className="mt-4 flex gap-2">
          <button className="studio-primary-button" type="button" onClick={save}>
            <Save size={16} /> Kilit Ayarını Kaydet
          </button>
          {schedule ? (
            <button className="studio-button" type="button" onClick={() => onMutation("Schedule silindi.", "journey_scene_unlock_schedule", "delete", { scene_slug: scene.slug })}>
              Schedule Sil
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold">Dependency</p>
        <div className="mt-3 flex gap-2">
          <select className="studio-input" value={dependencySlug} onChange={(event) => setDependencySlug(event.target.value)}>
            <option value="">Sahne seç</option>
            {scenes.filter((item) => item.slug !== scene.slug).map((item) => (
              <option key={item.id} value={item.slug}>
                {item.sort_order} · {item.title} · {item.slug}
              </option>
            ))}
          </select>
          <button
            className="studio-primary-button"
            type="button"
            disabled={!dependencySlug}
            onClick={() => onMutation("Dependency eklendi.", "journey_scene_dependencies", "insert", { trigger_scene_slug: dependencySlug, target_scene_slug: scene.slug })}
          >
            Ekle
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          {dependencies.map((dependency) => (
            <div key={`${dependency.trigger_scene_slug}-${dependency.target_scene_slug}`} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-[#080a16] px-3 py-2 text-sm">
              <span>{dependency.trigger_scene_slug}</span>
              <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={() => onMutation("Dependency silindi.", "journey_scene_dependencies", "delete", dependency)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniGameEditor({ scene, game, onMutation }: { scene: StudioScene; game: StudioMiniGame | null; onMutation: ContentStudioMutation }) {
  const [form, setForm] = useState<Partial<StudioMiniGame>>(game ?? {
    scene_slug: scene.slug,
    game_key: "primary",
    game_type: "reaction_duel",
    title: "Mini oyun",
    instructions: "",
    config: {},
    reward_key: null,
    sort_order: 100,
    is_active: true,
  });
  const [isProgressiveEditorValid, setIsProgressiveEditorValid] = useState(true);
  const isProgressivePenalty = form.game_type === "progressive_penalty";
  const progressiveValidation = isProgressivePenalty ? validateProgressivePenaltyConfig(form.config) : null;
  const progressiveSaveBlocked = Boolean(isProgressivePenalty && (scene.type !== "task" || progressiveValidation?.errors.length || !isProgressiveEditorValid));

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Oyun tipi"
          value={form.game_type ?? "reaction_duel"}
          options={gameTypes}
          onChange={(value) => {
            const gameType = value as StudioMiniGame["game_type"];
            setForm({
              ...form,
              game_type: gameType,
              config: gameType === "progressive_penalty" && form.game_type !== "progressive_penalty"
                ? createDefaultProgressivePenaltyConfig() as unknown as JsonRecord
                : form.config,
            });
          }}
        />
        <Field label="Game key" value={form.game_key ?? "primary"} onChange={(value) => setForm({ ...form, game_key: value })} />
      </div>
      <Field label="Başlık" value={form.title ?? ""} onChange={(value) => setForm({ ...form, title: value })} />
      <TextAreaField label="Açıklama" value={form.instructions ?? ""} onChange={(value) => setForm({ ...form, instructions: value })} rows={3} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Reward key" value={form.reward_key ?? ""} onChange={(value) => setForm({ ...form, reward_key: value || null })} />
        <Field label="Sort" type="number" value={String(form.sort_order ?? 100)} onChange={(value) => setForm({ ...form, sort_order: Number(value) })} />
        <CheckField label="Aktif" checked={Boolean(form.is_active)} onChange={(checked) => setForm({ ...form, is_active: checked })} />
      </div>
      {isProgressivePenalty && scene.type !== "task" ? (
        <div className="rounded-[8px] border border-amber-300/24 bg-amber-300/8 p-3 text-sm text-amber-100/75" role="alert">
          progressive_penalty yalnızca task sahnesine bağlanabilir. Önce sahne tipini task yapmalısın.
        </div>
      ) : null}
      {isProgressivePenalty ? (
        <ProgressivePenaltyConfigEditor value={form.config ?? {}} onChange={(config) => setForm({ ...form, config })} onValidityChange={setIsProgressiveEditorValid} />
      ) : (
        <JsonConfigEditor label="Config JSON" value={form.config ?? {}} onChange={(config) => setForm({ ...form, config: config as JsonRecord })} rows={12} />
      )}
      <div className="flex gap-2">
        <button className="studio-primary-button" type="button" disabled={progressiveSaveBlocked} onClick={() => onMutation("Mini game kaydedildi.", "journey_mini_games", game ? "update" : "insert", { ...form, scene_slug: scene.slug } as Record<string, unknown>)}>
          <Save size={16} /> Kaydet
        </button>
        {game ? (
          <button className="studio-button text-[#f0b7c6]" type="button" onClick={() => window.confirm("Mini game silinsin mi?") && onMutation("Mini game silindi.", "journey_mini_games", "delete", { id: game.id })}>
            <Trash2 size={16} /> Sil
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RewardEditor({ scene, rewards, claims, onMutation }: { scene: StudioScene; rewards: StudioReward[]; claims: StudioRewardClaim[]; onMutation: ContentStudioMutation }) {
  return (
    <div className="grid gap-4">
      <button
        className="studio-primary-button justify-self-start"
        type="button"
        onClick={() => onMutation("Reward eklendi.", "journey_rewards", "insert", { scene_slug: scene.slug, reward_key: `reward-${Date.now()}`, title: "Yeni ödül", metadata: {}, is_active: true })}
      >
        <Plus size={16} /> Reward Ekle
      </button>
      {rewards.map((reward) => (
        <RewardForm key={`${reward.id}-${reward.updated_at}`} reward={reward} onMutation={onMutation} />
      ))}
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold">Reward claims</p>
        {claims.length === 0 ? <p className="mt-2 text-sm text-[#fffaf2]/48">Claim yok.</p> : null}
        {claims.map((claim) => (
          <div key={claim.id} className="mt-2 flex items-center justify-between rounded-[8px] bg-[#080a16] px-3 py-2 text-xs">
            <span>{claim.reward_id} · {claim.unlocked_at}</span>
            <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={() => window.confirm("Claim silinsin mi?") && onMutation("Claim silindi.", "journey_reward_claims", "delete", { id: claim.id })}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardForm({ reward, onMutation }: { reward: StudioReward; onMutation: ContentStudioMutation }) {
  const [form, setForm] = useState(reward);

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Reward key" value={form.reward_key} onChange={(value) => setForm({ ...form, reward_key: value })} />
        <Field label="Başlık" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
      </div>
      <Field label="Subtitle" value={form.subtitle ?? ""} onChange={(value) => setForm({ ...form, subtitle: value || null })} />
      <TextAreaField label="Body" value={form.body ?? ""} onChange={(value) => setForm({ ...form, body: value || null })} rows={4} />
      <div className="grid grid-cols-2 gap-3">
        <MediaUploadField enableImagePlacement sceneSlug={form.scene_slug} label="Image URL" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
        <MediaUploadField sceneSlug={form.scene_slug} label="Video URL" value={form.video_url} onChange={(url) => setForm({ ...form, video_url: url })} />
      </div>
      <JsonConfigEditor label="Metadata" value={form.metadata} onChange={(metadata) => setForm({ ...form, metadata: metadata as JsonRecord })} />
      <div className="mt-3 flex gap-2">
        <button className="studio-primary-button" type="button" onClick={() => onMutation("Reward kaydedildi.", "journey_rewards", "update", form as unknown as Record<string, unknown>)}>
          <Save size={16} /> Kaydet
        </button>
        <button className="studio-button text-[#f0b7c6]" type="button" onClick={() => window.confirm("Reward silinsin mi?") && onMutation("Reward silindi.", "journey_rewards", "delete", { id: form.id })}>
          <Trash2 size={16} /> Sil
        </button>
      </div>
    </div>
  );
}

function ProgressViewer({
  scene,
  accessCode,
  progress,
  taskResponses,
  rewardClaims,
  accessTaskResponses,
  onResetTestState,
  onMutation,
}: {
  scene: StudioScene;
  accessCode: { id: string; code: string } | null;
  progress: StudioProgress | null;
  taskResponses: StudioTaskResponse[];
  rewardClaims: StudioRewardClaim[];
  accessTaskResponses: StudioTaskResponse[];
  onResetTestState: () => void;
  onMutation: ContentStudioMutation;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const testPhotos = accessTaskResponses.filter((response) => response.storage_bucket && response.storage_path);

  async function openStorage(response: StudioTaskResponse) {
    if (!response.storage_bucket || !response.storage_path) return;
    const url = await getTaskUploadSignedUrl(response.storage_bucket, response.storage_path);
    setSignedUrl(url);
    window.open(url, "_blank", "noreferrer");
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[8px] border border-[#f0b7c6]/18 bg-[#f0b7c6]/7 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Test Durumunu Sıfırla</p>
            <p className="mt-1 text-xs leading-5 text-[#fffaf2]/54">
              Seçili access code için progress, görev cevapları ve reward claim kayıtlarını kullanıcı onayıyla temizler.
            </p>
          </div>
          <button className="studio-button shrink-0 text-[#f0b7c6]" type="button" disabled={!accessCode} onClick={onResetTestState}>
            <RefreshCcw size={15} /> Sıfırla
          </button>
        </div>
        <div className="mt-3 rounded-[7px] border border-white/8 bg-black/15 p-3 text-xs text-[#fffaf2]/54">
          <p className="font-medium text-[#fffaf2]/72">Yüklenmiş test fotoğrafları: {testPhotos.length}</p>
          {testPhotos.length > 0 ? (
            <ul className="mt-2 max-h-28 space-y-1 overflow-auto font-mono text-[10px] text-[#fffaf2]/46">
              {testPhotos.map((response) => <li key={response.id}>{response.storage_path}</li>)}
            </ul>
          ) : null}
          <p className="mt-2 leading-5">
            Storage dosyaları ayrı bir onayla silinir. Tarayıcı konumu için journey sayfasının site verilerindeki romanticJourney.* localStorage anahtarlarını temizle.
          </p>
        </div>
      </div>
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold">Progress · {accessCode?.code ?? "Access code yok"}</p>
        {progress ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="studio-button" type="button" onClick={() => onMutation("Sahne açıldı.", "journey_progress", "update", { id: progress.id, is_unlocked: true })}>Açılmış Yap</button>
            <button className="studio-button" type="button" onClick={() => onMutation("Sahne kilitlendi.", "journey_progress", "update", { id: progress.id, is_unlocked: false, is_completed: false })}>Kilitli Yap</button>
            <button className="studio-button" type="button" onClick={() => onMutation("Sahne tamamlandı.", "journey_progress", "update", { id: progress.id, is_unlocked: true, is_completed: true, completed_at: new Date().toISOString() })}>Tamamlandı Yap</button>
            <button className="studio-button" type="button" onClick={() => onMutation("Tamamlanma sıfırlandı.", "journey_progress", "update", { id: progress.id, is_completed: false })}>Tamamlanmayı Sıfırla</button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#fffaf2]/48">Progress kaydı yok.</p>
        )}
      </div>
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Task responses</p>
        </div>
        {taskResponses.map((response) => (
          <div key={response.id} className="mt-3 rounded-[8px] border border-white/10 bg-[#080a16] p-3 text-xs">
            <div className="flex justify-between gap-3">
              <span>{response.response_type} · score {response.score ?? "-"}</span>
              <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={() => window.confirm("Task response silinsin mi?") && onMutation("Task response silindi.", "journey_task_responses", "delete", { id: response.id })}>
                <Trash2 size={13} />
              </button>
            </div>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/20 p-2 text-[#fffaf2]/64">{JSON.stringify(response.payload, null, 2)}</pre>
            {response.storage_path ? (
              <button className="studio-mini-button mt-2" type="button" onClick={() => openStorage(response)}>
                Storage dosyasını aç
              </button>
            ) : null}
          </div>
        ))}
        {signedUrl ? <p className="mt-2 truncate text-xs text-[#f4dcc0]/72">{signedUrl}</p> : null}
      </div>
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold">Reward claims</p>
        {rewardClaims.map((claim) => (
          <div key={claim.id} className="mt-2 flex justify-between rounded bg-[#080a16] px-3 py-2 text-xs">
            <span>{claim.reward_id}</span>
            <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={() => onMutation("Claim silindi.", "journey_reward_claims", "delete", { id: claim.id })}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatGptPanel({ data, scene, onMutation, onRefresh }: { data: ContentStudioData; scene: StudioScene; onMutation: ContentStudioMutation; onRefresh: () => void }) {
  const [scope, setScope] = useState<ExportScope>("selected_scene_full");
  const [importText, setImportText] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [changes, setChanges] = useState<ImportChange[]>([]);

  const prompt = useMemo(() => buildChatGptPrompt(data, scene, scope), [data, scene, scope]);

  function previewImport() {
    try {
      const parsed = parseChatGptJson(importText);
      const next = buildImportChanges(data, parsed);
      setWarnings(next.warnings);
      setChanges(next.changes);
    } catch (caughtError) {
      setWarnings([getErrorMessage(caughtError)]);
      setChanges([]);
    }
  }

  async function applyImport() {
    if (!window.confirm(`${changes.length} değişiklik Supabase'e uygulansın mı?`)) return;
    for (const change of changes) {
      await onMutation(`Import: ${change.label}`, change.table, change.action === "update" ? "update" : "insert", change.payload);
    }
    await onRefresh();
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <SelectField label="Export kapsamı" value={scope} options={["selected_scene", "selected_scene_full", "all_journey", "scene_texts", "locks_only", "content_blocks_only"]} onChange={(value) => setScope(value as ExportScope)} />
          <button className="studio-primary-button" type="button" onClick={() => navigator.clipboard.writeText(prompt)}>
            <Clipboard size={16} /> Prompt Kopyala
          </button>
        </div>
        <textarea className="mt-3 h-80 w-full rounded-[8px] border border-white/10 bg-[#080a16] p-3 font-mono text-xs leading-5 text-[#fffaf2]/76" readOnly value={prompt} />
      </div>
      <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold">ChatGPT JSON import</p>
        <textarea className="mt-3 h-52 w-full rounded-[8px] border border-white/10 bg-[#080a16] p-3 font-mono text-xs leading-5 text-[#fffaf2]/76" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="JSON sonucunu buraya yapıştır" />
        <div className="mt-3 flex gap-2">
          <button className="studio-button" type="button" onClick={previewImport}>Değişiklikleri Önizle</button>
          <button className="studio-primary-button" type="button" disabled={changes.length === 0} onClick={applyImport}>Onayla ve Uygula</button>
        </div>
        {warnings.length > 0 ? <div className="mt-3 rounded-[8px] border border-[#f0b7c6]/20 bg-[#f0b7c6]/10 p-3 text-xs text-[#f0b7c6]">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}
        {changes.length > 0 ? (
          <div className="mt-3 max-h-56 overflow-auto rounded-[8px] border border-white/10 bg-[#080a16] p-3 text-xs">
            {changes.map((change, index) => <p key={`${change.table}-${index}`}>{change.action} · {change.table} · {change.label}</p>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TimelineView({ data, onMutation }: { data: ContentStudioData; onMutation: ContentStudioMutation }) {
  return (
    <div className="overflow-auto rounded-[8px] border border-white/10">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="sticky top-0 bg-[#080a16] text-[#f4dcc0]/76">
          <tr>
            <th className="p-2">Order</th>
            <th className="p-2">Sahne</th>
            <th className="p-2">Type</th>
            <th className="p-2">Unlock</th>
            <th className="p-2">Tarih</th>
            <th className="p-2">Dependency</th>
            <th className="p-2">Medya</th>
          </tr>
        </thead>
        <tbody>
          {data.scenes.toSorted((a, b) => a.sort_order - b.sort_order).map((scene) => {
            const rule = data.unlockRules.find((item) => item.target_scene_slug === scene.slug);
            const schedule = data.unlockSchedule.find((item) => item.scene_slug === scene.slug);
            const deps = data.dependencies.filter((item) => item.target_scene_slug === scene.slug);
            return (
              <tr key={scene.id} className="border-t border-white/8">
                <td className="p-2"><input className="studio-input w-20" defaultValue={scene.sort_order} onBlur={(event) => onMutation("Sıra güncellendi.", "journey_scenes", "update", { ...scene, sort_order: Number(event.target.value) })} /></td>
                <td className="p-2"><p className="font-medium">{scene.title}</p><p className="text-[#fffaf2]/42">{scene.slug}</p></td>
                <td className="p-2">{scene.type}</td>
                <td className="p-2">{rule?.unlock_mode ?? (scene.is_locked ? "manual" : "always")}</td>
                <td className="p-2">{schedule?.unlock_at ? new Date(schedule.unlock_at).toLocaleString("tr-TR", { timeZone: CONTENT_STUDIO_TIMEZONE }) : "-"}</td>
                <td className="p-2">{deps.map((dep) => dep.trigger_scene_slug).join(", ") || "-"}</td>
                <td className="p-2">{hasRequiredMediaGap(scene, data.mediaRequirements) ? "Eksik" : "OK"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScenePreviewPanel({
  data,
  scene,
  previewMode,
  previewSizeMode,
  previewRunKey,
  onPreviewModeChange,
  onPreviewSizeModeChange,
  onReplay,
}: {
  data: ContentStudioData;
  scene: StudioScene | null;
  previewMode: PreviewMode;
  previewSizeMode: PreviewSizeMode;
  previewRunKey: number;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onPreviewSizeModeChange: (mode: PreviewSizeMode) => void;
  onReplay: () => void;
}) {
  const effectivePreviewMode = scene?.type === "chapter" && (previewMode === "task_pending" || previewMode === "task_done")
    ? "normal"
    : previewMode;
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [journeyScene, setJourneyScene] = useState<JourneyScene | null>(() =>
    scene ? buildJourneyScene(scene, data, effectivePreviewMode) : null,
  );
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const chapterNumber = scene
    ? getChapterNumber(
        data.scenes.map((item) => ({
          id: item.id,
          type: item.type,
          sortOrder: item.sort_order,
          isActive: item.is_active,
        })),
        scene.id,
      )
    : 1;
  const isChapter = journeyScene?.type === "chapter";

  useEffect(() => {
    return () => {
      if (previewMediaUrl) URL.revokeObjectURL(previewMediaUrl);
    };
  }, [previewMediaUrl]);

  useEffect(() => {
    const previewArea = previewAreaRef.current;
    if (!previewArea) return;

    const updateFitScale = () => {
      const nextScale = Math.min(
        1,
        previewArea.clientWidth / studioPreviewWidth,
        previewArea.clientHeight / studioPreviewHeight,
      );
      setFitScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateFitScale();
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(previewArea);
    return () => observer.disconnect();
  }, []);

  function updatePreviewScene(updater: (current: JourneyScene) => JourneyScene) {
    setJourneyScene((current) => (current ? updater(current) : current));
  }

  function unlockPreviewReward(rewardKey?: string | null) {
    if (!rewardKey) return;
    updatePreviewScene((current) => ({
      ...current,
      rewards: current.rewards.map((reward) =>
        reward.rewardKey === rewardKey
          ? { ...reward, isUnlocked: true, unlockedAt: new Date().toISOString() }
          : reward,
      ),
    }));
  }

  return (
    <aside className="studio-panel flex min-h-0 flex-col overflow-hidden p-4">
      <div className="shrink-0">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-semibold">Canlı önizleme</p>
            <p className="mt-1 text-xs text-[#fffaf2]/50">390 × 844 mobil simülasyon</p>
          </div>
          <button className="studio-button" type="button" onClick={onReplay}>
            <Eye size={15} /> {isChapter ? "Bölüm Jeneriğini Oynat" : "Animasyonu Yenile"}
          </button>
        </div>
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <select className="studio-input" value={effectivePreviewMode} onChange={(event) => onPreviewModeChange(event.target.value as PreviewMode)}>
            <option value="normal">Normal görünüm</option>
            <option value="locked">Kilitli görünüm</option>
            <option value="unlocked">Kilidi açılmış</option>
            {!isChapter ? <option value="task_pending">Görev tamamlanmamış</option> : null}
            {!isChapter ? <option value="task_done">Görev tamamlanmış</option> : null}
          </select>
          <div className="flex rounded-[8px] border border-white/10 bg-[#080a16]/88 p-1" aria-label="Önizleme ölçeği">
            <button
              className={cn(
                "rounded-[6px] px-2.5 text-xs font-semibold transition-colors",
                previewSizeMode === "fit" ? "bg-[#f4dcc0]/14 text-[#f4dcc0]" : "text-[#fffaf2]/48 hover:text-[#fffaf2]/72",
              )}
              type="button"
              aria-pressed={previewSizeMode === "fit"}
              onClick={() => onPreviewSizeModeChange("fit")}
            >
              Sığdır
            </button>
            <button
              className={cn(
                "rounded-[6px] px-2.5 text-xs font-semibold transition-colors",
                previewSizeMode === "actual" ? "bg-[#f4dcc0]/14 text-[#f4dcc0]" : "text-[#fffaf2]/48 hover:text-[#fffaf2]/72",
              )}
              type="button"
              aria-pressed={previewSizeMode === "actual"}
              onClick={() => onPreviewSizeModeChange("actual")}
            >
              %100
            </button>
          </div>
        </div>
      </div>
      <div ref={previewAreaRef} className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-[12px] bg-black/15">
        <div
          className="relative mx-auto"
          style={{
            width: studioPreviewWidth * (previewSizeMode === "fit" ? fitScale : 1),
            height: studioPreviewHeight * (previewSizeMode === "fit" ? fitScale : 1),
          }}
        >
          <div
            className="absolute left-1/2 top-0 overflow-hidden rounded-[18px] border border-white/14 bg-[#070814] shadow-[0_24px_90px_rgba(0,0,0,0.42)]"
            style={{
              width: studioPreviewWidth,
              height: studioPreviewHeight,
              transform: `translateX(-50%) scale(${previewSizeMode === "fit" ? fitScale : 1})`,
              transformOrigin: "top center",
            }}
          >
            {journeyScene?.type === "chapter" && !journeyScene.isLocked ? (
              <ChapterRevealScene
                chapterNumber={chapterNumber}
                title={journeyScene.title}
                subtitle={journeyScene.subtitle}
                direction="forward"
                allowSkip
                previewMode={true}
                embeddedViewport
                onComplete={() => undefined}
              />
            ) : journeyScene ? (
              <MobileSceneLayout
                title={journeyScene.title}
                subtitle={journeyScene.subtitle ?? undefined}
                backgroundVariant={journeyScene.backgroundVariant ?? "night"}
                isLocked={journeyScene.isLocked}
                embeddedViewport
                progress={{ current: 1, total: 1, states: [journeyScene.isLocked ? "locked" : journeyScene.progressIsCompleted ? "completed" : "unlocked"] }}
              >
                <JourneySceneRenderer
                  scene={journeyScene}
                  isSubmitting={false}
                  persistenceScope={`content-studio:${journeyScene.slug}:${effectivePreviewMode}:${previewRunKey}`}
                  onComplete={() => updatePreviewScene((current) => ({
                    ...current,
                    progressIsCompleted: true,
                    completedAt: new Date().toISOString(),
                  }))}
                  onSubmitPhoto={(file, rewardKey) => {
                    const mediaUrl = URL.createObjectURL(file);
                    setPreviewMediaUrl(mediaUrl);
                    updatePreviewScene((current) => ({
                      ...current,
                      progressIsCompleted: true,
                      completedAt: new Date().toISOString(),
                      taskResponse: buildStudioPreviewTaskResponse(
                        "photo",
                        rewardKey,
                        { fileName: file.name, fileSize: file.size, mimeType: file.type, previewOnly: true },
                        mediaUrl,
                      ),
                    }));
                    unlockPreviewReward(rewardKey);
                  }}
                  onCompleteMiniGame={(params: CompleteMiniGameParams) => {
                    updatePreviewScene((current) => ({
                      ...current,
                      progressIsCompleted: true,
                      completedAt: new Date().toISOString(),
                      taskResponse: buildStudioPreviewTaskResponse(
                        "mini_game",
                        params.rewardKey,
                        { ...params.payload, gameKey: params.gameKey ?? "primary", previewOnly: true },
                        null,
                        params.score,
                      ),
                    }));
                    unlockPreviewReward(params.rewardKey);
                  }}
                  onUnlockReward={(rewardKey) => unlockPreviewReward(rewardKey)}
                />
              </MobileSceneLayout>
            ) : (
              <div className="p-6 text-sm text-[#fffaf2]/60">Sahne seç.</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

type ContentStudioMutation = (
  label: string,
  table: Parameters<typeof mutateContentStudio>[0],
  action: Parameters<typeof mutateContentStudio>[1],
  payload: Record<string, unknown>,
) => Promise<void>;

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="studio-label">{label}</span>
      <input className="studio-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="block">
      <span className="studio-label">{label}</span>
      <textarea className="studio-input min-h-0" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange, compact = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; compact?: boolean }) {
  return (
    <label className={compact ? "block" : "block"}>
      {label ? <span className="studio-label">{label}</span> : null}
      <select className={cn("studio-input", compact && "h-8 py-1 text-xs")} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "-"}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({ label, checked, onChange, compact = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean }) {
  return (
    <label className={cn("flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-3", compact ? "py-1 text-xs" : "py-2 text-sm")}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="text-[#fffaf2]/74">{label}</span>
    </label>
  );
}

function buildJourneyScene(scene: StudioScene, data: ContentStudioData, mode: PreviewMode): JourneyScene {
  const isLocked = mode === "locked" || (mode === "normal" && scene.is_locked);
  const completed = mode === "task_done";
  const blocks = data.contentBlocks.filter((block) => block.scene_slug === scene.slug && block.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const rewards = data.rewards.filter((reward) => reward.scene_slug === scene.slug && reward.is_active).map((reward): JourneyReward => ({
    id: reward.id,
    rewardKey: reward.reward_key,
    title: reward.title,
    subtitle: reward.subtitle,
    body: reward.body,
    imageUrl: reward.image_url,
    videoUrl: reward.video_url,
    metadata: reward.metadata,
    sortOrder: reward.sort_order,
    isUnlocked: completed,
    unlockedAt: completed ? new Date().toISOString() : null,
  }));
  const miniGame = data.miniGames.find((game) => game.scene_slug === scene.slug && game.is_active);

  return {
    id: scene.id,
    slug: scene.slug,
    type: scene.type,
    title: scene.title,
    subtitle: scene.subtitle,
    content: scene.content,
    imageUrl: scene.image_url,
    videoUrl: scene.video_url,
    dateLabel: scene.date_label,
    sortOrder: scene.sort_order,
    backgroundVariant: scene.background_variant,
    isLocked,
    unlockCondition: scene.unlock_condition,
    primaryActionLabel: scene.primary_action_label,
    isActive: scene.is_active,
    progressIsCompleted: completed,
    progressIsUnlocked: !isLocked,
    completedAt: completed ? new Date().toISOString() : null,
    contentBlocks: blocks.map(mapContentBlock),
    taskResponse: completed ? buildCompletedTaskResponse() : null,
    rewards,
    miniGame: miniGame ? mapMiniGame(miniGame) : null,
  };
}

function mapContentBlock(block: StudioContentBlock): JourneyContentBlock {
  return {
    id: block.id,
    type: block.block_type,
    title: block.title,
    body: block.body,
    mediaUrl: block.media_url,
    mediaPath: block.media_path,
    altText: block.alt_text,
    metadata: block.metadata,
    sortOrder: block.sort_order,
  };
}

function mapMiniGame(game: StudioMiniGame): JourneyMiniGame {
  return {
    id: game.id,
    gameKey: game.game_key,
    type: game.game_type,
    title: game.title,
    instructions: game.instructions,
    config: game.config,
    rewardKey: game.reward_key,
    sortOrder: game.sort_order,
  };
}

function buildCompletedTaskResponse(): JourneyTaskResponse {
  const now = new Date().toISOString();
  return { id: "preview", responseKey: "primary", type: "generic", status: "completed", payload: {}, completedAt: now, updatedAt: now };
}

function buildStudioPreviewTaskResponse(
  type: JourneyTaskResponse["type"],
  rewardKey: string | null | undefined,
  payload: Record<string, unknown>,
  mediaUrl: string | null,
  score?: number | null,
): JourneyTaskResponse {
  const now = new Date().toISOString();
  return {
    id: `studio-preview-${crypto.randomUUID()}`,
    responseKey: "primary",
    type,
    status: "completed",
    mediaUrl,
    score: score ?? null,
    rewardKey,
    payload,
    completedAt: now,
    updatedAt: now,
  };
}

function hasRequiredMediaGap(scene: StudioScene, requirements: StudioMediaRequirement[]) {
  const sceneRequirements = requirements.filter((item) => item.scene_slug === scene.slug && item.is_required && item.media_type !== "none");
  if (sceneRequirements.length === 0) return false;
  return sceneRequirements.some((item) => {
    if (item.media_type === "image" || item.media_type === "background") return !scene.image_url;
    if (item.media_type === "video") return !scene.video_url;
    return false;
  });
}

function countRelatedRecords(data: ContentStudioData, scene: StudioScene) {
  return [
    data.contentBlocks.filter((item) => item.scene_slug === scene.slug).length,
    data.unlockRules.filter((item) => item.target_scene_slug === scene.slug).length,
    data.unlockSchedule.filter((item) => item.scene_slug === scene.slug).length,
    data.dependencies.filter((item) => item.target_scene_slug === scene.slug || item.trigger_scene_slug === scene.slug).length,
    data.miniGames.filter((item) => item.scene_slug === scene.slug).length,
    data.rewards.filter((item) => item.scene_slug === scene.slug).length,
    data.progress.filter((item) => item.scene_id === scene.id).length,
    data.taskResponses.filter((item) => item.scene_id === scene.id).length,
  ].reduce((sum, count) => sum + count, 0);
}

function summarizeRule(rule: StudioUnlockRule) {
  if (rule.unlock_mode === "time") return `Zaman: ${rule.unlock_at ?? "-"}`;
  if (rule.unlock_mode === "all_completed") return `Görev: ${rule.required_scene_slugs.join(", ") || "-"}`;
  if (rule.unlock_mode === "time_and_all_completed") return "Zaman + görev";
  return "Manuel";
}

function reorderScene(scenes: StudioScene[], sceneId: string, direction: "up" | "down", onMutation: ContentStudioMutation) {
  const sorted = [...scenes].sort((a, b) => a.sort_order - b.sort_order);
  const index = sorted.findIndex((scene) => scene.id === sceneId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
  const current = sorted[index];
  const target = sorted[targetIndex];
  onMutation("Sıra güncellendi.", "journey_scenes", "bulk_update", {
    rows: [
      { id: current.id, sort_order: target.sort_order },
      { id: target.id, sort_order: current.sort_order },
    ],
  });
}

function moveSceneTo(scenes: StudioScene[], draggedId: string, targetId: string, onMutation: ContentStudioMutation) {
  const sorted = [...scenes].sort((a, b) => a.sort_order - b.sort_order);
  const dragged = sorted.find((scene) => scene.id === draggedId);
  const targetIndex = sorted.findIndex((scene) => scene.id === targetId);
  if (!dragged || targetIndex < 0) return;

  const next = sorted.filter((scene) => scene.id !== draggedId);
  next.splice(targetIndex, 0, dragged);

  onMutation("Sahne sırası sürükle-bırak ile güncellendi.", "journey_scenes", "bulk_update", {
    rows: next.map((scene, index) => ({ id: scene.id, sort_order: (index + 1) * 10 })),
  });
}

function moveBlock(blocks: StudioContentBlock[], blockId: string, direction: "up" | "down", onMutation: ContentStudioMutation) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);
  const index = sorted.findIndex((block) => block.id === blockId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
  const current = sorted[index];
  const target = sorted[targetIndex];
  onMutation("Blok sırası güncellendi.", "journey_scene_content_blocks", "bulk_update", {
    rows: [
      { id: current.id, sort_order: target.sort_order },
      { id: target.id, sort_order: current.sort_order },
    ],
  });
}

function moveBlockTo(blocks: StudioContentBlock[], draggedId: string, targetId: string, onMutation: ContentStudioMutation) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);
  const dragged = sorted.find((block) => block.id === draggedId);
  const targetIndex = sorted.findIndex((block) => block.id === targetId);
  if (!dragged || targetIndex < 0) return;

  const next = sorted.filter((block) => block.id !== draggedId);
  next.splice(targetIndex, 0, dragged);

  onMutation("Blok sırası sürükle-bırak ile güncellendi.", "journey_scene_content_blocks", "bulk_update", {
    rows: next.map((block, index) => ({ id: block.id, sort_order: (index + 1) * 10 })),
  });
}

function toLocalDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function downloadBackup(data: ContentStudioData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `content-studio-backup-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Bilinmeyen hata.";
}
