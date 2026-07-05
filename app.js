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
const macroGoalLabels = {
  protein: document.getElementById("protein-goal-label"),
  carbs: document.getElementById("carbs-goal-label"),
  fat: document.getElementById("fat-goal-label"),
};

const burnedDisplay = document.getElementById("burned-display");
const burnedStatusEl = document.getElementById("burned-status");
const burnedEditBtn = document.getElementById("burned-edit-btn");
const burnedForm = document.getElementById("burned-form");
const burnedInput = document.getElementById("burned-input");
const burnedCancelBtn = document.getElementById("burned-cancel-btn");

const LOG_KEY_PREFIX = "kcal-log-";
const BURNED_KEY_PREFIX = "kcal-burned-";
const GOAL_KEY = "kcal-goal";

function dateSuffix(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateKey(date) {
  return `${LOG_KEY_PREFIX}${dateSuffix(date)}`;
}

function todayKey() {
  return dateKey(new Date());
}

function burnedKeyFor(date) {
  return `${BURNED_KEY_PREFIX}${dateSuffix(date)}`;
}

function todayBurnedKey() {
  return burnedKeyFor(new Date());
}

function loadBurned() {
  const value = Number(localStorage.getItem(todayBurnedKey()));
  return value > 0 ? value : 0;
}

function saveBurned(value) {
  if (value > 0) {
    localStorage.setItem(todayBurnedKey(), String(value));
  } else {
    localStorage.removeItem(todayBurnedKey());
  }
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

function renderCalorieGoal(goalCalories, calories, burned) {
  if (!goalCalories) {
    goalBarFill.style.width = "0%";
    goalBarFill.classList.remove("over");
    goalStatusEl.textContent = "No daily goal set";
    return;
  }

  const effectiveGoal = goalCalories + burned;
  const pct = Math.min(100, (calories / effectiveGoal) * 100);
  goalBarFill.style.width = `${pct}%`;
  goalBarFill.classList.toggle("over", calories > effectiveGoal);

  const burnedNote = burned > 0 ? ` (${goalCalories} + ${burned} burned)` : "";

  if (calories > effectiveGoal) {
    goalStatusEl.textContent = `${calories} / ${effectiveGoal} kcal${burnedNote} · ${calories - effectiveGoal} over`;
  } else {
    goalStatusEl.textContent = `${calories} / ${effectiveGoal} kcal${burnedNote} · ${effectiveGoal - calories} left`;
  }
}

function renderBurned(burned) {
  if (burned > 0) {
    burnedStatusEl.textContent = `${burned} kcal burned today`;
    burnedEditBtn.textContent = "Edit burned";
  } else {
    burnedStatusEl.textContent = "No calories burned logged";
    burnedEditBtn.textContent = "Log burned";
  }
}

function renderMacroGoal(goalValue, actualValue, trackEl, fillEl, labelEl) {
  if (!goalValue) {
    trackEl.hidden = true;
    labelEl.hidden = true;
    return;
  }

  trackEl.hidden = false;
  const pct = Math.min(100, (actualValue / goalValue) * 100);
  fillEl.style.width = `${pct}%`;
  fillEl.classList.toggle("over", actualValue > goalValue);

  labelEl.hidden = false;
  labelEl.textContent = `of ${goalValue}g`;
}

function renderGoal() {
  const goal = loadGoal();
  const totals = computeTotals(entries);
  const burned = loadBurned();

  renderCalorieGoal(goal.calories, Math.round(totals.calories), burned);
  renderMacroGoal(goal.protein, totals.protein, macroBarTracks.protein, macroBarFills.protein, macroGoalLabels.protein);
  renderMacroGoal(goal.carbs, totals.carbs, macroBarTracks.carbs, macroBarFills.carbs, macroGoalLabels.carbs);
  renderMacroGoal(goal.fat, totals.fat, macroBarTracks.fat, macroBarFills.fat, macroGoalLabels.fat);
  renderBurned(burned);

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

function addEntryFromResult(description, result) {
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
    addEntryFromResult(description, result);

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

burnedEditBtn.addEventListener("click", () => {
  burnedInput.value = loadBurned() || "";
  burnedDisplay.hidden = true;
  burnedForm.hidden = false;
  burnedInput.focus();
});

burnedCancelBtn.addEventListener("click", () => {
  burnedForm.hidden = true;
  burnedDisplay.hidden = false;
});

burnedForm.addEventListener("submit", (e) => {
  e.preventDefault();
  saveBurned(Number(burnedInput.value) || 0);
  burnedForm.hidden = true;
  burnedDisplay.hidden = false;
  renderGoal();
});

const scanBarcodeBtn = document.getElementById("scan-barcode-btn");
const addPhotoBtn = document.getElementById("add-photo-btn");

const barcodeModal = document.getElementById("barcode-modal");
const barcodeModalClose = document.getElementById("barcode-modal-close");
const barcodeReaderEl = document.getElementById("barcode-reader");
const barcodeStatusEl = document.getElementById("barcode-status");
const barcodeConfirmEl = document.getElementById("barcode-confirm");
const barcodeProductNameEl = document.getElementById("barcode-product-name");
const barcodePer100gEl = document.getElementById("barcode-per-100g");
const barcodeQuantityInput = document.getElementById("barcode-quantity-input");
const barcodeAddBtn = document.getElementById("barcode-add-btn");
const barcodeCancelConfirmBtn = document.getElementById("barcode-cancel-confirm-btn");
const barcodeFallbackEl = document.getElementById("barcode-fallback");
const barcodeFallbackForm = document.getElementById("barcode-fallback-form");
const barcodeFallbackInput = document.getElementById("barcode-fallback-input");

const BARCODE_FORMATS_SUPPORTED =
  typeof Html5QrcodeSupportedFormats !== "undefined"
    ? [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
      ]
    : undefined;

let html5QrCodeInstance = null;
let currentBarcodeProduct = null;

function resetBarcodeModal() {
  barcodeStatusEl.textContent = "";
  barcodeConfirmEl.hidden = true;
  barcodeFallbackEl.hidden = true;
  barcodeReaderEl.hidden = false;
  barcodeFallbackInput.value = "";
  currentBarcodeProduct = null;
}

async function stopBarcodeScanner() {
  if (!html5QrCodeInstance) return;
  try {
    await html5QrCodeInstance.stop();
    html5QrCodeInstance.clear();
  } catch {
    // already stopped or never started — ignore
  }
  html5QrCodeInstance = null;
}

async function onBarcodeDecoded(decodedText) {
  await stopBarcodeScanner();
  barcodeReaderEl.hidden = true;
  barcodeStatusEl.textContent = `Looking up barcode ${decodedText}...`;

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(decodedText)}.json`
    );
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      barcodeStatusEl.textContent = `No product found for barcode ${decodedText}.`;
      barcodeFallbackEl.hidden = false;
      return;
    }

    const product = data.product;
    const n = product.nutriments || {};
    const per100g = {
      calories: Number(n["energy-kcal_100g"]) || 0,
      protein: Number(n.proteins_100g) || 0,
      carbs: Number(n.carbohydrates_100g) || 0,
      fat: Number(n.fat_100g) || 0,
    };

    if (!per100g.calories) {
      barcodeStatusEl.textContent = "That product doesn't have nutrition data on file.";
      barcodeFallbackEl.hidden = false;
      return;
    }

    currentBarcodeProduct = {
      name: product.product_name || `Product ${decodedText}`,
      per100g,
    };

    const defaultGrams =
      Number(product.serving_quantity) > 0 ? Math.round(product.serving_quantity) : 100;

    barcodeProductNameEl.textContent = currentBarcodeProduct.name;
    barcodePer100gEl.textContent = `${Math.round(per100g.calories)} kcal / 100g · P ${round(
      per100g.protein
    )}g · C ${round(per100g.carbs)}g · F ${round(per100g.fat)}g`;
    barcodeQuantityInput.value = defaultGrams;
    barcodeStatusEl.textContent = "";
    barcodeConfirmEl.hidden = false;
  } catch (err) {
    console.error("Open Food Facts lookup failed:", err);
    barcodeStatusEl.textContent = "Lookup failed (network issue).";
    barcodeFallbackEl.hidden = false;
  }
}

async function openBarcodeModal() {
  resetBarcodeModal();
  barcodeModal.hidden = false;
  barcodeStatusEl.textContent = "Point your camera at a barcode...";

  try {
    html5QrCodeInstance = new Html5Qrcode("barcode-reader");
    await html5QrCodeInstance.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        formatsToSupport: BARCODE_FORMATS_SUPPORTED,
      },
      onBarcodeDecoded,
      () => {
        // per-frame "no barcode found yet" — expected, ignore
      }
    );
  } catch (err) {
    console.error("Camera start failed:", err);
    barcodeStatusEl.textContent =
      "Couldn't access the camera. Check permissions, or type the product name below.";
    barcodeReaderEl.hidden = true;
    barcodeFallbackEl.hidden = false;
  }
}

async function closeBarcodeModal() {
  await stopBarcodeScanner();
  barcodeModal.hidden = true;
}

scanBarcodeBtn.addEventListener("click", openBarcodeModal);
barcodeModalClose.addEventListener("click", closeBarcodeModal);
barcodeCancelConfirmBtn.addEventListener("click", closeBarcodeModal);

barcodeAddBtn.addEventListener("click", () => {
  const grams = Number(barcodeQuantityInput.value) || 0;
  if (!grams || !currentBarcodeProduct) return;

  const factor = grams / 100;
  const { name, per100g } = currentBarcodeProduct;
  addEntryFromResult(`${name} (${grams}g)`, {
    calories: per100g.calories * factor,
    protein_g: per100g.protein * factor,
    carbs_g: per100g.carbs * factor,
    fat_g: per100g.fat * factor,
  });
  closeBarcodeModal();
});

barcodeFallbackForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const description = barcodeFallbackInput.value.trim();
  if (!description) return;

  barcodeStatusEl.textContent = "Looking up nutrition...";
  try {
    const result = await lookupFood(description);
    addEntryFromResult(description, result);
    closeBarcodeModal();
  } catch (err) {
    barcodeStatusEl.textContent = err.message || "Lookup failed.";
  }
});

const photoModal = document.getElementById("photo-modal");
const photoModalClose = document.getElementById("photo-modal-close");
const photoCaptureEl = document.getElementById("photo-capture");
const photoFileInput = document.getElementById("photo-file-input");
const photoQuantityInput = document.getElementById("photo-quantity-input");
const photoAnalyzeBtn = document.getElementById("photo-analyze-btn");
const photoCaptureCancelBtn = document.getElementById("photo-capture-cancel-btn");
const photoStatusEl = document.getElementById("photo-status");
const photoConfirmEl = document.getElementById("photo-confirm");
const photoResultDescEl = document.getElementById("photo-result-desc");
const photoResultMacrosEl = document.getElementById("photo-result-macros");
const photoAddBtn = document.getElementById("photo-add-btn");
const photoRetryBtn = document.getElementById("photo-retry-btn");

let currentPhotoResult = null;

function resetPhotoModal() {
  photoStatusEl.textContent = "";
  photoConfirmEl.hidden = true;
  photoCaptureEl.hidden = false;
  photoFileInput.value = "";
  photoQuantityInput.value = "";
  currentPhotoResult = null;
}

function openPhotoModal() {
  resetPhotoModal();
  photoModal.hidden = false;
}

function closePhotoModal() {
  photoModal.hidden = true;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function downscaleImage(dataUrl, maxDim = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = dataUrl;
  });
}

addPhotoBtn.addEventListener("click", openPhotoModal);
photoModalClose.addEventListener("click", closePhotoModal);
photoCaptureCancelBtn.addEventListener("click", closePhotoModal);

photoAnalyzeBtn.addEventListener("click", async () => {
  const file = photoFileInput.files?.[0];
  if (!file) {
    photoStatusEl.textContent = "Choose or take a photo first.";
    return;
  }

  photoAnalyzeBtn.disabled = true;
  photoStatusEl.textContent = "Analyzing photo...";

  try {
    const rawDataUrl = await readFileAsDataURL(file);
    const scaledDataUrl = await downscaleImage(rawDataUrl);
    const quantity = photoQuantityInput.value.trim();

    const res = await fetch("/api/vision-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: scaledDataUrl, quantity }),
    });

    if (!res.ok) {
      let message = "Photo analysis failed. Try again, or add this food by typing instead.";
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    const result = await res.json();
    currentPhotoResult = result;

    photoResultDescEl.textContent = result.description;
    photoResultMacrosEl.textContent = `${Math.round(result.calories)} kcal · P ${round(
      result.protein_g
    )}g · C ${round(result.carbs_g)}g · F ${round(result.fat_g)}g`;
    photoCaptureEl.hidden = true;
    photoStatusEl.textContent = "";
    photoConfirmEl.hidden = false;
  } catch (err) {
    photoStatusEl.textContent =
      err.message || "Something went wrong. Try a clearer photo, or add this food by typing instead.";
  } finally {
    photoAnalyzeBtn.disabled = false;
  }
});

photoAddBtn.addEventListener("click", () => {
  if (!currentPhotoResult) return;
  addEntryFromResult(currentPhotoResult.description, currentPhotoResult);
  closePhotoModal();
});

photoRetryBtn.addEventListener("click", () => {
  photoConfirmEl.hidden = true;
  photoCaptureEl.hidden = false;
  photoStatusEl.textContent = "";
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
