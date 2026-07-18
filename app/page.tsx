"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type View = "today" | "week" | "month" | "calendar" | "review" | "settings";
type Priority = "P1" | "P2" | "P3";
type Theme = "light" | "dark" | "mint" | "custom";

type Area = {
  id: string;
  name: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  notes: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  area: string;
  parentId?: string;
  weight?: number;
  done: boolean;
  createdAt: string;
  date?: string;
  scope?: string;
};

type Review = {
  id: string;
  period: "week" | "month";
  anchor: string;
  wins: string;
  blocks: string;
  next: string;
  createdAt: string;
  doneCount?: number;
  totalCount?: number;
};

type UserData = {
  tasks: Task[];
  reviews: Review[];
  areas?: Area[];
  onboardingCompleted?: boolean;
};

type CustomTheme = {
  accent: string;
  background: string;
  surface: string;
  density: "comfortable" | "compact";
};

type Draft = {
  title: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  area: string;
  notes: string;
  weight?: number;
  children: ChildDraft[];
};

type ChildDraft = {
  title: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  area: string;
  weight: number;
};

const storeKey = "itodo.local.v2";
const legacyStoreKey = "itodo.local.v1";
const themeKey = "itodo.theme.v1";
const customThemeKey = "itodo.custom-theme.v1";
const demoAccountName = "体验账号";
const today = new Date();
const todayKey = toKey(today);

const defaultAreas: Area[] = [
  { id: "work-type", name: "工作", color: "#f97316" },
  { id: "study", name: "学习", color: "#3b82f6" },
  { id: "life", name: "生活", color: "#22c55e" },
  { id: "personal", name: "个人", color: "#a855f7" },
];

const defaultCustomTheme: CustomTheme = {
  accent: "#24a47a",
  background: "#f7f9fb",
  surface: "#ffffff",
  density: "comfortable",
};

function makeTask(input: {
  title: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  area: string;
  done: boolean;
  parentId?: string;
  notes?: string;
  weight?: number;
}): Task {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    notes: input.notes || "",
    startDate: input.startDate,
    endDate: input.endDate,
    priority: input.priority,
    area: input.area,
    parentId: input.parentId,
    weight: input.weight,
    done: input.done,
    createdAt: new Date().toISOString(),
  };
}

function createTemplateTasks(): Task[] {
  const tomorrowKey = toKey(addDays(today, 1));
  const dayAfterTomorrowKey = toKey(addDays(today, 2));
  const thirdDayKey = toKey(addDays(today, 3));
  const fourthDayKey = toKey(addDays(today, 4));
  const project = makeTask({
    title: "准备需求评审",
    notes: "示例工作项目。",
    startDate: todayKey,
    endDate: fourthDayKey,
    priority: "P1",
    area: "work-type",
    done: false,
  });
  const projectChild = makeTask({
    title: "整理评审问题",
    notes: "示例工作子计划。",
    startDate: todayKey,
    endDate: tomorrowKey,
    priority: "P1",
    area: "work-type",
    parentId: project.id,
    weight: 50,
    done: false,
  });
  const focusTask = makeTask({
    title: "英语阅读 20 分钟",
    notes: "示例学习计划。",
    startDate: todayKey,
    endDate: todayKey,
    priority: "P2",
    area: "study",
    done: true,
  });
  const agendaTask = makeTask({
    title: "梳理会议议程",
    notes: "示例工作计划。",
    startDate: todayKey,
    endDate: todayKey,
    priority: "P1",
    area: "work-type",
    done: false,
  });
  const personalTodayTask = makeTask({
    title: "确认本周安排",
    notes: "示例个人计划。",
    startDate: todayKey,
    endDate: todayKey,
    priority: "P2",
    area: "personal",
    done: false,
  });
  const followUpTask = makeTask({
    title: "同步评审结论",
    notes: "示例工作子计划。",
    startDate: tomorrowKey,
    endDate: tomorrowKey,
    priority: "P2",
    area: "work-type",
    parentId: project.id,
    weight: 50,
    done: false,
  });
  const weeklyTask = makeTask({
    title: "下班后慢跑 30 分钟",
    notes: "示例生活计划。",
    startDate: toKey(addDays(today, 1)),
    endDate: toKey(addDays(today, 1)),
    priority: "P3",
    area: "life",
    done: false,
  });
  const personalTask = makeTask({
    title: "整理周末采购清单",
    notes: "示例个人计划。",
    startDate: fourthDayKey,
    endDate: fourthDayKey,
    priority: "P3",
    area: "personal",
    done: false,
  });
  const reportTask = makeTask({
    title: "完成周报草稿",
    notes: "示例工作计划。",
    startDate: thirdDayKey,
    endDate: thirdDayKey,
    priority: "P2",
    area: "work-type",
    done: false,
  });
  const notesTask = makeTask({
    title: "整理课程笔记",
    notes: "示例学习计划。",
    startDate: dayAfterTomorrowKey,
    endDate: dayAfterTomorrowKey,
    priority: "P2",
    area: "study",
    done: false,
  });
  const appointmentTask = makeTask({
    title: "预约牙医检查",
    notes: "示例生活计划。",
    startDate: fourthDayKey,
    endDate: fourthDayKey,
    priority: "P3",
    area: "life",
    done: false,
  });
  return [project, projectChild, followUpTask, focusTask, agendaTask, personalTodayTask, weeklyTask, personalTask, reportTask, notesTask, appointmentTask];
}

function createTemplateReviews(): Review[] {
  const currentWeek = toKey(startOfWeek(today));
  const previousWeek = toKey(addDays(startOfWeek(today), -7));
  return [
    {
      id: crypto.randomUUID(),
      period: "week",
      anchor: currentWeek,
      wins: "完成了本周重点梳理，并留出了一段专注阅读时间。",
      blocks: "运动安排还没有落实到具体时段。",
      next: "先给运动计划确定一个固定时间。",
      createdAt: new Date().toISOString(),
      doneCount: 2,
      totalCount: 3,
    },
    {
      id: crypto.randomUUID(),
      period: "week",
      anchor: previousWeek,
      wins: "完成预算整理，清理了不再需要的订阅。",
      blocks: "计划安排得过满，留白时间不足。",
      next: "下周每天只保留一个最重要目标。",
      createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      doneCount: 3,
      totalCount: 4,
    },
  ];
}

function emptyDraft(area = defaultAreas[0].id, date = todayKey): Draft {
  return {
    title: "",
    startDate: date,
    endDate: date,
    priority: "P2",
    area,
    notes: "",
    children: [],
  };
}

function toKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatShort(key: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${key}T00:00:00`));
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function priorityRank(priority: Priority) {
  return { P1: 0, P2: 1, P3: 2 }[priority];
}

function sortPlans(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority) return byPriority;
    return a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt);
  });
}

function overlaps(task: Task, start: string, end: string) {
  return task.startDate <= end && task.endDate >= start;
}

function taskProgress(task: Task, allTasks: Task[]) {
  const children = allTasks.filter((item) => item.parentId === task.id);
  if (!children.length) return task.done ? 100 : 0;
  const total = children.reduce((sum, child) => sum + (child.weight ?? 0), 0);
  if (!total) return 0;
  const completed = children.filter((child) => child.done).reduce((sum, child) => sum + (child.weight ?? 0), 0);
  return Math.round((completed / total) * 100);
}

function normalizeOnlyChildWeights(items: Task[]) {
  const childCounts = new Map<string, number>();
  items.forEach((task) => {
    if (task.parentId) childCounts.set(task.parentId, (childCounts.get(task.parentId) || 0) + 1);
  });
  return items.map((task) => task.parentId && childCounts.get(task.parentId) === 1 ? { ...task, weight: 100 } : task);
}

function boundRange(start: string, end: string, minimum: string, maximum: string) {
  const boundedStart = start < minimum ? minimum : start > maximum ? maximum : start;
  const boundedEnd = end < minimum ? minimum : end > maximum ? maximum : end;
  return boundedEnd < boundedStart
    ? { startDate: boundedStart, endDate: boundedStart }
    : { startDate: boundedStart, endDate: boundedEnd };
}

function areaName(areas: Area[], id: string) {
  return areas.find((area) => area.id === id)?.name || id || "未设置";
}

function areaColor(areas: Area[], id: string) {
  return areas.find((area) => area.id === id)?.color || "#64748b";
}

function paletteColor(index: number) {
  const colors = ["#0ea5e9", "#f97316", "#14b8a6", "#ec4899", "#6366f1", "#84cc16"];
  return colors[index % colors.length];
}

function normalizeTask(raw: Task): Task {
  const startDate = raw.startDate || raw.date || todayKey;
  const endDate = raw.endDate || raw.startDate || raw.date || todayKey;
  const matchingDefault = defaultAreas.find(
    (area) => area.id === raw.area || area.name === raw.area,
  );
  const legacyArea = { work: "study", health: "life", review: "personal" }[raw.area];
  return {
    ...raw,
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
    area: matchingDefault?.id || legacyArea || raw.area || "",
    priority: raw.priority || "P2",
    notes: raw.notes || "",
  };
}

function normalizeAreas(tasks: Task[], savedAreas?: Area[]) {
  const byId = new Map<string, Area>();
  [...defaultAreas, ...(savedAreas || []).filter((area) => !["work", "health", "review"].includes(area.id))].forEach((area) => byId.set(area.id, area));
  tasks.forEach((task, index) => {
    if (task.area && !byId.has(task.area)) {
      byId.set(task.area, {
        id: task.area,
        name: task.area,
        color: paletteColor(index),
      });
    }
  });
  return Array.from(byId.values());
}

function loadStore(): Record<string, UserData> {
  if (typeof window === "undefined") return {};
  try {
    const next = localStorage.getItem(storeKey);
    if (next) return JSON.parse(next);
    return JSON.parse(localStorage.getItem(legacyStoreKey) || "{}");
  } catch {
    return {};
  }
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [activeUser, setActiveUser] = useState("");
  const [view, setView] = useState<View>("today");
  const [anchor, setAnchor] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [areas, setAreas] = useState<Area[]>(defaultAreas);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState("");
  const [returnToId, setReturnToId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [reviewDraft, setReviewDraft] = useState({ wins: "", blocks: "", next: "" });
  const [editingReviewId, setEditingReviewId] = useState("");
  const [reviewEditorOpen, setReviewEditorOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [customTheme, setCustomTheme] = useState<CustomTheme>(defaultCustomTheme);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem(themeKey) as Theme | null;
    if (savedTheme) setTheme(savedTheme);
    try {
      const savedCustomTheme = localStorage.getItem(customThemeKey);
      if (savedCustomTheme) setCustomTheme({ ...defaultCustomTheme, ...JSON.parse(savedCustomTheme) });
    } catch {
      setCustomTheme(defaultCustomTheme);
    }
    const last = localStorage.getItem("itodo.lastUser") || "";
    if (last) signIn(last);
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    const all = loadStore();
    all[activeUser] = { tasks, reviews, areas, onboardingCompleted };
    localStorage.setItem(storeKey, JSON.stringify(all));
    localStorage.setItem("itodo.lastUser", activeUser);
  }, [activeUser, tasks, reviews, areas, onboardingCompleted]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = customTheme.density;
    const rootStyle = document.documentElement.style;
    ["--accent", "--accent-dark", "--accent-soft", "--bg", "--surface", "--surface-soft"].forEach((name) => rootStyle.removeProperty(name));
    if (theme === "custom") {
      rootStyle.setProperty("--accent", customTheme.accent);
      rootStyle.setProperty("--accent-dark", customTheme.accent);
      rootStyle.setProperty("--accent-soft", `color-mix(in srgb, ${customTheme.accent} 12%, ${customTheme.surface})`);
      rootStyle.setProperty("--bg", customTheme.background);
      rootStyle.setProperty("--surface", customTheme.surface);
      rootStyle.setProperty("--surface-soft", `color-mix(in srgb, ${customTheme.surface} 88%, ${customTheme.background})`);
    }
    localStorage.setItem(themeKey, theme);
    localStorage.setItem(customThemeKey, JSON.stringify(customTheme));
  }, [theme, customTheme]);

  function updateCustomTheme(changes: Partial<CustomTheme>) {
    setCustomTheme((current) => ({ ...current, ...changes }));
    setTheme("custom");
  }

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function signIn(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const all = loadStore();
    const existingData = all[cleanName];
    const isDemoAccount = cleanName === demoAccountName;
    const isNewUser = !existingData || isDemoAccount;
    const data = isDemoAccount
      ? { tasks: createTemplateTasks(), reviews: createTemplateReviews(), areas: defaultAreas, onboardingCompleted: false }
      : existingData || { tasks: createTemplateTasks(), reviews: [], areas: defaultAreas, onboardingCompleted: false };
    const nextTasks = data.tasks.map(normalizeTask);
    const nextAreas = normalizeAreas(nextTasks, data.areas);
    setActiveUser(cleanName);
    setUsername(cleanName);
    setTasks(nextTasks);
    setReviews(data.reviews);
    setAreas(nextAreas);
    setDraft(emptyDraft(nextAreas[0]?.id || "work", todayKey));
    setOnboardingCompleted(isNewUser ? false : data.onboardingCompleted ?? true);
    setOnboardingStep(0);
    setOnboardingOpen(isNewUser);
  }

  function finishOnboarding() {
    setOnboardingCompleted(true);
    setOnboardingOpen(false);
  }

  function changeOnboardingStep(nextStep: number) {
    const step = onboardingSteps[nextStep];
    if (!step) return;
    setOnboardingStep(nextStep);
    setView(step.view);
    setAnchor(today);
  }

  function openNewPlan(date = toKey(anchor)) {
    setEditingId("");
    setDraft(emptyDraft(areas[0]?.id || "work", date));
    setEditorOpen(true);
  }

  function editPlan(task: Task) {
    setEditingId(task.id);
    setDraft({
      title: task.title,
      startDate: task.startDate,
      endDate: task.endDate,
      priority: task.priority,
      area: task.area,
      notes: task.notes,
      weight: task.weight ?? 100,
      children: [],
    });
    setEditorOpen(true);
  }

  function editChildFromParent(task: Task) {
    if (task.parentId) setReturnToId(task.parentId);
    editPlan(task);
  }

  function editParentFromChild(task: Task) {
    setReturnToId("");
    editPlan(task);
  }

  function closeEditor() {
    const returnTask = returnToId ? tasks.find((task) => task.id === returnToId) : undefined;
    setReturnToId("");
    if (returnTask) {
      editPlan(returnTask);
      return;
    }
    setEditingId("");
    setDraft(emptyDraft(areas[0]?.id || "study", toKey(anchor)));
    setEditorOpen(false);
  }

  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const original = editingId ? tasks.find((task) => task.id === editingId) : undefined;
    const parent = original?.parentId ? tasks.find((task) => task.id === original.parentId) : undefined;
    const requestedEnd = draft.endDate < draft.startDate ? draft.startDate : draft.endDate;
    const ownRange = parent
      ? boundRange(draft.startDate, requestedEnd, parent.startDate, parent.endDate)
      : { startDate: draft.startDate, endDate: requestedEnd };
    const startDate = ownRange.startDate;
    const endDate = ownRange.endDate;
    const parentId = editingId || crypto.randomUUID();
    const childTasks = draft.children.filter((child) => child.title.trim()).map((child) =>
      {
        const childRange = boundRange(
          child.startDate,
          child.endDate < child.startDate ? child.startDate : child.endDate,
          startDate,
          endDate,
        );
        return makeTask({
          title: child.title.trim(),
          startDate: childRange.startDate,
          endDate: childRange.endDate,
          priority: child.priority,
          area: child.area,
          parentId,
          weight: child.weight,
          done: false,
        });
      },
    );
    if (editingId) {
      setTasks((items) =>
        normalizeOnlyChildWeights([
          ...items.map((task) =>
            task.id === editingId
              ? { ...task, title: draft.title.trim(), startDate, endDate, priority: draft.priority, area: draft.area, notes: draft.notes.trim(), weight: parent ? draft.weight ?? 0 : task.weight }
              : task.parentId === editingId
                ? { ...task, ...boundRange(task.startDate, task.endDate, startDate, endDate) }
                : task,
          ),
          ...childTasks,
        ]),
      );
      setNotice("计划已更新");
    } else {
      setTasks((items) => normalizeOnlyChildWeights([
        {
          ...makeTask({
          title: draft.title.trim(),
          startDate,
          endDate,
          priority: draft.priority,
          area: draft.area,
          done: false,
          notes: draft.notes.trim(),
          }),
          id: parentId,
        },
        ...childTasks,
        ...items,
      ]));
      setNotice("计划已添加");
    }
    const returnTask = returnToId ? tasks.find((task) => task.id === returnToId) : undefined;
    setReturnToId("");
    if (returnTask) {
      editPlan(returnTask);
      return;
    }
    setEditingId("");
    setDraft(emptyDraft(areas[0]?.id || "study", startDate));
    setEditorOpen(false);
    setAnchor(new Date(`${startDate}T00:00:00`));
  }

  function addArea(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const existing = areas.find((area) => area.name === cleanName);
    if (existing) {
      setDraft((current) => ({ ...current, area: existing.id }));
      return;
    }
    const nextArea = {
      id: `area-${crypto.randomUUID()}`,
      name: cleanName,
      color: paletteColor(areas.length),
    };
    setAreas((items) => [...items, nextArea]);
    setDraft((current) => ({ ...current, area: nextArea.id }));
    setNotice("类型已添加");
  }

  function toggleTask(id: string) {
    setTasks((items) =>
      items.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  function updatePlanInline(id: string, changes: Partial<Pick<Task, "title" | "priority" | "startDate" | "endDate">>) {
    setTasks((items) => {
      const target = items.find((task) => task.id === id);
      if (!target) return items;
      const next = { ...target, ...changes };
      const parent = next.parentId ? items.find((task) => task.id === next.parentId) : undefined;
      const requestedEnd = next.endDate < next.startDate ? next.startDate : next.endDate;
      const range = parent
        ? boundRange(next.startDate, requestedEnd, parent.startDate, parent.endDate)
        : { startDate: next.startDate, endDate: requestedEnd };
      return items.map((task) =>
        task.id === id
          ? { ...next, ...range }
          : task.parentId === id
            ? { ...task, ...boundRange(task.startDate, task.endDate, range.startDate, range.endDate) }
            : task,
      );
    });
  }

  function deleteTask(id: string) {
    const ids = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      tasks.forEach((task) => {
        if (task.parentId && ids.has(task.parentId) && !ids.has(task.id)) {
          ids.add(task.id);
          changed = true;
        }
      });
    }
    setTasks((items) => items.filter((task) => !ids.has(task.id)));
    setNotice("计划已删除");
  }

  function addReview(period: "week" | "month") {
    if (!reviewDraft.wins && !reviewDraft.blocks && !reviewDraft.next) return;
    const doneCount = visibleTasks.filter((task) => task.done).length;
    const totalCount = visibleTasks.length;
    if (editingReviewId) {
      setReviews((items) => items.map((review) => review.id === editingReviewId ? { ...review, wins: reviewDraft.wins, blocks: reviewDraft.blocks, next: reviewDraft.next } : review));
      setEditingReviewId("");
      setReviewEditorOpen(false);
      setReviewDraft({ wins: "", blocks: "", next: "" });
      setNotice("复盘已更新");
      return;
    }
    setReviews((items) => [
      {
        id: crypto.randomUUID(),
        period,
        anchor: toKey(anchor),
        wins: reviewDraft.wins,
        blocks: reviewDraft.blocks,
        next: reviewDraft.next,
        createdAt: new Date().toISOString(),
        doneCount,
        totalCount,
      },
      ...items,
    ]);
    setReviewDraft({ wins: "", blocks: "", next: "" });
    setNotice(period === "week" ? "周复盘已保存" : "月复盘已保存");
  }

  function editReview(review: Review) {
    setEditingReviewId(review.id);
    setReviewDraft({ wins: review.wins, blocks: review.blocks, next: review.next });
    setReviewEditorOpen(true);
  }

  function deleteReview(id: string) {
    setReviews((items) => items.filter((review) => review.id !== id));
    setNotice("复盘已删除");
  }

  function moveAnchor(direction: -1 | 1) {
    if (view === "today") setAnchor((current) => addDays(current, direction));
    else if (view === "week" || view === "review") setAnchor((current) => addDays(current, direction * 7));
    else if (view !== "settings") setAnchor((current) => addMonths(current, direction));
  }

  const weekDays = useMemo(() => {
    const first = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, index) => addDays(first, index));
  }, [anchor]);

  const monthDays = useMemo(() => {
    const first = startOfMonth(anchor);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [anchor]);

  const range = useMemo(() => {
    if (view === "today") {
      const key = toKey(anchor);
      return { start: key, end: key };
    }
    if (view === "week" || view === "review") {
      return { start: toKey(weekDays[0]), end: toKey(weekDays[6]) };
    }
    const first = startOfMonth(anchor);
    return { start: toKey(first), end: toKey(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)) };
  }, [anchor, view, weekDays]);

  const parentPlanIds = useMemo(
    () => new Set(tasks.flatMap((task) => task.parentId ? [task.parentId] : [])),
    [tasks],
  );

  const visibleTasks = useMemo(
    () => sortPlans(tasks.filter((task) => (view === "today" || view === "week" ? !parentPlanIds.has(task.id) : !task.parentId) && overlaps(task, range.start, range.end))),
    [tasks, range, view, parentPlanIds],
  );

  if (!activeUser) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">iTodo local planner</p>
            <h1>把计划拆成能推进的子计划。</h1>
            <p className="login-copy">数据只保存在当前浏览器。输入任意用户名即可进入本地账号。</p>
          </div>
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              signIn(username);
            }}
          >
            <label htmlFor="username">用户名</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="例如 martin" />
            <button type="submit">登录本地账号</button>
            <button type="button" className="test-account-button" onClick={() => signIn(demoAccountName)}>使用测试账号</button>
            <p className="test-account-copy">每次登录测试账号都会重置示例计划与引导。</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">i</span>
          <div>
            <strong>iTodo</strong>
            <small>{activeUser}</small>
          </div>
        </div>
        <button className={onboardingOpen && onboardingSteps[onboardingStep].target === "new-plan" ? "new-plan-button tour-target" : "new-plan-button"} onClick={() => openNewPlan()}>
          + 新增计划
        </button>
        <nav className="nav-list" aria-label="主导航">
          {[
            ["today", "今日"],
            ["week", "本周"],
            ["month", "本月"],
            ["calendar", "日历"],
            ["review", "复盘"],
            ["settings", "设置"],
          ].map(([key, label]) => (
            <button key={key} className={`${view === key ? "active" : ""}${onboardingOpen && onboardingSteps[onboardingStep].target === key ? " tour-target" : ""}`} onClick={() => { const nextView = key as View; setView(nextView); if (nextView === "calendar") setAnchor(today); }}>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="theme-switcher" aria-label="主题切换">
            {(["light", "mint", "dark", "custom"] as Theme[]).map((item) => (
              <button key={item} className={theme === item ? "selected" : ""} onClick={() => setTheme(item)}>
                {themeLabel(item)}
              </button>
            ))}
          </div>
          <p>本地存储，离线可用</p>
          <button
            className="ghost"
            onClick={() => {
              localStorage.removeItem("itodo.lastUser");
              setActiveUser("");
            }}
          >
            退出登录
          </button>
        </div>
      </aside>

      <section className="workspace">
        {notice ? <div className="toast">{notice}</div> : null}
        <header className="topbar">
          <div>
            <p className="eyebrow">{headerDateLabel(view, anchor)}</p>
            <h1>{viewTitle(view, anchor)}</h1>
          </div>
          {view !== "settings" ? <div className="date-controls">
            <button onClick={() => moveAnchor(-1)}>{previousLabel(view)}</button>
            <button onClick={() => setAnchor(today)}>今天</button>
            <button onClick={() => moveAnchor(1)}>{nextLabel(view)}</button>
          </div> : null}
        </header>

        <section className="single-panel">
          <div className="primary-panel">
            {view === "settings" ? (
              <SettingsPanel theme={theme} customTheme={customTheme} onThemeChange={setTheme} onCustomThemeChange={updateCustomTheme} />
            ) : view === "calendar" ? (
              <Calendar
                days={monthDays}
                anchor={anchor}
                tasks={tasks}
                areas={areas}
                onEdit={editPlan}
                onSelectDate={(date) => {
                  setAnchor(date);
                  setView("today");
                }}
              />
            ) : view === "review" ? (
              <ReviewPanel
                tasks={visibleTasks}
                allTasks={tasks.filter((task) => !task.parentId)}
                areas={areas}
                reviews={reviews}
                draft={reviewDraft}
                setDraft={setReviewDraft}
                addReview={addReview}
                editingReviewId={editingReviewId}
                onEditReview={editReview}
                onDeleteReview={deleteReview}
              />
            ) : view === "week" ? (
              <WeekTimeline
                days={weekDays}
                tasks={tasks}
                areas={areas}
                onToggle={toggleTask}
                onEdit={editPlan}
                onDelete={deleteTask}
              />
            ) : view === "month" ? (
              <MonthBoard
                tasks={visibleTasks}
                allTasks={tasks}
                areas={areas}
                onEdit={editPlan}
              />
            ) : (
              <TaskList
                title={dayListTitle(anchor)}
                tasks={visibleTasks}
                allTasks={tasks}
                areas={areas}
                onToggle={toggleTask}
                onEdit={editPlan}
                onDelete={deleteTask}
                onCreate={() => openNewPlan(toKey(anchor))}
              />
            )}
          </div>
        </section>
        {editorOpen ? (
          <div className="editor-backdrop" role="presentation" onMouseDown={() => setEditorOpen(false)}>
            <div className="editor-modal" role="dialog" aria-modal="true" aria-label={editingId ? "编辑计划" : "新增计划"} onMouseDown={(event) => event.stopPropagation()}>
              <PlanForm
                draft={draft}
                editing={Boolean(editingId)}
                currentTask={tasks.find((task) => task.id === editingId)}
                areas={areas}
                tasks={tasks}
                newAreaName={newAreaName}
                setNewAreaName={setNewAreaName}
                setDraft={setDraft}
                onSubmit={savePlan}
                onCancel={closeEditor}
                onAddArea={addArea}
                onEditChild={editChildFromParent}
                onEditParent={editParentFromChild}
              />
            </div>
          </div>
        ) : null}
        {reviewEditorOpen ? <ReviewEditorModal draft={reviewDraft} setDraft={setReviewDraft} onSave={addReview} onClose={() => { setEditingReviewId(""); setReviewDraft({ wins: "", blocks: "", next: "" }); setReviewEditorOpen(false); }} /> : null}
        {onboardingOpen ? <OnboardingModal step={onboardingStep} onStepChange={changeOnboardingStep} onFinish={finishOnboarding} /> : null}
      </section>
    </main>
  );
}

function viewTitle(view: View, anchor: Date) {
  const currentWeek = toKey(startOfWeek(anchor)) === toKey(startOfWeek(today));
  const currentMonth = anchor.getFullYear() === today.getFullYear() && anchor.getMonth() === today.getMonth();
  return {
    today: toKey(anchor) === todayKey ? "今日计划" : `${formatMonthDate(toKey(anchor))} 计划`,
    week: currentWeek ? "本周计划" : `${formatMonthDate(toKey(startOfWeek(anchor)))} 所在周`,
    month: currentMonth ? "本月计划" : `${monthTitle(anchor)} 计划`,
    calendar: "日历视图",
    review: "复盘",
    settings: "设置",
  }[view];
}

function dayListTitle(date: Date) {
  return toKey(date) === todayKey ? "今日计划" : `${formatShort(toKey(date))} 计划`;
}

function headerDateLabel(view: View, anchor: Date) {
  if (view === "month" || view === "calendar") return monthTitle(anchor);
  if (view === "settings") return "个性化工作区";
  if (view === "today") return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(anchor);
  if (view === "week") return toKey(startOfWeek(anchor)) === toKey(startOfWeek(today)) ? "当前周" : `${formatMonthDate(toKey(startOfWeek(anchor)))} - ${formatMonthDate(toKey(addDays(startOfWeek(anchor), 6)))}`;
  return "定期回顾";
}

function formatMonthDate(key: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(`${key}T00:00:00`));
}

function previousLabel(view: View) {
  if (view === "today") return "前一天";
  if (view === "month" || view === "calendar") return "上个月";
  return "上一周";
}

function nextLabel(view: View) {
  if (view === "today") return "后一天";
  if (view === "month" || view === "calendar") return "下个月";
  return "下一周";
}

function themeLabel(theme: Theme) {
  return { light: "白", mint: "绿", dark: "暗", custom: "自" }[theme];
}

function SettingsPanel({
  theme,
  customTheme,
  onThemeChange,
  onCustomThemeChange,
}: {
  theme: Theme;
  customTheme: CustomTheme;
  onThemeChange: (theme: Theme) => void;
  onCustomThemeChange: (changes: Partial<CustomTheme>) => void;
}) {
  const presets: { id: Theme; title: string; description: string; colors: string[] }[] = [
    { id: "light", title: "白色", description: "清爽、专注", colors: ["#f7f9fb", "#ffffff", "#24a47a"] },
    { id: "mint", title: "薄荷", description: "柔和、自然", colors: ["#f2faf7", "#ffffff", "#18a87c"] },
    { id: "dark", title: "深色", description: "低光环境", colors: ["#111817", "#17211f", "#54d6a8"] },
  ];
  return (
    <section className="settings-panel">
      <div className="settings-intro">
        <div>
          <p className="eyebrow">外观与偏好</p>
          <h2>让 iTodo 更像你的工作台</h2>
          <p>主题和显示密度会自动保存在当前浏览器。</p>
        </div>
      </div>
      <section className="settings-section">
        <div className="settings-section-head"><div><h3>主题预设</h3><p>一键切换常用配色。</p></div></div>
        <div className="theme-presets">
          {presets.map((preset) => (
            <button type="button" className={theme === preset.id ? "theme-preset selected" : "theme-preset"} key={preset.id} onClick={() => onThemeChange(preset.id)}>
              <span className="preset-swatch" aria-hidden="true">{preset.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
              <strong>{preset.title}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-head"><div><h3>自定义颜色</h3><p>修改任意颜色会自动切换到自定义主题。</p></div><span className={theme === "custom" ? "custom-status active" : "custom-status"}>{theme === "custom" ? "已启用" : "未启用"}</span></div>
        <div className="color-controls">
          <label><span>强调色</span><div><input type="color" value={customTheme.accent} onChange={(event) => onCustomThemeChange({ accent: event.target.value })} /><code>{customTheme.accent.toUpperCase()}</code></div></label>
          <label><span>页面背景</span><div><input type="color" value={customTheme.background} onChange={(event) => onCustomThemeChange({ background: event.target.value })} /><code>{customTheme.background.toUpperCase()}</code></div></label>
          <label><span>卡片背景</span><div><input type="color" value={customTheme.surface} onChange={(event) => onCustomThemeChange({ surface: event.target.value })} /><code>{customTheme.surface.toUpperCase()}</code></div></label>
        </div>
      </section>
      <section className="settings-section density-section">
        <div className="settings-section-head"><div><h3>显示密度</h3><p>调整计划列表和看板的呼吸感。</p></div></div>
        <div className="density-options">
          {(["comfortable", "compact"] as const).map((density) => <button type="button" className={customTheme.density === density ? "selected" : ""} key={density} onClick={() => onCustomThemeChange({ density })}><strong>{density === "comfortable" ? "舒适" : "紧凑"}</strong><small>{density === "comfortable" ? "更宽松的间距" : "在一屏显示更多内容"}</small></button>)}
        </div>
      </section>
    </section>
  );
}

const onboardingSteps = [
  {
    view: "today" as View,
    target: "new-plan",
    title: "从今日开始",
    description: "这里汇集今天的计划。先试试左侧的“新增计划”，为一件想完成的事设定日期和优先级。",
    points: ["示例计划可以直接修改或删除", "完成后，计划会自然移动到列表下方"],
  },
  {
    view: "week" as View,
    target: "week",
    title: "在本周安排时间",
    description: "本周将同一批计划按每天展开。计划的日期范围覆盖哪一天，就会出现在哪一天。",
    points: ["切换周次时会明确标识是否为当前周", "同一天的未完成计划会按优先级排序"],
  },
  {
    view: "month" as View,
    target: "month",
    title: "在本月总览项目",
    description: "本月将计划整理成表格。点击计划名称能打开详情，查看子计划、日期与完成进度。",
    points: ["类型和优先级便于快速扫描", "带子计划的项目会按子计划占比汇总完成度"],
  },
  {
    view: "calendar" as View,
    target: "calendar",
    title: "用日历定位计划",
    description: "日历让你快速看到计划落在哪一天。点击计划查看详情，点击日期即可前往当天的计划列表。",
    points: ["不同类型使用不同颜色区分", "长时间范围的计划会在覆盖日期中出现"],
  },
  {
    view: "review" as View,
    target: "review",
    title: "每周花几分钟复盘",
    description: "复盘页汇总本周完成情况，也能记录成果、阻碍和下一步，历史记录保留最近两周。",
    points: ["日历同样可以从侧边栏随时查看", "主题与所有计划内容都会自动保存在本地"],
  },
];

function OnboardingModal({
  step,
  onStepChange,
  onFinish,
}: {
  step: number;
  onStepChange: (step: number) => void;
  onFinish: () => void;
}) {
  const current = onboardingSteps[step];
  const isLast = step === onboardingSteps.length - 1;
  return (
    <aside className="onboarding-tour" role="dialog" aria-modal="false" aria-labelledby="onboarding-title">
      <header>
        <div className="onboarding-progress" aria-label={`第 ${step + 1} 步，共 ${onboardingSteps.length} 步`}>
          {onboardingSteps.map((item, index) => <i className={index <= step ? "active" : ""} key={item.title} />)}
        </div>
        <button type="button" className="onboarding-skip" onClick={onFinish}>跳过</button>
      </header>
      <div className="onboarding-content">
        <p className="eyebrow">新手指南 · {step + 1}/{onboardingSteps.length}</p>
        <h2 id="onboarding-title">{current.title}</h2>
        <p>{current.description}</p>
        <ul>
          {current.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
      <footer>
        {step > 0 ? <button type="button" className="secondary" onClick={() => onStepChange(step - 1)}>上一步</button> : <span />}
        <button type="button" className="onboarding-next" onClick={() => isLast ? onFinish() : onStepChange(step + 1)}>{isLast ? "完成" : "下一步"}</button>
      </footer>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlanForm({
  draft,
  editing,
  currentTask,
  areas,
  tasks,
  newAreaName,
  setNewAreaName,
  setDraft,
  onSubmit,
  onCancel,
  onAddArea,
  onEditChild,
  onEditParent,
}: {
  draft: Draft;
  editing: boolean;
  currentTask?: Task;
  areas: Area[];
  tasks: Task[];
  newAreaName: string;
  setNewAreaName: (value: string) => void;
  setDraft: (draft: Draft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onAddArea: (name: string) => void;
  onEditChild: (task: Task) => void;
  onEditParent: (task: Task) => void;
}) {
  const [expandedChildId, setExpandedChildId] = useState("");
  const childPlans = currentTask
    ? sortPlans(tasks.filter((task) => task.parentId === currentTask.id))
    : [];
  const isChildPlan = Boolean(currentTask?.parentId);
  const parentPlan = currentTask?.parentId ? tasks.find((task) => task.id === currentTask.parentId) : undefined;
  const newChild = (): ChildDraft => ({
    title: "",
    startDate: draft.startDate,
    endDate: draft.endDate,
    priority: draft.priority,
    area: draft.area,
    weight: 100,
  });

  return (
    <section className="plan-editor">
      <div className="editor-topbar">
        <span>{editing ? "计划详情" : "新增计划"}</span>
        <button type="button" className="close-editor" onClick={onCancel} aria-label="关闭">×</button>
      </div>
      <form onSubmit={onSubmit}>
        <div className="editor-main">
          <div className="editor-content">
            <label className="title-field">
              <span>计划</span>
              <input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="计划名称" />
            </label>
            {isChildPlan && parentPlan ? <div className="parent-plan-reference"><div><span>从属父计划</span><strong>{parentPlan.title}</strong></div><button type="button" onClick={() => onEditParent(parentPlan)}>编辑父计划</button></div> : null}
            <div className="plan-controls">
              <label>日期<div className="form-row"><input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value, endDate: draft.endDate < event.target.value ? event.target.value : draft.endDate })} /><input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} /></div></label>
              {!isChildPlan ? <label>优先级<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}><option>P1</option><option>P2</option><option>P3</option></select></label> : null}
              {!isChildPlan ? <label>类型<select value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })}><option value="">未设置</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label> : null}
              {isChildPlan ? <label>占比<div className="weight-input"><input type="number" min="0" max="100" value={draft.weight ?? ""} onChange={(event) => setDraft({ ...draft, weight: event.target.value === "" ? 0 : Math.max(0, Number(event.target.value)) })} /><span>%</span></div></label> : null}
              {!isChildPlan ? <details className="area-adder"><summary>新增类型</summary><div className="area-manager"><input value={newAreaName} onChange={(event) => setNewAreaName(event.target.value)} placeholder="例如：工作" /><button type="button" onClick={() => { onAddArea(newAreaName); setNewAreaName(""); }}>添加</button></div></details> : null}
            </div>
            <details className="description-field">
              <summary>描述 <em>可选</em></summary>
              <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="补充背景、拆解思路或验收标准" />
            </details>
            {!isChildPlan ? <section className="child-editor">
              <div className="child-editor-head">
                <div><strong>子计划</strong><span>{childPlans.length + draft.children.length} 个</span></div>
                <button type="button" onClick={() => setDraft({ ...draft, children: [...draft.children, newChild()] })}>+ 添加子计划</button>
              </div>
              {childPlans.length ? (
                <div className="child-editor-list">
                  {childPlans.map((child) => {
                    const expanded = expandedChildId === child.id;
                    return (
                      <div className={expanded ? "saved-child expanded" : "saved-child"} key={child.id}>
                        <button type="button" className="saved-child-row" onClick={() => setExpandedChildId(expanded ? "" : child.id)}>
                          <span>{child.done ? "✓" : "○"} {child.title}</span>
                          <small>{formatShort(child.startDate)} - {formatShort(child.endDate)}</small>
                        </button>
                        {expanded ? <div className="saved-child-detail"><span>{child.notes || "暂无描述"}</span><button type="button" onClick={() => onEditChild(child)}>编辑子计划</button></div> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {draft.children.map((child, index) => (
                <div className="new-child-row" key={index}>
                  <div className="new-child-head">
                    <input value={child.title} onChange={(event) => setDraft({ ...draft, children: draft.children.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} placeholder="子计划名称" />
                    <button type="button" aria-label="移除子计划" onClick={() => setDraft({ ...draft, children: draft.children.filter((_, itemIndex) => itemIndex !== index) })}>×</button>
                  </div>
                  <div className="child-fields">
                    <label>开始<input type="date" value={child.startDate} onChange={(event) => setDraft({ ...draft, children: draft.children.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: event.target.value, endDate: item.endDate < event.target.value ? event.target.value : item.endDate } : item) })} /></label>
                    <label>结束<input type="date" value={child.endDate} onChange={(event) => setDraft({ ...draft, children: draft.children.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: event.target.value } : item) })} /></label>
                    <label>占比<div className="weight-input"><input type="number" min="0" max="100" value={child.weight || ""} onChange={(event) => setDraft({ ...draft, children: draft.children.map((item, itemIndex) => itemIndex === index ? { ...item, weight: event.target.value === "" ? 0 : Math.max(0, Number(event.target.value)) } : item) })} /><span>%</span></div></label>
                  </div>
                </div>
              ))}
              {!childPlans.length && !draft.children.length ? <p className="empty small">把可独立推进的事项加为子计划。</p> : null}
            </section> : null}
          </div>
        </div>
        <div className="editor-actions">
          <button type="submit">{editing ? "保存" : "添加计划"}</button>
          <button type="button" className="secondary" onClick={onCancel}>取消</button>
        </div>
      </form>
    </section>
  );
}

function MonthBoard({
  tasks,
  allTasks,
  areas,
  onEdit,
}: {
  tasks: Task[];
  allTasks: Task[];
  areas: Area[];
  onEdit: (task: Task) => void;
}) {
  return (
    <section className="month-board">
      <div className="panel-heading">
        <h2>本月计划</h2>
        <span>{tasks.length} 项</span>
      </div>
      <div className="month-table" role="table" aria-label="本月计划看板">
        <div className="month-table-head" role="row">
          <span>名称</span><span>类型</span><span>计划日期</span><span>优先级</span><span>完成度</span>
        </div>
        {tasks.length ? tasks.map((task) => {
          const progress = taskProgress(task, allTasks);
          return (
            <div className={task.done ? "month-table-row done" : "month-table-row"} role="button" tabIndex={0} key={task.id} onClick={() => onEdit(task)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onEdit(task); }}>
              <div className="board-task">
                <strong>{task.title}</strong>
              </div>
              <span className="board-area" style={{ "--area-color": areaColor(areas, task.area) } as CSSProperties}>{areaName(areas, task.area)}</span>
              <div className="board-dates">
                <input className="board-date-picker" aria-label="开始日期日历" type="date" value={task.startDate} onClick={(event) => event.stopPropagation()} onChange={() => undefined} />
                <span>至</span>
                <input className="board-date-picker" aria-label="结束日期日历" type="date" value={task.endDate} onClick={(event) => event.stopPropagation()} onChange={() => undefined} />
              </div>
              <span className={`board-priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
              <div className="board-progress"><div><i style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
            </div>
          );
        }) : <p className="empty">本月还没有计划。</p>}
      </div>
    </section>
  );
}

function ReviewEditorModal({
  draft,
  setDraft,
  onSave,
  onClose,
}: {
  draft: { wins: string; blocks: string; next: string };
  setDraft: (draft: { wins: string; blocks: string; next: string }) => void;
  onSave: (period: "week" | "month") => void;
  onClose: () => void;
}) {
  return (
    <div className="editor-backdrop review-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="review-modal" role="dialog" aria-modal="true" aria-label="编辑复盘" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>历史复盘</span><h2>编辑回顾</h2></div><button type="button" className="close-editor" onClick={onClose} aria-label="关闭">×</button></header>
        <div className="review-modal-fields">
          <label>本期亮点<textarea value={draft.wins} onChange={(event) => setDraft({ ...draft, wins: event.target.value })} /></label>
          <label>未达成与原因<textarea value={draft.blocks} onChange={(event) => setDraft({ ...draft, blocks: event.target.value })} /></label>
          <label>下一周期焦点<textarea value={draft.next} onChange={(event) => setDraft({ ...draft, next: event.target.value })} /></label>
        </div>
        <footer><button type="button" className="secondary" onClick={onClose}>取消</button><button type="button" onClick={() => onSave("week")}>保存修改</button></footer>
      </section>
    </div>
  );
}

function TaskList({
  title,
  tasks,
  allTasks,
  areas,
  onToggle,
  onEdit,
  onDelete,
  showTime = false,
  onCreate,
}: {
  title: string;
  tasks: Task[];
  allTasks: Task[];
  areas: Area[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  showTime?: boolean;
  onCreate?: () => void;
}) {
  return (
    <section>
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{tasks.length} 项</span>
      </div>
      <div className={showTime ? "task-stack month-task-stack" : "task-stack"}>
        {tasks.length === 0 ? (
          <button className="empty empty-create" onClick={onCreate}>＋ 添加计划</button>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              allTasks={allTasks}
              areas={areas}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              showTime={showTime}
            />
          ))
        )}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  allTasks,
  areas,
  onToggle,
  onEdit,
  onDelete,
  showTime = false,
}: {
  task: Task;
  allTasks: Task[];
  areas: Area[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  showTime?: boolean;
}) {
  const children = sortPlans(allTasks.filter((item) => item.parentId === task.id));
  const parentPlan = task.parentId ? allTasks.find((item) => item.id === task.parentId) : undefined;
  const color = areaColor(areas, task.area);

  return (
    <article className={task.done ? "task done" : "task"} style={{ "--area-color": color } as CSSProperties}>
      <button className="check" aria-label={task.done ? "标记未完成" : "标记完成"} onClick={() => onToggle(task.id)} />
      <div>
        <button className="task-title" onClick={() => onEdit(task)}><h3>{task.title}{parentPlan ? <small className="parent-plan-label">（{parentPlan.title}）</small> : null}</h3></button>
        {showTime ? <p>{formatShort(task.startDate)} - {formatShort(task.endDate)}</p> : !parentPlan && children.length ? <p>{children.length} 个子计划</p> : null}
        {showTime ? <div className="task-progress"><i style={{ width: `${taskProgress(task, allTasks)}%` }} /><span>{taskProgress(task, allTasks)}%</span></div> : null}
      </div>
      <span className={`priority-mark ${task.priority.toLowerCase()}`} aria-label={`${task.priority} 优先级`}>{task.priority}</span>
      <details className="task-menu">
        <summary aria-label="更多操作">•••</summary>
        <div>
          <button onClick={() => onEdit(task)}>编辑</button>
          <button onClick={() => onDelete(task.id)} className="delete">删除</button>
        </div>
      </details>
    </article>
  );
}

function WeekTimeline({
  days,
  tasks,
  areas,
  onToggle,
  onEdit,
  onDelete,
}: {
  days: Date[];
  tasks: Task[];
  areas: Area[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const parentPlanIds = new Set(tasks.flatMap((task) => task.parentId ? [task.parentId] : []));
  useEffect(() => {
    if (!days.some((day) => toKey(day) === todayKey)) return;
    const timer = window.setTimeout(() => {
      document.getElementById("week-today")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [days]);

  return (
    <section className="week-timeline">
      {days.map((day) => {
        const key = toKey(day);
        const dayTasks = sortPlans(tasks.filter((task) => !parentPlanIds.has(task.id) && overlaps(task, key, key)));
        return (
          <article className="timeline-day" id={key === todayKey ? "week-today" : undefined} key={key}>
            <header>
              <strong>{formatShort(key)}</strong>
              <span>{dayTasks.length} 项</span>
            </header>
            <div className="timeline-list">
              {dayTasks.length ? (
                dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    areas={areas}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              ) : (
                <p className="empty small">当天没有计划。</p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function Calendar({
  days,
  anchor,
  tasks,
  areas,
  onEdit,
  onSelectDate,
}: {
  days: Date[];
  anchor: Date;
  tasks: Task[];
  areas: Area[];
  onEdit: (task: Task) => void;
  onSelectDate: (date: Date) => void;
}) {
  const currentWeekStart = toKey(startOfWeek(today));
  useEffect(() => {
    if (!days.some((day) => toKey(day) === currentWeekStart)) return;
    const timer = window.setTimeout(() => {
      document.getElementById("calendar-current-week")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [days, currentWeekStart]);

  return (
    <section className="calendar-shell">
      <div className="calendar-grid">
        {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day) => (
          <strong className="weekday" key={day}>{day}</strong>
        ))}
        {days.map((day) => {
          const key = toKey(day);
          const dayTasks = sortPlans(tasks.filter((task) => !task.parentId && overlaps(task, key, key)));
          const faded = day.getMonth() !== anchor.getMonth();
          const isToday = key === todayKey;
          return (
            <article id={key === currentWeekStart ? "calendar-current-week" : undefined} className={["calendar-day", faded ? "muted" : "", isToday ? "current" : ""].join(" ")} key={key}>
              <button className="day-number" onClick={() => onSelectDate(day)}>{day.getDate()}</button>
              <div className="calendar-events">
                {dayTasks.slice(0, 4).map((task) => (
                  <button
                    key={task.id}
                    className={task.done ? "calendar-task done" : "calendar-task"}
                    onClick={() => onEdit(task)}
                    style={{ "--area-color": areaColor(areas, task.area) } as CSSProperties}
                  >
                    <span>{task.title}</span>
                  </button>
                ))}
              </div>
              {dayTasks.length > 4 ? <small className="more-events">+{dayTasks.length - 4}</small> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

type ReviewShareData = {
  completion: number;
  completed: number;
  total: number;
  weekStart: string;
  completedTasks: string[];
  wins: string;
  blocks: string;
  next: string;
  focusTasks: string[];
};

function createReviewShareImage(data: ReviewShareData) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const width = canvas.width;
  const accent = "#24a47a";
  const ink = "#17211f";
  const muted = "#687a74";
  const line = "#dfe9e5";

  context.fillStyle = "#f4faf7";
  context.fillRect(0, 0, width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(54, 54, width - 108, canvas.height - 108);
  context.strokeStyle = line;
  context.lineWidth = 2;
  context.strokeRect(54, 54, width - 108, canvas.height - 108);

  const drawWrapped = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
    const characters = text || "未记录";
    const lines: string[] = [];
    let current = "";
    for (const character of characters) {
      if (context.measureText(current + character).width > maxWidth && current) {
        lines.push(current);
        current = character;
        if (lines.length === maxLines) break;
      } else current += character;
    }
    if (current && lines.length < maxLines) lines.push(current);
    lines.slice(0, maxLines).forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  };

  context.fillStyle = accent;
  context.font = "700 24px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText("iTodo", 104, 130);
  context.fillStyle = muted;
  context.font = "600 20px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText("WEEKLY REVIEW", 104, 166);
  context.fillStyle = ink;
  context.font = "700 54px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText("本周复盘", 104, 246);
  context.fillStyle = muted;
  context.font = "500 24px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText(`${formatShort(data.weekStart)} 所在周`, 104, 286);

  context.fillStyle = "#e8f8f2";
  context.beginPath();
  context.arc(810, 238, 118, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 16;
  context.beginPath();
  context.arc(810, 238, 94, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (data.completion / 100));
  context.stroke();
  context.fillStyle = ink;
  context.font = "700 50px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.textAlign = "center";
  context.fillText(`${data.completion}%`, 810, 252);
  context.fillStyle = muted;
  context.font = "600 18px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText("完成率", 810, 284);
  context.textAlign = "left";

  const metricY = 366;
  [
    ["已完成", `${data.completed}`],
    ["计划数", `${data.total}`],
    ["待推进", `${Math.max(0, data.total - data.completed)}`],
  ].forEach(([label, value], index) => {
    const x = 104 + index * 290;
    context.fillStyle = "#f8fbfa";
    context.fillRect(x, metricY, 252, 134);
    context.fillStyle = muted;
    context.font = "600 20px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(label, x + 24, metricY + 42);
    context.fillStyle = ink;
    context.font = "700 42px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(value, x + 24, metricY + 96);
  });

  context.fillStyle = ink;
  context.font = "700 24px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText("已完成任务", 104, 554);
  const completedTasks = data.completedTasks.length ? data.completedTasks.slice(0, 4) : ["本周还没有完成任务"];
  completedTasks.forEach((task, index) => {
    const x = 104 + (index % 2) * 430;
    const y = 582 + Math.floor(index / 2) * 50;
    context.fillStyle = "#f1faf6";
    context.fillRect(x, y, 400, 36);
    context.fillStyle = accent;
    context.beginPath();
    context.arc(x + 17, y + 18, 5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = ink;
    context.font = "600 18px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    drawWrapped(task, x + 32, y + 24, 350, 24, 1);
  });

  const sections = [
    ["本期亮点", data.wins],
    ["未达成与原因", data.blocks],
    ["下周焦点", data.next || data.focusTasks.join("、")],
  ];
  sections.forEach(([title, content], index) => {
    const y = 746 + index * 128;
    context.fillStyle = accent;
    context.fillRect(104, y - 20, 5, 68);
    context.fillStyle = ink;
    context.font = "700 24px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(title, 132, y);
    context.fillStyle = muted;
    context.font = "500 22px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    drawWrapped(content, 132, y + 34, 790, 28, 2);
  });

  context.strokeStyle = line;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(104, 1165);
  context.lineTo(976, 1165);
  context.stroke();
  context.fillStyle = muted;
  context.font = "500 18px Arial, PingFang SC, Microsoft YaHei, sans-serif";
  context.fillText("把计划拆成能推进的子计划", 104, 1215);
  context.textAlign = "right";
  context.fillText("itodo.local", 976, 1215);
  context.textAlign = "left";
  return canvas.toDataURL("image/png");
}

function ReviewShareModal({ image, onClose }: { image: string; onClose: () => void }) {
  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = image;
    link.download = `itodo-weekly-review-${todayKey}.png`;
    link.click();
  };
  return (
    <div className="review-share-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="review-share-modal" role="dialog" aria-modal="true" aria-label="本周复盘分享图" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>本周复盘</span><h2>分享图已生成</h2></div><button type="button" className="close-editor" onClick={onClose} aria-label="关闭">×</button></header>
        <img src={image} alt="本周复盘总结分享图" />
        <footer><button type="button" className="secondary" onClick={onClose}>返回</button><button type="button" onClick={downloadImage}>下载 PNG</button></footer>
      </section>
    </div>
  );
}

function ReviewPanel({
  tasks,
  allTasks,
  areas,
  reviews,
  draft,
  setDraft,
  addReview,
  editingReviewId,
  onEditReview,
  onDeleteReview,
}: {
  tasks: Task[];
  allTasks: Task[];
  areas: Area[];
  reviews: Review[];
  draft: { wins: string; blocks: string; next: string };
  setDraft: (draft: { wins: string; blocks: string; next: string }) => void;
  addReview: (period: "week" | "month") => void;
  editingReviewId: string;
  onEditReview: (review: Review) => void;
  onDeleteReview: (id: string) => void;
}) {
  const [shareImage, setShareImage] = useState("");
  const recentReviews = reviews.filter((review) => review.period === "week").slice(0, 2);
  const savedCurrentReview = reviews.find((review) => review.period === "week" && review.anchor === toKey(startOfWeek(today)));
  const completed = tasks.filter((task) => task.done);
  const open = tasks.filter((task) => !task.done);
  const total = tasks.length || 1;
  const completion = Math.round((completed.length / total) * 100);
  const highOpen = open.filter((task) => task.priority === "P1").length;
  const areaRows = Object.entries(
    tasks.reduce<Record<string, number>>((result, task) => {
      result[task.area] = (result[task.area] || 0) + 1;
      return result;
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const weeklyDone = Array.from({ length: 7 }, (_, index) => {
    const key = toKey(addDays(today, index - 6));
    return {
      key,
      label: new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${key}T00:00:00`)),
      done: allTasks.filter((task) => overlaps(task, key, key) && task.done).length,
      total: allTasks.filter((task) => overlaps(task, key, key)).length,
    };
  });
  const peak = Math.max(...weeklyDone.map((item) => item.total), 1);
  const generateShareImage = () => {
    const image = createReviewShareImage({
      completion,
      completed: completed.length,
      total: tasks.length,
      weekStart: toKey(startOfWeek(today)),
      completedTasks: completed.slice(0, 4).map((task) => task.title),
      wins: draft.wins || savedCurrentReview?.wins || "",
      blocks: draft.blocks || savedCurrentReview?.blocks || "",
      next: draft.next || savedCurrentReview?.next || "",
      focusTasks: open.slice(0, 3).map((task) => task.title),
    });
    if (image) setShareImage(image);
  };

  return (
    <section className="review-layout">
      <div className="review-dashboard">
        <div className="panel-heading">
          <h2>本周看板</h2>
          <span>当前周</span>
        </div>
        <div className="review-hero">
          <div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` } as CSSProperties}>
            <strong>{completion}%</strong>
            <span>完成率</span>
          </div>
          <div className="review-summary">
            <strong>{completed.length} 项已完成</strong>
            <span>{open.length} 项未完成 · {highOpen} 个 P1 待推进</span>
          </div>
        </div>
        <div className="review-stat-grid">
          <Metric label="已完成" value={`${completed.length}`} />
          <Metric label="未完成" value={`${open.length}`} />
          <Metric label="P1 待办" value={`${highOpen}`} />
        </div>
        <div className="chart-panel">
          <h3>最近 7 天完成节奏</h3>
          <div className="bar-chart">
            {weeklyDone.map((item) => (
              <div className="bar-item" key={item.key}>
                <span className="bar" style={{ height: `${Math.max(8, (item.done / peak) * 96)}px` }} title={`${item.done}/${item.total}`} />
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="distribution">
          <h3>类型分布</h3>
          {areaRows.length === 0 ? (
            <p className="empty small">暂无类型数据。</p>
          ) : (
            areaRows.map(([area, count]) => (
              <div className="distribution-row" key={area} style={{ "--area-color": areaColor(areas, area) } as CSSProperties}>
                <span>{areaName(areas, area)}</span>
                <div><i style={{ width: `${Math.round((count / total) * 100)}%` }} /></div>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="review-editor">
        <div className="panel-heading">
          <h2>{editingReviewId ? "编辑复盘" : "本周回顾"}</h2>
          <span>{editingReviewId ? "正在修改" : "当前周"}</span>
        </div>
        <label>本期亮点<textarea value={draft.wins} onChange={(event) => setDraft({ ...draft, wins: event.target.value })} placeholder="哪些选择值得保留？" /></label>
        <label>未达成与原因<textarea value={draft.blocks} onChange={(event) => setDraft({ ...draft, blocks: event.target.value })} placeholder="哪里被打断了，真正的原因是什么？" /></label>
        <label>下一周期焦点<textarea value={draft.next} onChange={(event) => setDraft({ ...draft, next: event.target.value })} placeholder="只写最重要的一到三件事。" /></label>
        <div className="review-actions">
          <button onClick={() => addReview("week")}>保存周复盘</button>
          <button className="share-review" onClick={generateShareImage}>生成分享图</button>
        </div>
        <div className="review-history">
          <div className="panel-heading">
            <h2>历史复盘</h2>
            <span>最近两周</span>
          </div>
          {recentReviews.length === 0 ? (
            <p className="empty">还没有复盘记录。</p>
          ) : (
            recentReviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-head"><strong>周复盘</strong><span>{formatShort(review.anchor)}</span><details className="review-menu"><summary aria-label="更多操作">•••</summary><div><button onClick={() => onEditReview(review)}>编辑</button><button className="review-delete" onClick={() => onDeleteReview(review.id)}>删除</button></div></details></div>
                <div className="review-snapshot">
                  <div><strong>{review.totalCount ? `${Math.round(((review.doneCount || 0) / review.totalCount) * 100)}%` : "--"}</strong><span>完成率</span></div>
                  <div><strong>{review.doneCount ?? "--"}</strong><span>已完成</span></div>
                  <div><strong>{review.totalCount ?? "--"}</strong><span>计划数</span></div>
                </div>
                <p><b>亮点</b>{review.wins || "未记录"}</p>
                <p><b>复盘</b>{review.blocks || "未记录"}</p>
                <p><b>焦点</b>{review.next || "未记录"}</p>
              </article>
            ))
          )}
        </div>
      </div>
      {shareImage ? <ReviewShareModal image={shareImage} onClose={() => setShareImage("")} /> : null}
    </section>
  );
}
