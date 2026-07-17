"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type View = "today" | "week" | "month" | "calendar" | "review";
type Priority = "P1" | "P2" | "P3";
type Theme = "light" | "dark" | "mint";

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
};

type Draft = {
  title: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  area: string;
  notes: string;
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
const today = new Date();
const todayKey = toKey(today);

const defaultAreas: Area[] = [
  { id: "study", name: "学习", color: "#3b82f6" },
  { id: "life", name: "生活", color: "#22c55e" },
  { id: "personal", name: "个人", color: "#a855f7" },
];

const seedTasks: Task[] = (() => {
  const month = makeTask({
    title: "完成 7 月个人系统整理",
    startDate: toKey(startOfMonth(today)),
    endDate: toKey(addDays(startOfMonth(today), 29)),
    priority: "P2",
    area: "personal",
    done: false,
  });
  const week = makeTask({
    title: "整理预算、订阅与运动安排",
    startDate: toKey(startOfWeek(today)),
    endDate: toKey(addDays(startOfWeek(today), 6)),
    priority: "P1",
    area: "work",
    parentId: month.id,
    done: false,
  });
  const day = makeTask({
    title: "完成产品需求梳理",
    startDate: todayKey,
    endDate: todayKey,
    priority: "P1",
    area: "work",
    parentId: week.id,
    done: false,
  });
  return [day, week, month];
})();

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
  const total = Math.max(1, children.reduce((sum, child) => sum + (child.weight || 1), 0));
  const completed = children.filter((child) => child.done).reduce((sum, child) => sum + (child.weight || 1), 0);
  return Math.round((completed / total) * 100);
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

  useEffect(() => {
    const savedTheme = localStorage.getItem(themeKey) as Theme | null;
    if (savedTheme) setTheme(savedTheme);
    const last = localStorage.getItem("itodo.lastUser") || "";
    if (last) signIn(last);
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    const all = loadStore();
    all[activeUser] = { tasks, reviews, areas };
    localStorage.setItem(storeKey, JSON.stringify(all));
    localStorage.setItem("itodo.lastUser", activeUser);
  }, [activeUser, tasks, reviews, areas]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function signIn(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const all = loadStore();
    const data = all[cleanName] || { tasks: seedTasks, reviews: [] };
    const nextTasks = data.tasks.map(normalizeTask);
    const nextAreas = normalizeAreas(nextTasks, data.areas);
    setActiveUser(cleanName);
    setUsername(cleanName);
    setTasks(nextTasks);
    setReviews(data.reviews);
    setAreas(nextAreas);
    setDraft(emptyDraft(nextAreas[0]?.id || "work", todayKey));
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
      children: [],
    });
    setEditorOpen(true);
  }

  function editChildFromParent(task: Task) {
    if (task.parentId) setReturnToId(task.parentId);
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
        [
          ...items.map((task) =>
            task.id === editingId
              ? { ...task, title: draft.title.trim(), startDate, endDate, priority: draft.priority, area: draft.area, notes: draft.notes.trim() }
              : task.parentId === editingId
                ? { ...task, ...boundRange(task.startDate, task.endDate, startDate, endDate) }
                : task,
          ),
          ...childTasks,
        ],
      );
      setNotice("计划已更新");
    } else {
      setTasks((items) => [
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
      ]);
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
    setNotice("领域已添加");
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
    else setAnchor((current) => addMonths(current, direction));
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

  const visibleTasks = useMemo(
    () => sortPlans(tasks.filter((task) => overlaps(task, range.start, range.end))),
    [tasks, range],
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
        <button className="new-plan-button" onClick={() => openNewPlan()}>
          + 新增计划
        </button>
        <nav className="nav-list" aria-label="主导航">
          {[
            ["today", "今日"],
            ["week", "本周"],
            ["month", "本月"],
            ["calendar", "日历"],
            ["review", "复盘"],
          ].map(([key, label]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key as View)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="theme-switcher" aria-label="主题切换">
            {(["light", "mint", "dark"] as Theme[]).map((item) => (
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
          <div className="date-controls">
            <button onClick={() => moveAnchor(-1)}>{previousLabel(view)}</button>
            <button onClick={() => setAnchor(today)}>今天</button>
            <button onClick={() => moveAnchor(1)}>{nextLabel(view)}</button>
          </div>
        </header>

        <section className="single-panel">
          <div className="primary-panel">
            {view === "calendar" ? (
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
                allTasks={tasks}
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
              />
            </div>
          </div>
        ) : null}
        {reviewEditorOpen ? <ReviewEditorModal draft={reviewDraft} setDraft={setReviewDraft} onSave={addReview} onClose={() => { setEditingReviewId(""); setReviewDraft({ wins: "", blocks: "", next: "" }); setReviewEditorOpen(false); }} /> : null}
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
  }[view];
}

function dayListTitle(date: Date) {
  return toKey(date) === todayKey ? "今日计划" : `${formatShort(toKey(date))} 计划`;
}

function headerDateLabel(view: View, anchor: Date) {
  if (view === "month" || view === "calendar") return monthTitle(anchor);
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
  return { light: "白", mint: "绿", dark: "暗" }[theme];
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
}) {
  const [expandedChildId, setExpandedChildId] = useState("");
  const childPlans = currentTask
    ? sortPlans(tasks.filter((task) => task.parentId === currentTask.id))
    : [];
  const isChildPlan = Boolean(currentTask?.parentId);
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
            <div className="plan-controls">
              <label>日期<div className="form-row"><input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value, endDate: draft.endDate < event.target.value ? event.target.value : draft.endDate })} /><input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} /></div></label>
              {!isChildPlan ? <label>优先级<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}><option>P1</option><option>P2</option><option>P3</option></select></label> : null}
              {!isChildPlan ? <label>领域<select value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })}><option value="">未设置</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label> : null}
              {!isChildPlan ? <details className="area-adder"><summary>新增领域</summary><div className="area-manager"><input value={newAreaName} onChange={(event) => setNewAreaName(event.target.value)} placeholder="例如：学习" /><button type="button" onClick={() => { onAddArea(newAreaName); setNewAreaName(""); }}>添加</button></div></details> : null}
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
          <span>名称</span><span>领域</span><span>计划日期</span><span>优先级</span><span>完成度</span>
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
  const color = areaColor(areas, task.area);

  return (
    <article className={task.done ? "task done" : "task"} style={{ "--area-color": color } as CSSProperties}>
      <button className="check" aria-label={task.done ? "标记未完成" : "标记完成"} onClick={() => onToggle(task.id)} />
      <div>
        <button className="task-title" onClick={() => onEdit(task)}><h3>{task.title}</h3></button>
        {showTime ? <p>{formatShort(task.startDate)} - {formatShort(task.endDate)}</p> : children.length ? <p>{children.length} 个子计划</p> : null}
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
        const dayTasks = sortPlans(tasks.filter((task) => overlaps(task, key, key)));
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
  return (
    <section className="calendar-shell">
      <div className="calendar-grid">
        {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day) => (
          <strong className="weekday" key={day}>{day}</strong>
        ))}
        {days.map((day) => {
          const key = toKey(day);
          const dayTasks = sortPlans(tasks.filter((task) => overlaps(task, key, key)));
          const faded = day.getMonth() !== anchor.getMonth();
          const isToday = key === todayKey;
          return (
            <article className={["calendar-day", faded ? "muted" : "", isToday ? "current" : ""].join(" ")} key={key}>
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
  const recentReviews = reviews.filter((review) => review.period === "week").slice(0, 2);
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
          <h3>领域分布</h3>
          {areaRows.length === 0 ? (
            <p className="empty small">暂无领域数据。</p>
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
    </section>
  );
}
