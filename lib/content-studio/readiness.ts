import type { ContentStudioData, StudioScene } from "@/lib/content-studio/types";

export type ReadinessIssue = {
  code:
    | "chapter_title_missing"
    | "chapter_has_no_following_scene"
    | "chapter_sequence_empty"
    | "chapter_has_task_content"
    | "chapter_sort_collision"
    | "locked_chapter_followed_by_open_scene"
    | "duplicate_scene_slug"
    | "dependency_self_reference"
    | "dependency_missing_scene"
    | "dependency_cycle"
    | "unlock_rule_missing_scene"
    | "unlock_rule_missing_requirement"
    | "orphaned_relation"
    | "mini_game_reward_missing"
    | "task_block_reward_missing"
    | "task_relation_on_non_task";
  severity: "error" | "warning";
  sceneId: string;
  sceneSlug: string;
  message: string;
};

export function getContentReadinessIssues(data: ContentStudioData): ReadinessIssue[] {
  return [
    ...getChapterIssues(data),
    ...getSceneIdentityIssues(data),
    ...getDependencyIssues(data),
    ...getRelationIssues(data),
  ];
}

function getChapterIssues(data: ContentStudioData) {
  const issues: ReadinessIssue[] = [];
  const chapters = data.scenes.filter((scene) => scene.type === "chapter");
  const activeScenes = data.scenes.filter((scene) => scene.is_active).toSorted(compareScenes);

  chapters.forEach((chapter) => {
    if (!chapter.title.trim()) {
      issues.push(buildIssue(chapter, "chapter_title_missing", "error", "Bölüm başlığı boş olamaz."));
    }

    if (chapter.is_active) {
      const chapterIndex = activeScenes.findIndex((scene) => scene.id === chapter.id);
      const laterNormalScene = activeScenes.slice(chapterIndex + 1).find((scene) => scene.type !== "chapter");
      if (!laterNormalScene) {
        issues.push(buildIssue(chapter, "chapter_has_no_following_scene", "error", "Aktif bölümden sonra en az bir aktif normal sahne bulunmalı."));
      }

      const collidingScene = activeScenes.find((scene) => scene.id !== chapter.id && scene.sort_order === chapter.sort_order);
      if (collidingScene) {
        issues.push(buildIssue(chapter, "chapter_sort_collision", "error", `Sort order ${chapter.sort_order}, ${collidingScene.slug} ile çakışıyor.`));
      }

      const nextScene = activeScenes[chapterIndex + 1];
      if (chapter.is_locked && nextScene && !nextScene.is_locked) {
        issues.push(buildIssue(chapter, "locked_chapter_followed_by_open_scene", "warning", `Kilitli bölümün hemen ardından açık ${nextScene.slug} sahnesi geliyor.`));
      }
    }

    const attachedKinds = [
      data.contentBlocks.some((block) => block.scene_slug === chapter.slug && block.block_type === "photo_task") ? "photo task" : null,
      data.miniGames.some((game) => game.scene_slug === chapter.slug) ? "mini game" : null,
      data.rewards.some((reward) => reward.scene_slug === chapter.slug) ? "reward" : null,
    ].filter(Boolean);
    if (attachedKinds.length > 0) {
      issues.push(buildIssue(chapter, "chapter_has_task_content", "warning", `Bölüme jenerikte kullanılmayan ${attachedKinds.join(", ")} içeriği bağlı.`));
    }
  });

  const activeChapters = activeScenes.filter((scene) => scene.type === "chapter");
  for (let index = 0; index < activeChapters.length - 1; index += 1) {
    const currentChapter = activeChapters[index];
    const nextChapter = activeChapters[index + 1];
    const currentIndex = activeScenes.findIndex((scene) => scene.id === currentChapter.id);
    const nextIndex = activeScenes.findIndex((scene) => scene.id === nextChapter.id);
    if (!activeScenes.slice(currentIndex + 1, nextIndex).some((scene) => scene.type !== "chapter")) {
      issues.push(buildIssue(nextChapter, "chapter_sequence_empty", "warning", `${currentChapter.slug} ile bu bölüm arasında normal sahne yok.`));
    }
  }

  return issues;
}

function getSceneIdentityIssues(data: ContentStudioData) {
  const issues: ReadinessIssue[] = [];
  const scenesBySlug = groupBy(data.scenes, (scene) => scene.slug);
  scenesBySlug.forEach((scenes, slug) => {
    if (scenes.length < 2) return;
    scenes.forEach((scene) => issues.push(buildIssue(scene, "duplicate_scene_slug", "error", `${slug} slug değeri birden fazla sahnede kullanılıyor.`)));
  });
  return issues;
}

function getDependencyIssues(data: ContentStudioData) {
  const issues: ReadinessIssue[] = [];
  const sceneBySlug = new Map(data.scenes.map((scene) => [scene.slug, scene]));
  const adjacency = new Map<string, Set<string>>();

  const addEdge = (triggerSlug: string, targetSlug: string) => {
    const targets = adjacency.get(triggerSlug) ?? new Set<string>();
    targets.add(targetSlug);
    adjacency.set(triggerSlug, targets);
  };

  data.dependencies.forEach((dependency) => {
    const trigger = sceneBySlug.get(dependency.trigger_scene_slug);
    const target = sceneBySlug.get(dependency.target_scene_slug);
    if (!trigger || !target) {
      issues.push(buildLooseIssue(target ?? trigger, dependency.target_scene_slug, "dependency_missing_scene", "error", `Dependency ilişkisi eksik sahneye bağlı: ${dependency.trigger_scene_slug} -> ${dependency.target_scene_slug}.`));
      return;
    }
    if (trigger.slug === target.slug) {
      issues.push(buildIssue(target, "dependency_self_reference", "error", "Sahne kendisine dependency olarak bağlanamaz."));
    }
    addEdge(trigger.slug, target.slug);
  });

  data.unlockRules.forEach((rule) => {
    const target = sceneBySlug.get(rule.target_scene_slug);
    if (!target) {
      issues.push(buildLooseIssue(undefined, rule.target_scene_slug, "unlock_rule_missing_scene", "error", "Unlock rule hedef sahnesi bulunamadı."));
      return;
    }
    rule.required_scene_slugs.forEach((requiredSlug) => {
      const required = sceneBySlug.get(requiredSlug);
      if (!required) {
        issues.push(buildIssue(target, "unlock_rule_missing_requirement", "error", `Unlock rule içinde bulunmayan ${requiredSlug} sahnesi isteniyor.`));
        return;
      }
      if (required.slug === target.slug) {
        issues.push(buildIssue(target, "dependency_self_reference", "error", "Sahne kendi tamamlanma durumuna bağlı olamaz."));
      }
      addEdge(required.slug, target.slug);
    });
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const reportedCycles = new Set<string>();

  const visit = (slug: string) => {
    if (visited.has(slug)) return;
    visiting.add(slug);
    stack.push(slug);
    for (const targetSlug of adjacency.get(slug) ?? []) {
      if (visiting.has(targetSlug)) {
        const startIndex = stack.indexOf(targetSlug);
        const cycle = [...stack.slice(startIndex), targetSlug];
        const cycleKey = [...new Set(cycle)].sort().join("|");
        if (!reportedCycles.has(cycleKey)) {
          reportedCycles.add(cycleKey);
          const scene = sceneBySlug.get(targetSlug);
          issues.push(buildLooseIssue(scene, targetSlug, "dependency_cycle", "error", `Circular dependency bulundu: ${cycle.join(" -> ")}.`));
        }
      } else {
        visit(targetSlug);
      }
    }
    stack.pop();
    visiting.delete(slug);
    visited.add(slug);
  };

  data.scenes.forEach((scene) => visit(scene.slug));
  return issues;
}

function getRelationIssues(data: ContentStudioData) {
  const issues: ReadinessIssue[] = [];
  const sceneBySlug = new Map(data.scenes.map((scene) => [scene.slug, scene]));
  const sceneById = new Map(data.scenes.map((scene) => [scene.id, scene]));
  const taskResponseIds = new Set(data.taskResponses.map((response) => response.id));
  const rewardIds = new Set(data.rewards.map((reward) => reward.id));

  const slugRelations: Array<{ label: string; sceneSlug: string }> = [
    ...data.contentBlocks.map((item) => ({ label: "İçerik bloğu", sceneSlug: item.scene_slug })),
    ...data.unlockSchedule.map((item) => ({ label: "Unlock schedule", sceneSlug: item.scene_slug })),
    ...data.mediaRequirements.map((item) => ({ label: "Medya gereksinimi", sceneSlug: item.scene_slug })),
    ...data.miniGames.map((item) => ({ label: "Mini oyun", sceneSlug: item.scene_slug })),
    ...data.rewards.map((item) => ({ label: "Reward", sceneSlug: item.scene_slug })),
  ];
  slugRelations.forEach(({ label, sceneSlug }) => {
    if (!sceneBySlug.has(sceneSlug)) {
      issues.push(buildLooseIssue(undefined, sceneSlug, "orphaned_relation", "error", `${label}, bulunmayan bir sahneye bağlı.`));
    }
  });

  const idRelations: Array<{ label: string; sceneId: string }> = [
    ...data.progress.map((item) => ({ label: "Progress", sceneId: item.scene_id })),
    ...data.taskResponses.map((item) => ({ label: "Task response", sceneId: item.scene_id })),
    ...data.rewardClaims.map((item) => ({ label: "Reward claim", sceneId: item.scene_id })),
  ];
  idRelations.forEach(({ label, sceneId }) => {
    if (!sceneById.has(sceneId)) {
      issues.push({ code: "orphaned_relation", severity: "error", sceneId, sceneSlug: sceneId, message: `${label}, bulunmayan bir scene id değerine bağlı.` });
    }
  });

  data.rewardClaims.forEach((claim) => {
    const scene = sceneById.get(claim.scene_id);
    if (!rewardIds.has(claim.reward_id)) {
      issues.push(buildLooseIssue(scene, claim.scene_id, "orphaned_relation", "error", "Reward claim, bulunmayan bir reward kaydına bağlı."));
    }
    if (claim.task_response_id && !taskResponseIds.has(claim.task_response_id)) {
      issues.push(buildLooseIssue(scene, claim.scene_id, "orphaned_relation", "error", "Reward claim, bulunmayan bir task response kaydına bağlı."));
    }
  });

  data.miniGames.forEach((game) => {
    const scene = sceneBySlug.get(game.scene_slug);
    if (!scene) return;
    if (scene.type !== "task") {
      issues.push(buildIssue(scene, "task_relation_on_non_task", "warning", "Mini oyun task olmayan bir sahneye bağlı."));
    }
    if (game.reward_key && !data.rewards.some((reward) => reward.scene_slug === game.scene_slug && reward.reward_key === game.reward_key)) {
      issues.push(buildIssue(scene, "mini_game_reward_missing", "error", `Mini oyunun ${game.reward_key} reward anahtarı bu sahnede bulunamadı.`));
    }
  });

  data.contentBlocks.forEach((block) => {
    const scene = sceneBySlug.get(block.scene_slug);
    if (!scene) return;
    if (block.block_type === "photo_task" && scene.type !== "task") {
      issues.push(buildIssue(scene, "task_relation_on_non_task", "warning", "Photo task bloğu task olmayan bir sahneye bağlı."));
    }
    const rewardKey = block.metadata.reward_key ?? block.metadata.rewardKey;
    if (typeof rewardKey === "string" && !data.rewards.some((reward) => reward.scene_slug === block.scene_slug && reward.reward_key === rewardKey)) {
      issues.push(buildIssue(scene, "task_block_reward_missing", "error", `İçerik bloğunun ${rewardKey} reward anahtarı bu sahnede bulunamadı.`));
    }
  });

  return issues;
}

function groupBy<T, K>(items: T[], keySelector: (item: T) => K) {
  const groups = new Map<K, T[]>();
  items.forEach((item) => groups.set(keySelector(item), [...(groups.get(keySelector(item)) ?? []), item]));
  return groups;
}

function compareScenes(left: StudioScene, right: StudioScene) {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

function buildIssue(scene: StudioScene, code: ReadinessIssue["code"], severity: ReadinessIssue["severity"], message: string): ReadinessIssue {
  return { code, severity, sceneId: scene.id, sceneSlug: scene.slug, message };
}

function buildLooseIssue(scene: StudioScene | undefined, fallbackSlug: string, code: ReadinessIssue["code"], severity: ReadinessIssue["severity"], message: string): ReadinessIssue {
  return { code, severity, sceneId: scene?.id ?? fallbackSlug, sceneSlug: scene?.slug ?? fallbackSlug, message };
}
