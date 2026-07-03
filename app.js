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

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `kcal-log-${y}-${m}-${d}`;
}

function loadEntries() {
  const raw = localStorage.getItem(todayKey());
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
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

function renderTotals() {
  const totals = entries.reduce(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.protein_g;
      acc.carbs += e.carbs_g;
      acc.fat += e.fat_g;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  totalCaloriesEl.textContent = Math.round(totals.calories);
  totalProteinEl.textContent = `${round(totals.protein)}g`;
  totalCarbsEl.textContent = `${round(totals.carbs)}g`;
  totalFatEl.textContent = `${round(totals.fat)}g`;
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

renderDate();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}
