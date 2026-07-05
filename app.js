const form = document.getElementById("entry-form");
const input = document.getElementById("food-input");
const addButton = document.getElementById("add-button");
const statusEl = document.getElementById("status");
const logList = document.getElementById("log-list");
const dateEl = document.getElementById("today-date");

const totalCaloriesEl = document.getElementById("total-calories");
const totalProteinEl = document.getElementById("total-protein");
const totalCarbsEl = document.getElementById("total-carbs");
const totalFatEl = document.getElementById("total-fat");

const tabTodayBtn = document.getElementById("tab-today");
const tabHistoryBtn = document.getElementById("tab-history");
const viewToday = document.getElementById("view-today");
const viewHistory = document.getElementById("view-history");
const historyList = document.getElementById("history-list");

const goalDisplay = document.getElementById("goal-display");
const goalBarFill = document.getElementById("goal-bar-fill");
const goalStatusEl = document.getElementById("goal-status");
const goalEditBtn = document.getElementById("goal-edit-btn");
const goalForm = document.getElementById("goal-form");
const goalCancelBtn = document.getElementById("goal-cancel-btn");

const goalCaloriesInput = document.getElementById("goal-input-calories");
const goalProteinInput = document.getElementById("goal-input-protein");
const goalCarbsInput = document.getElementById("goal-input-carbs");
const goalFatInput = document.getElementById("goal-input-fat");

const macroBarTracks = {
  protein: document.getElementById("protein-bar-track"),
  carbs: document.getElementById("carbs-bar-track"),
  fat: document.getElementById("fat-bar-track"),
};
const macroBarFills = {
  protein: document.getElementById("protein-bar-fill"),
  carbs: document.getElementById("carbs-bar-fill"),
  fat: document.getElementById("fat-bar-fill"),
};

const LOG_KEY_PREFIX = "kcal-log-";
const GOAL_KEY = "kcal-goal";

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${LOG_KEY_PREFIX}${y}-${m}-${d}`;
}

function todayKey() {
  return dateKey(new Date());
}

function loadEntriesForKey(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadEntries() {
  return loadEntriesForKey(todayKey());
}

function saveEntries(entries) {
  localStorage.setItem(todayKey(), JSON.stringify(entries));
}

let entries = loadEntries();

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function round(n) {
  return Math.round(n * 10) / 10;
}

function renderDate() {
  dateEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function computeTotals(list) {
  return list.reduce(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.protein_g;
      acc.carbs += e.carbs_g;
      acc.fat += e.fat_g;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function renderTotals() {
  const totals = computeTotals(entries);

  totalCaloriesEl.textContent = Math.round(totals.calories);
  totalProteinEl.textContent = `${round(totals.protein)}g`;
  totalCarbsEl.textContent = `${round(totals.carbs)}g`;
  totalFatEl.textContent = `${round(totals.fat)}g`;
}

function normalizeGoalValue(value) {
  return value > 0 ? value : null;
}

function loadGoal() {
  const raw = localStorage.getItem(GOAL_KEY);
  if (!raw) return { calories: null, protein: null, carbs: null, fat: null };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        calories: normalizeGoalValue(parsed.calories),
        protein: normalizeGoalValue(parsed.protein),
        carbs: normalizeGoalValue(parsed.carbs),
        fat: normalizeGoalValue(parsed.fat),
      };
    }
  } catch {
    // fall through to legacy plain-number format below
  }

  // legacy format: a bare calorie number stored before macro goals existed
  return {
    calories: normalizeGoalValue(Number(raw)),
    protein: null,
    carbs: null,
    fat: null,
  };
}

function saveGoal(goal) {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

function renderCalorieGoal(goalCalories, calories) {
  if (!goalCalories) {
    goalBarFill.style.width = "0%";
    goalBarFill.classList.remove("over");
    goalStatusEl.textContent = "No daily goal set";
    return;
  }

  const pct = Math.min(100, (calories / goalCalories) * 100);
  goalBarFill.style.width = `${pct}%`;
  goalBarFill.classList.toggle("over", calories > goalCalories);

  if (calories > goalCalories) {
    goalStatusEl.textContent = `${calories} / ${goalCalories} kcal · ${calories - goalCalories} over`;
  } else {
    goalStatusEl.textContent = `${calories} / ${goalCalories} kcal · ${goalCalories - calories} left`;
  }
}

function renderMacroGoal(goalValue, actualValue, trackEl, fillEl) {
  if (!goalValue) {
    trackEl.hidden = true;
    return;
  }

  trackEl.hidden = false;
  const pct = Math.min(100, (actualValue / goalValue) * 100);
  fillEl.style.width = `${pct}%`;
  fillEl.classList.toggle("over", actualValue > goalValue);
}

function renderGoal() {
  const goal = loadGoal();
  const totals = computeTotals(entries);

  renderCalorieGoal(goal.calories, Math.round(totals.calories));
  renderMacroGoal(goal.protein, totals.protein, macroBarTracks.protein, macroBarFills.protein);
  renderMacroGoal(goal.carbs, totals.carbs, macroBarTracks.carbs, macroBarFills.carbs);
  renderMacroGoal(goal.fat, totals.fat, macroBarTracks.fat, macroBarFills.fat);

  const anyGoalSet = goal.calories || goal.protein || goal.carbs || goal.fat;
  goalEditBtn.textContent = anyGoalSet ? "Edit goal" : "Set goal";
}

function renderLog() {
  logList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No entries yet today. Add what you ate above.";
    logList.appendChild(empty);
    return;
  }

  // newest first
  [...entries].reverse().forEach((entry) => {
    const li = document.createElement("li");
    li.className = "log-entry";

    const main = document.createElement("div");
    main.className = "entry-main";

    const desc = document.createElement("span");
    desc.className = "entry-desc";
    desc.textContent = entry.description;

    const macros = document.createElement("span");
    macros.className = "entry-macros";
    macros.textContent = `P ${round(entry.protein_g)}g · C ${round(
      entry.carbs_g
    )}g · F ${round(entry.fat_g)}g`;

    main.appendChild(desc);
    main.appendChild(macros);

    const cals = document.createElement("span");
    cals.className = "entry-cals";
    cals.textContent = Math.round(entry.calories);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", "Remove entry");
    removeBtn.addEventListener("click", () => removeEntry(entry.id));

    li.appendChild(main);
    li.appendChild(cals);
    li.appendChild(removeBtn);
    logList.appendChild(li);
  });
}

function render() {
  renderTotals();
  renderGoal();
  renderLog();
}

function removeEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  saveEntries(entries);
  render();
}

async function lookupFood(description) {
  const url = `/api/lookup?food=${encodeURIComponent(description)}`;
  const res = await fetch(url);

  if (!res.ok) {
    let message = "Lookup failed. Try again.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const description = input.value.trim();
  if (!description) return;

  addButton.disabled = true;
  setStatus("Looking up nutrition...");

  try {
    const result = await lookupFood(description);

    const entry = {
      id: crypto.randomUUID(),
      description,
      calories: Number(result.calories) || 0,
      protein_g: Number(result.protein_g) || 0,
      carbs_g: Number(result.carbs_g) || 0,
      fat_g: Number(result.fat_g) || 0,
    };

    entries.push(entry);
    saveEntries(entries);
    render();

    input.value = "";
    setStatus("");
  } catch (err) {
    setStatus(err.message || "Something went wrong.", true);
  } finally {
    addButton.disabled = false;
    input.focus();
  }
});

function formatDayLabel(key) {
  const [, y, m, d] = key.match(/^kcal-log-(\d{4})-(\d{2})-(\d{2})$/);
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getHistoryKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(LOG_KEY_PREFIX) && key !== todayKey()) {
      keys.push(key);
    }
  }
  return keys.sort().reverse();
}

function renderHistory() {
  historyList.innerHTML = "";
  const keys = getHistoryKeys();

  if (keys.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No past days yet.";
    historyList.appendChild(empty);
    return;
  }

  keys.forEach((key) => {
    const dayEntries = loadEntriesForKey(key);
    if (dayEntries.length === 0) return;

    const totals = computeTotals(dayEntries);

    const li = document.createElement("li");
    li.className = "history-day";

    const header = document.createElement("button");
    header.className = "history-day-header";
    header.type = "button";

    const dateSpan = document.createElement("span");
    dateSpan.className = "history-day-date";
    dateSpan.textContent = formatDayLabel(key);

    const summary = document.createElement("span");
    summary.className = "history-day-summary";
    summary.innerHTML = `<span class="history-day-cals">${Math.round(
      totals.calories
    )} kcal</span><span class="history-day-macros">P ${round(
      totals.protein
    )}g · C ${round(totals.carbs)}g · F ${round(totals.fat)}g</span>`;

    header.appendChild(dateSpan);
    header.appendChild(summary);

    const entriesList = document.createElement("ul");
    entriesList.className = "history-entries";
    entriesList.hidden = true;

    [...dayEntries].reverse().forEach((entry) => {
      const entryLi = document.createElement("li");
      entryLi.className = "history-entry";

      const desc = document.createElement("span");
      desc.className = "history-entry-desc";
      desc.textContent = entry.description;

      const cals = document.createElement("span");
      cals.className = "history-entry-cals";
      cals.textContent = Math.round(entry.calories);

      entryLi.appendChild(desc);
      entryLi.appendChild(cals);
      entriesList.appendChild(entryLi);
    });

    header.addEventListener("click", () => {
      entriesList.hidden = !entriesList.hidden;
    });

    li.appendChild(header);
    li.appendChild(entriesList);
    historyList.appendChild(li);
  });
}

function showTodayView() {
  viewToday.hidden = false;
  viewHistory.hidden = true;
  tabTodayBtn.classList.add("active");
  tabHistoryBtn.classList.remove("active");
}

function showHistoryView() {
  viewToday.hidden = true;
  viewHistory.hidden = false;
  tabTodayBtn.classList.remove("active");
  tabHistoryBtn.classList.add("active");
  renderHistory();
}

tabTodayBtn.addEventListener("click", showTodayView);
tabHistoryBtn.addEventListener("click", showHistoryView);

goalEditBtn.addEventListener("click", () => {
  const goal = loadGoal();
  goalCaloriesInput.value = goal.calories || "";
  goalProteinInput.value = goal.protein || "";
  goalCarbsInput.value = goal.carbs || "";
  goalFatInput.value = goal.fat || "";
  goalDisplay.hidden = true;
  goalForm.hidden = false;
  goalCaloriesInput.focus();
});

goalCancelBtn.addEventListener("click", () => {
  goalForm.hidden = true;
  goalDisplay.hidden = false;
});

goalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  saveGoal({
    calories: normalizeGoalValue(Number(goalCaloriesInput.value)),
    protein: normalizeGoalValue(Number(goalProteinInput.value)),
    carbs: normalizeGoalValue(Number(goalCarbsInput.value)),
    fat: normalizeGoalValue(Number(goalFatInput.value)),
  });
  goalForm.hidden = true;
  goalDisplay.hidden = false;
  renderGoal();
});

renderDate();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}
