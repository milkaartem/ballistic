(function bootBallisticsLab() {
  "use strict";

  const Physics = window.Ballistics.Physics;
  const Presets = window.Ballistics.Presets;
  const SceneFactory = window.Ballistics.Scene;
  const Charts = window.Ballistics.Charts;
  const Audio = window.Ballistics.Audio;

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  const STORAGE = {
    theme: "ballistics_lab_theme",
    sound: "ballistics_lab_sound",
    compare: "ballistics_lab_compare_v1",
    show: "ballistics_lab_show_v1"
  };

  const COMPARE_COLORS = ["#ffa45c", "#5eead4", "#82aaff", "#ff93a2", "#b9e48a"];
  const COMPARE_LIMIT = 5;
  const REPORT_LOGO_DATA_URL = "data:image/png;base64,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";

  const numberFormatters = new Map();
  function nf(value, digits) {
    if (!Number.isFinite(value)) return "—";
    const precision = digits == null ? 1 : digits;
    let formatter = numberFormatters.get(precision);
    if (!formatter) {
      formatter = new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      });
      numberFormatters.set(precision, formatter);
    }
    return formatter.format(value);
  }

  function formatInput(value) {
    if (!Number.isFinite(value)) return "";
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(3)));
  }

  function parseNumber(raw) {
    if (raw == null) return NaN;
    const value = Number(String(raw).trim().replace(",", "."));
    return Number.isFinite(value) ? value : NaN;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? fallback : raw;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Приложение остаётся рабочим и без локального хранилища. */
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }

  function newId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `shot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function loadCompareShots() {
    const raw = readStorage(STORAGE.compare, "[]");
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, COMPARE_LIMIT).filter((shot) => shot && shot.params).map((shot, index) => ({
        id: newId(),
        label: typeof shot.label === "string" && shot.label.trim() ? shot.label.slice(0, 64) : `Бросок ${index + 1}`,
        color: normalizeColor(shot.color, COMPARE_COLORS[index % COMPARE_COLORS.length]),
        params: Physics.normalizeParams(shot.params),
        visible: shot.visible !== false
      }));
    } catch (error) {
      return [];
    }
  }

  function loadShowPrefs() {
    const defaults = { vectors: true, reference: true, trail: true, grid: true };
    const raw = readStorage(STORAGE.show, "");
    if (!raw) return defaults;
    try {
      const parsed = JSON.parse(raw);
      Object.keys(defaults).forEach((key) => {
        if (typeof parsed[key] === "boolean") defaults[key] = parsed[key];
      });
    } catch (error) {
      /* ignore */
    }
    return defaults;
  }

  const refs = {
    themeMeta: $('meta[name="theme-color"]'),
    views: {
      lab: $("#view-lab"),
      compare: $("#view-compare"),
      theory: $("#view-theory")
    },
    navTabs: $$(".nav-tab"),
    brand: $(".brand"),
    navCompareCount: $("#nav-compare-count"),
    labGrid: $("#lab-grid"),
    controlsPanel: $("#controls-panel"),
    controlsToggleBtn: $("#controls-toggle-btn"),
    soundToggle: $("#sound-toggle"),
    themeToggle: $("#theme-toggle"),
    fullscreenBtn: $("#fullscreen-btn"),
    helpBtn: $("#help-btn"),
    headerReportBtn: $("#report-btn"),
    randomizeBtn: $("#randomize-btn"),
    presetButtons: $$("[data-preset]"),
    presetHint: $("#preset-hint"),
    v0Range: $("#v0-range"),
    v0Num: $("#v0-num"),
    angleRange: $("#angle-range"),
    angleNum: $("#angle-num"),
    heightRange: $("#height-range"),
    heightNum: $("#height-num"),
    gravityNum: $("#gravity-num"),
    gravityChips: $$(".gravity-chip"),
    dragToggle: $("#drag-toggle"),
    windControl: $("#wind-control"),
    windRange: $("#wind-range"),
    windNum: $("#wind-num"),
    airAdvanced: $("#air-advanced"),
    airSummary: $("#air-summary"),
    massNum: $("#mass-num"),
    radiusNum: $("#radius-num"),
    cdNum: $("#cd-num"),
    rhoNum: $("#rho-num"),
    targetToggle: $("#target-toggle"),
    targetControls: $("#target-controls"),
    targetDistance: $("#target-distance"),
    targetRange: $("#target-range"),
    targetRadius: $("#target-radius"),
    autoAimBtn: $("#auto-aim-btn"),
    launchBtn: $("#launch-btn"),
    resetBtn: $("#reset-btn"),
    stageWrap: $("#stage-wrap"),
    sceneCanvas: $("#scene-canvas"),
    sceneState: $("#scene-state"),
    sceneStateText: $("#scene-state-text"),
    sceneClock: $("#scene-clock"),
    stageReadouts: $("#stage-readouts"),
    aimHint: $("#aim-hint"),
    targetChip: $("#target-chip"),
    sceneExportBtn: $("#scene-export-btn"),
    toolButtons: $$("[data-tool]"),
    referenceTool: $('[data-tool="reference"]'),
    playBtn: $("#play-btn"),
    timeCurrent: $("#time-current"),
    timeTotal: $("#time-total"),
    timeSlider: $("#time-slider"),
    speedSelect: $("#speed-select"),
    chartTabs: $$("[data-chart]"),
    chartCanvas: $("#chart-canvas"),
    chartDownload: $("#chart-download"),
    chartLegend: $("#chart-legend"),
    chartNote: $("#chart-note"),
    chartTooltip: $("#chart-tooltip"),
    flightState: $("#flight-state"),
    liveX: $("#live-x"),
    liveY: $("#live-y"),
    liveSpeed: $("#live-speed"),
    liveAngle: $("#live-angle"),
    targetResult: $("#target-result"),
    metricRange: $("#metric-range"),
    metricHmax: $("#metric-hmax"),
    metricTime: $("#metric-time"),
    metricImpact: $("#metric-impact"),
    metricPath: $("#metric-path"),
    metricApexTime: $("#metric-apex-time"),
    energyState: $("#energy-state"),
    energyKinetic: $("#energy-kinetic"),
    energyPotential: $("#energy-potential"),
    energyLost: $("#energy-lost"),
    energyKValue: $("#energy-k-value"),
    energyPValue: $("#energy-p-value"),
    energyLValue: $("#energy-l-value"),
    energyLossText: $("#energy-loss-text"),
    energyLossDot: $("#energy-loss-dot"),
    energyLossLabel: $(".energy-loss-label"),
    addCompareBtn: $("#add-compare-btn"),
    exportCsvBtn: $("#export-csv-btn"),
    exportPngBtn: $("#export-png-btn"),
    openReportBtn: $("#open-report-btn"),
    dataBody: $("#data-body"),
    dataHint: $("#data-hint"),
    compareDemoBtn: $("#compare-demo-btn"),
    compareAddBtn: $("#compare-add-btn"),
    compareList: $("#compare-list"),
    compareEmpty: $("#compare-empty"),
    compareAddEmpty: $("#compare-add-empty"),
    compareDemoEmpty: $("#compare-demo-empty"),
    compareClearBtn: $("#compare-clear-btn"),
    compareClearLabel: $("#compare-clear-label"),
    compareCountBadge: $("#compare-count-badge"),
    compareCanvas: $("#compare-canvas"),
    compareCanvasEmpty: $("#compare-canvas-empty"),
    compareEmptyText: $("#compare-canvas-empty span"),
    compareLegend: $("#compare-legend"),
    compareExportBtn: $("#compare-export-btn"),
    compareTableBody: $("#compare-table-body"),
    compareInsight: $("#compare-insight"),
    quizCounter: $("#quiz-counter"),
    quizProgress: $("#quiz-progress-bar"),
    quizQuestion: $("#quiz-question"),
    quizOptions: $("#quiz-options"),
    quizFeedback: $("#quiz-feedback"),
    quizScore: $("#quiz-score"),
    quizNext: $("#quiz-next"),
    quizBody: $(".quiz-body"),
    quizResult: $("#quiz-result"),
    quizResultTitle: $("#quiz-result-title"),
    quizResultText: $("#quiz-result-text"),
    quizRestart: $("#quiz-restart"),
    helpDialog: $("#help-dialog"),
    reportDialog: $("#report-dialog"),
    reportPreview: $("#report-preview"),
    saveReportPdfBtn: $("#save-report-pdf-btn"),
    saveReportPdfLabel: $("#save-report-pdf-label"),
    toastStack: $("#toast-stack"),
    liveMetricParents: {
      x: $("#live-x").closest(".live-metric"),
      y: $("#live-y").closest(".live-metric"),
      speed: $("#live-speed").closest(".live-metric"),
      angle: $("#live-angle").closest(".live-metric")
    }
  };

  const controlPairs = [
    { key: "v0", range: refs.v0Range, num: refs.v0Num, min: 5, max: 100, fill: (input) => setRangeFill(input) },
    { key: "angle", range: refs.angleRange, num: refs.angleNum, min: 0, max: 90, fill: (input) => setRangeFill(input) },
    { key: "y0", range: refs.heightRange, num: refs.heightNum, min: 0, max: 30, fill: (input) => setRangeFill(input) },
    { key: "wind", range: refs.windRange, num: refs.windNum, min: -20, max: 20, fill: (input) => setRangeFill(input) },
    { key: "targetDistance", range: refs.targetRange, num: refs.targetDistance, min: 5, max: 300, fill: (input) => setRangeFill(input) }
  ];
  const pairByKey = new Map(controlPairs.map((pair) => [pair.key, pair]));

  const quizQuestions = [
    {
      question: "Под каким углом к горизонту дальность броска с земли максимальна в вакууме?",
      options: ["30°", "45°", "60°", "90°"],
      answer: 1,
      explanation: "При y₀ = 0 дальность L = v₀²·sin 2α / g максимальна, когда sin 2α = 1, то есть при α = 45°."
    },
    {
      question: "Как изменяется горизонтальная проекция скорости снаряда в вакууме?",
      options: ["Уменьшается", "Остаётся постоянной", "Растёт", "В верхней точке равна нулю"],
      answer: 1,
      explanation: "В вакууме на снаряд действует только сила тяжести, направленная вертикально. Поэтому vx = v₀·cos α не меняется."
    },
    {
      question: "Снаряд брошен с земли под углами 30° и 60° с одинаковой начальной скоростью. Что верно?",
      options: [
        "Дальности равны, высоты различаются",
        "При 60° дальность больше",
        "При 30° дальность больше",
        "Траектории полностью совпадают"
      ],
      answer: 0,
      explanation: "Дополнительные углы α и 90° − α дают одинаковую дальность, но бросок под 60° поднимается выше и летит дольше."
    },
    {
      question: "Как сопротивление воздуха влияет на дальность при прочих равных условиях?",
      options: ["Увеличивает дальность", "Не влияет на неё", "Уменьшает дальность", "Зависит только от ускорения g"],
      answer: 2,
      explanation: "Сила сопротивления направлена против скорости снаряда. Она совершает отрицательную работу и уменьшает дальность полёта."
    }
  ];

  const state = {
    params: Physics.normalizeParams(Presets.cloneParams()),
    theme: readStorage(STORAGE.theme, "dark") === "light" ? "light" : "dark",
    sound: readStorage(STORAGE.sound, "off") === "on",
    show: loadShowPrefs(),
    activePreset: "classic",
    view: "lab",
    chartType: "trajectory",
    playback: {
      time: 0,
      playing: false,
      speed: 1
    },
    result: null,
    reference: null,
    target: null,
    compare: loadCompareShots(),
    comparePrepared: [],
    ui: {
      needsCompute: false,
      compareDirty: true,
      clearArmed: false,
      clearTimer: null
    },
    quiz: {
      index: 0,
      score: 0,
      answered: false,
      complete: false
    }
  };

  let scene;
  let mainChart;
  let compareChart;
  let lastFrameTime = 0;

  function setRangeFill(input) {
    if (!input) return;
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
    input.style.setProperty("--fill", `${clamp(percent, 0, 100)}%`);
  }

  function showToast(message, variant, duration) {
    if (!message) return;
    const type = variant || "success";
    const icons = { success: "check", warning: "alert", danger: "alert", info: "info" };
    while (refs.toastStack.children.length >= 2) {
      refs.toastStack.firstElementChild.remove();
    }
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${icons[type] || "info"}"></use></svg><span></span>`;
    toast.querySelector("span").textContent = message;
    refs.toastStack.appendChild(toast);
    const removeToast = () => {
      if (!toast.isConnected) return;
      toast.classList.add("is-leaving");
      window.setTimeout(() => toast.remove(), 240);
    };
    toast.addEventListener("click", removeToast);
    const timeout = duration || 2900;
    window.setTimeout(removeToast, timeout);
  }

  function downloadBlob(blob, filename) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 900);
  }

  function downloadCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      downloadBlob(blob, filename);
    }, "image/png");
  }

  function exportFileName(extension) {
    const v = Math.round(state.params.v0);
    const a = Math.round(state.params.angle);
    const suffix = state.params.dragEnabled ? "rk4" : "vacuum";
    return `ballistika_v${v}_a${a}_${suffix}.${extension}`;
  }

  function setTheme(theme) {
    state.theme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    if (refs.themeMeta) {
      refs.themeMeta.setAttribute("content", state.theme === "light" ? "#e9efe9" : "#08121c");
    }
    refs.themeToggle.setAttribute(
      "aria-label",
      state.theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"
    );
    state.ui.compareDirty = true;
    writeStorage(STORAGE.theme, state.theme);
  }

  function toggleTheme() {
    setTheme(state.theme === "dark" ? "light" : "dark");
  }

  function setControlsCollapsed(collapsed, moveFocus) {
    if (!refs.labGrid || !refs.controlsPanel || !refs.controlsToggleBtn) return;
    refs.labGrid.classList.toggle("is-controls-collapsed", collapsed);
    refs.controlsPanel.toggleAttribute("inert", collapsed);
    refs.controlsPanel.setAttribute("aria-hidden", collapsed ? "true" : "false");
    refs.controlsToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    refs.controlsToggleBtn.setAttribute(
      "aria-label",
      collapsed ? "Показать панель параметров" : "Свернуть панель параметров"
    );
    refs.controlsToggleBtn.setAttribute(
      "title",
      collapsed ? "Показать панель параметров" : "Свернуть панель параметров"
    );
    if (collapsed && moveFocus) refs.controlsToggleBtn.focus();
    if (scene) window.requestAnimationFrame(() => scene.resize());
  }

  function toggleControlsPanel() {
    const collapsed = !refs.labGrid.classList.contains("is-controls-collapsed");
    setControlsCollapsed(collapsed, collapsed);
  }

  function applySoundState() {
    document.body.dataset.sound = state.sound ? "on" : "off";
    Audio.setEnabled(state.sound);
    refs.soundToggle.setAttribute("aria-pressed", state.sound ? "true" : "false");
    refs.soundToggle.setAttribute(
      "aria-label",
      state.sound ? "Выключить звук" : "Включить звук"
    );
  }

  function toggleSound() {
    const next = !state.sound;
    state.sound = next;
    applySoundState();
    writeStorage(STORAGE.sound, next ? "on" : "off");
    if (next) Audio.play("click");
  }

  function markCustomPreset() {
    if (state.activePreset !== null) {
      state.activePreset = null;
      syncPresetUI();
    }
  }

  function resetPlaybackForEdit() {
    state.playback.playing = false;
    state.playback.time = 0;
    state.ui.needsCompute = true;
  }

  function syncPresetUI() {
    refs.presetButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === state.activePreset);
    });
    if (state.activePreset) {
      const preset = Presets.getPreset(state.activePreset);
      refs.presetHint.textContent = preset.hint;
    } else {
      refs.presetHint.textContent = "Свои настройки";
    }
  }

  function syncGravityChips() {
    refs.gravityChips.forEach((chip) => {
      chip.classList.toggle("is-active", Math.abs(Number(chip.dataset.gravity) - state.params.g) < 0.005);
    });
  }

  function syncEnvironmentUI() {
    refs.dragToggle.checked = state.params.dragEnabled;
    refs.windControl.classList.toggle("is-disabled", !state.params.dragEnabled);
    refs.windRange.disabled = !state.params.dragEnabled;
    refs.windNum.disabled = !state.params.dragEnabled;
    if (refs.referenceTool) refs.referenceTool.disabled = !state.params.dragEnabled;
    refs.airSummary.textContent = `снаряд · ${nf(state.params.mass, 2)} кг`;
    syncGravityChips();
  }

  function syncTargetUI() {
    refs.targetToggle.checked = state.params.targetEnabled;
    refs.targetControls.classList.toggle("is-disabled", !state.params.targetEnabled);
    Array.from(refs.targetControls.querySelectorAll("input, button")).forEach((control) => {
      control.disabled = !state.params.targetEnabled;
    });
    refs.targetChip.hidden = !state.params.targetEnabled;
    refs.targetChip.querySelector("span").textContent = `${nf(state.params.targetDistance, 0)} м`;
  }

  function syncToolButtons() {
    refs.toolButtons.forEach((button) => {
      const key = button.dataset.tool;
      const pressed = Boolean(state.show[key]);
      button.classList.toggle("is-active", pressed);
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
    if (refs.referenceTool) {
      refs.referenceTool.disabled = !state.params.dragEnabled;
      refs.referenceTool.title = state.params.dragEnabled
        ? "Показать путь без сопротивления"
        : "Доступно при включённом сопротивлении";
    }
  }

  function syncPairValue(pair) {
    const value = state.params[pair.key];
    pair.range.value = formatInput(value);
    pair.num.value = formatInput(value);
    setRangeFill(pair.range);
  }

  function syncControls() {
    controlPairs.forEach(syncPairValue);
    refs.gravityNum.value = formatInput(state.params.g);
    refs.massNum.value = formatInput(state.params.mass);
    refs.radiusNum.value = formatInput(state.params.radius);
    refs.cdNum.value = formatInput(state.params.cd);
    refs.rhoNum.value = formatInput(state.params.rho);
    refs.targetRadius.value = formatInput(state.params.targetRadius);
    syncPresetUI();
    syncEnvironmentUI();
    syncTargetUI();
    syncToolButtons();
    syncChartTabs();
  }

  function syncChartTabs() {
    refs.chartTabs.forEach((tab) => {
      const active = tab.dataset.chart === state.chartType;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function commitPairValue(pair, value, source) {
    if (!Number.isFinite(value)) return;
    const next = clamp(value, pair.min, pair.max);
    if (Math.abs(state.params[pair.key] - next) < 1e-10) {
      if (source !== "number") pair.num.value = formatInput(next);
      return;
    }
    state.params[pair.key] = next;
    pair.range.value = formatInput(next);
    if (source !== "number") pair.num.value = formatInput(next);
    setRangeFill(pair.range);
    markCustomPreset();
    resetPlaybackForEdit();
  }

  const simpleNumberFields = [
    { el: refs.gravityNum, key: "g", min: 0.5, max: 30, after: syncGravityChips },
    { el: refs.massNum, key: "mass", min: 0.02, max: 20, after: syncEnvironmentUI },
    { el: refs.radiusNum, key: "radius", min: 0.01, max: 1, after: syncEnvironmentUI },
    { el: refs.cdNum, key: "cd", min: 0.01, max: 2, after: null },
    { el: refs.rhoNum, key: "rho", min: 0.05, max: 2.5, after: null },
    { el: refs.targetRadius, key: "targetRadius", min: 0.5, max: 20, after: null }
  ];

  function handleNumberFieldInput(field) {
    const raw = field.el.value;
    if (raw === "" || raw === "-") return;
    const value = parseNumber(raw);
    if (!Number.isFinite(value) || value < field.min || value > field.max) return;
    if (Math.abs(state.params[field.key] - value) < 1e-10) return;
    state.params[field.key] = value;
    if (field.after) field.after();
    markCustomPreset();
    resetPlaybackForEdit();
  }

  function finalizeNumberField(field) {
    let value = parseNumber(field.el.value);
    if (!Number.isFinite(value)) value = state.params[field.key];
    value = clamp(value, field.min, field.max);
    field.el.value = formatInput(value);
    if (Math.abs(state.params[field.key] - value) > 1e-10) {
      state.params[field.key] = value;
      if (field.after) field.after();
      markCustomPreset();
      resetPlaybackForEdit();
    }
  }

  function applyPreset(id) {
    const preset = Presets.getPreset(id);
    state.params = Physics.normalizeParams(Presets.cloneParams(preset.params));
    state.activePreset = preset.id;
    resetPlaybackForEdit();
    syncControls();
  }

  function randomizeExperiment() {
    state.params = Physics.normalizeParams(Presets.randomParams());
    state.activePreset = null;
    resetPlaybackForEdit();
    syncControls();
    showToast(`Случайный эксперимент: ${nf(state.params.angle, 1)}° · ${nf(state.params.v0, 0)} м/с`, "info");
  }

  function autoAim() {
    refs.autoAimBtn.disabled = true;
    window.requestAnimationFrame(() => {
      const solved = Physics.solveAngleForTarget(Object.assign({}, state.params, { targetEnabled: true }));
      const angle = Math.round(solved.angle * 10) / 10;
      state.params.angle = angle;
      state.activePreset = null;
      resetPlaybackForEdit();
      syncControls();
      refs.autoAimBtn.disabled = false;
      if (solved.hit) {
        showToast(`Автоприцел: α = ${nf(angle, 1)}° · попадание`, "success");
      } else {
        showToast(`Цель недостижима: ближайшая дальность ${nf(solved.result.range, 1)} м`, "warning", 4600);
      }
    });
  }

  function handleDragAim(angle) {
    if (Math.abs(state.params.angle - angle) < 0.001) return;
    state.params.angle = clamp(angle, 0, 90);
    const pair = pairByKey.get("angle");
    if (pair) {
      pair.range.value = formatInput(state.params.angle);
      pair.num.value = formatInput(state.params.angle);
      setRangeFill(pair.range);
    }
    markCustomPreset();
    resetPlaybackForEdit();
  }

  function computeNow() {
    state.params = Physics.normalizeParams(state.params);
    state.result = Physics.simulate(state.params);
    state.reference = state.params.dragEnabled ? Physics.makeVacuumReference(state.params) : null;
    state.target = Physics.evaluateTarget(state.result, state.params);
    if (state.playback.time > state.result.totalTime) {
      state.playback.time = state.result.totalTime;
    }
    state.ui.needsCompute = false;
    updateResultUI();
    updateLiveUI();
    updateChartLegend();
  }

  function updateResultUI() {
    const result = state.result;
    const target = state.target;
    if (!result) return;

    refs.metricRange.textContent = nf(result.range, 1);
    refs.metricHmax.textContent = nf(result.maxHeight, 1);
    refs.metricTime.textContent = nf(result.totalTime, 2);
    refs.metricImpact.textContent = nf(result.impactSpeed, 1);
    refs.metricPath.textContent = `${nf(result.pathLength, 1)} м`;
    refs.metricApexTime.textContent = `${nf(result.maxHeightTime, 2)} с`;

    refs.targetResult.classList.remove("is-hit", "is-miss");
    if (!target.enabled) {
      refs.targetResult.textContent = "Выкл.";
      refs.targetResult.title = "Мишень выключена";
    } else if (target.hit) {
      refs.targetResult.textContent = "В цель";
      refs.targetResult.classList.add("is-hit");
      refs.targetResult.title = `Отклонение от центра: ${nf(target.distance, 2)} м · точность ${target.score}/3`;
    } else {
      refs.targetResult.textContent = "Промах";
      refs.targetResult.classList.add("is-miss");
      refs.targetResult.title = `Отклонение ${nf(target.distance, 1)} м · ${target.offset > 0 ? "перелёт" : "недолёт"}`;
    }

    refs.targetChip.hidden = !state.params.targetEnabled;
    refs.targetChip.querySelector("span").textContent = `${nf(state.params.targetDistance, 0)} м`;
    refs.stageReadouts.innerHTML = [
      `<span><b>α</b> ${nf(state.params.angle, state.params.angle % 1 ? 1 : 0)}°</span>`,
      `<span><b>v₀</b> ${nf(state.params.v0, state.params.v0 % 1 ? 1 : 0)} м/с</span>`,
      `<span><b>g</b> ${nf(state.params.g, 2)} м/с²</span>`
    ].join("");

    refs.timeTotal.textContent = result.totalTime > 0.001 ? `${nf(result.totalTime, 2)} с` : "—";
    refs.timeSlider.disabled = result.totalTime <= 0.001;
    if (refs.playBtn) refs.playBtn.disabled = result.totalTime <= 0.001;

    updateDataTable();

    if (!state.activePreset) {
      refs.airSummary.textContent = `снаряд · ${nf(state.params.mass, 2)} кг`;
    }
  }

  function updateDataTable() {
    if (!state.result) return;
    const result = state.result;
    let interval = 0.5;
    const intervals = [0.5, 1, 2, 5, 10, 20, 30];
    for (const candidate of intervals) {
      if (result.totalTime / candidate <= 22) {
        interval = candidate;
        break;
      }
      interval = candidate;
    }
    refs.dataHint.textContent = `каждые ${nf(interval, interval < 1 ? 1 : 0)} с`;
    const rows = Physics.tableSamples(result, interval);
    const visibleRows = rows.length > 24
      ? rows.slice(0, 23).concat([rows[rows.length - 1]])
      : rows;
    refs.dataBody.innerHTML = visibleRows.map((row) => (
      `<tr><td>${nf(row.t, 2)}</td><td>${nf(row.x, 1)}</td><td>${nf(row.y, 1)}</td><td>${nf(row.speed, 1)}</td></tr>`
    )).join("");
  }

  function updateChartLegend() {
    if (!state.result) return;
    let items = [];
    let note = "";
    if (state.chartType === "trajectory") {
      items.push(legendItem("Траектория", "var(--accent)"));
      if (state.params.dragEnabled && state.show.reference) {
        items.push(legendItem("Без сопротивления", "var(--teal)", { dashed: true }));
      }
      const referenceRange = state.params.dragEnabled && state.show.reference && state.reference ? state.reference.range : 0;
      const chartRange = Math.max(state.result.range, referenceRange, 1) * 1.05;
      if (state.params.targetEnabled && state.params.targetDistance <= chartRange) {
        items.push(legendItem("Мишень", "var(--rose)", { dot: true }));
      }
      note = `Дальность ${nf(state.result.range, 1)} м · Hmax ${nf(state.result.maxHeight, 1)} м`;
    } else if (state.chartType === "speed") {
      items = [
        legendItem("|v|", "var(--accent)"),
        legendItem("|vₓ|", "var(--teal)", { dashed: true }),
        legendItem("|vᵧ|", "var(--blue)", { dashed: true })
      ];
      note = `Скорость удара ${nf(state.result.impactSpeed, 1)} м/с`;
    } else {
      items = [
        legendItem("Eк", "var(--accent)"),
        legendItem("Eп", "var(--teal)"),
        legendItem("Eполн", "var(--text-2)")
      ];
      note = state.params.dragEnabled
        ? "Сопротивление и воздушные потоки меняют полную энергию"
        : "Полная механическая энергия сохраняется";
    }
    refs.chartLegend.innerHTML = items.join("");
    refs.chartNote.textContent = note;
  }

  function legendItem(label, color, options) {
    const opts = options || {};
    const classes = ["legend-swatch"];
    if (opts.dashed) classes.push("is-dashed");
    if (opts.dot) classes.push("is-dot");
    return `<span class="legend-item"><span class="${classes.join(" ")}" style="--legend-color:${color}"></span>${escapeHTML(label)}</span>`;
  }

  function formatEnergy(value) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) >= 1000) return `${nf(value / 1000, 2)} кДж`;
    return `${nf(value, 0)} Дж`;
  }

  function updateEnergy(current) {
    const start = state.result.start;
    const initial = 0.5 * state.params.mass * start.speed * start.speed + state.params.mass * state.params.g * start.y;
    const kinetic = 0.5 * state.params.mass * current.speed * current.speed;
    const potential = state.params.mass * state.params.g * current.y;
    const total = kinetic + potential;
    const base = Math.max(initial, total, 1e-6);
    const lost = Math.max(0, initial - total);
    const gained = Math.max(0, total - initial);

    refs.energyKinetic.style.width = `${clamp((kinetic / base) * 100, 0, 100)}%`;
    refs.energyPotential.style.width = `${clamp((potential / base) * 100, 0, 100)}%`;
    refs.energyLost.style.width = `${clamp((lost / base) * 100, 0, 100)}%`;
    refs.energyKValue.textContent = formatEnergy(kinetic);
    refs.energyPValue.textContent = formatEnergy(potential);

    if (lost > Math.max(0.01, initial * 0.001)) {
      refs.energyLossLabel.hidden = false;
      refs.energyLossText.textContent = "Потери";
      refs.energyLossDot.className = "dot dot--lost";
      refs.energyLValue.textContent = formatEnergy(lost);
    } else if (gained > Math.max(0.01, initial * 0.001)) {
      refs.energyLossLabel.hidden = false;
      refs.energyLossText.textContent = "Приток от воздуха";
      refs.energyLossDot.className = "dot dot--potential";
      refs.energyLValue.textContent = formatEnergy(gained);
    } else {
      refs.energyLossLabel.hidden = true;
    }

    refs.energyState.classList.toggle("is-drag", state.params.dragEnabled);
    if (!state.params.dragEnabled) {
      refs.energyState.textContent = "Сохраняется";
    } else if (gained > Math.max(0.01, initial * 0.001)) {
      refs.energyState.textContent = "Приток от воздуха";
    } else {
      refs.energyState.textContent = "Диссипация";
    }
  }

  function updateLiveUI() {
    if (!state.result) return;
    const result = state.result;
    const time = clamp(state.playback.time, 0, result.totalTime);
    const current = Physics.interpolateState(result.samples, time);
    if (!current) return;
    const finished = result.totalTime > 0 && time >= result.totalTime - 1e-6;
    const atStart = time <= 1e-6;
    const playing = state.playback.playing;
    const targetHit = state.target && state.target.enabled && state.target.hit;

    refs.liveX.textContent = nf(current.x, 1);
    refs.liveY.textContent = nf(current.y, 1);
    refs.liveSpeed.textContent = nf(current.speed, 1);
    refs.liveAngle.textContent = nf(current.angle, 0);

    refs.liveMetricParents.x.style.setProperty("--level", `${clamp((current.x / Math.max(1, result.range)) * 100, 2, 100)}%`);
    refs.liveMetricParents.y.style.setProperty("--level", `${clamp((current.y / Math.max(1, result.maxHeight)) * 100, 2, 100)}%`);
    refs.liveMetricParents.speed.style.setProperty("--level", `${clamp((current.speed / Math.max(1, result.impactSpeed, state.params.v0)) * 100, 2, 100)}%`);
    refs.liveMetricParents.angle.style.setProperty("--level", `${clamp(current.angle / 90 * 100, 2, 100)}%`);

    updateEnergy(current);

    let stateLabel = "Готов к запуску";
    let sceneMode = "ready";
    let flightLabel = "НА ЗЕМЛЕ";
    if (playing) {
      stateLabel = "В полёте";
      sceneMode = "flying";
      flightLabel = "В ПОЛЁТЕ";
    } else if (finished) {
      stateLabel = targetHit ? "В цель" : "Приземление";
      sceneMode = targetHit ? "hit" : "finished";
      flightLabel = "ФИНИШ";
    } else if (!atStart) {
      stateLabel = "Пауза";
      sceneMode = "paused";
      flightLabel = "ПАУЗА";
    }

    refs.sceneStateText.textContent = stateLabel;
    refs.sceneState.classList.toggle("is-flying", sceneMode === "flying");
    refs.sceneState.classList.toggle("is-hit", sceneMode === "hit");
    refs.flightState.textContent = flightLabel;
    refs.flightState.classList.toggle("is-flying", sceneMode === "flying" || sceneMode === "paused");
    refs.flightState.classList.toggle("is-hit", sceneMode === "hit");

    refs.sceneClock.textContent = `t = ${nf(time, 2)} с`;
    refs.timeCurrent.textContent = `${nf(time, 2)} с`;
    refs.timeTotal.textContent = result.totalTime > 0.001 ? `${nf(result.totalTime, 2)} с` : "—";
    const fraction = result.totalTime > 0 ? time / result.totalTime : 0;
    refs.timeSlider.value = String(clamp(fraction, 0, 1));
    refs.timeSlider.style.setProperty("--fill", `${fraction * 100}%`);

    refs.playBtn.classList.toggle("is-playing", playing);
    refs.playBtn.setAttribute("aria-label", playing ? "Пауза" : "Воспроизвести");
    refs.aimHint.classList.toggle("is-hidden", playing || !atStart || state.view !== "lab");

    const launchLabel = refs.launchBtn.querySelector(".btn__labels strong");
    const launchIcon = refs.launchBtn.querySelector("use");
    if (playing) {
      if (launchLabel) launchLabel.textContent = "Пауза";
      if (launchIcon) launchIcon.setAttribute("href", "#i-pause");
    } else if (!atStart && !finished) {
      if (launchLabel) launchLabel.textContent = "Продолжить";
      if (launchIcon) launchIcon.setAttribute("href", "#i-play");
    } else {
      if (launchLabel) launchLabel.textContent = "Запустить";
      if (launchIcon) launchIcon.setAttribute("href", "#i-rocket");
    }
    refs.launchBtn.setAttribute("aria-label", playing ? "Пауза" : "Запустить полёт");
  }

  function buildView() {
    return {
      params: state.params,
      result: state.result,
      reference: state.params.dragEnabled && state.show.reference ? state.reference : null,
      target: state.target,
      show: state.show,
      theme: state.theme,
      time: state.playback.time,
      playing: state.playback.playing,
      interactive: state.view === "lab" && !state.playback.playing,
      type: state.chartType
    };
  }

  function startPlayback() {
    if (!state.result || state.result.totalTime <= 0.001) {
      showToast("Для начала полёта задайте угол или высоту запуска", "warning");
      return;
    }
    if (state.playback.time >= state.result.totalTime - 1e-6) {
      state.playback.time = 0;
    }
    const wasAtStart = state.playback.time <= 0.01;
    state.playback.playing = true;
    if (wasAtStart) Audio.play("launch");
    updateLiveUI();
  }

  function pausePlayback() {
    state.playback.playing = false;
    updateLiveUI();
  }

  function togglePlayback() {
    if (state.playback.playing) pausePlayback();
    else startPlayback();
  }

  function resetFlight() {
    state.playback.playing = false;
    state.playback.time = 0;
    updateLiveUI();
  }

  function onFlightFinished() {
    if (!state.result) return;
    Audio.play("impact");
    if (state.target && state.target.enabled && state.target.hit) {
      Audio.play("hit");
      showToast(`В цель! Дальность ${nf(state.result.range, 1)} м`, "success", 4200);
    } else if (state.target && state.target.enabled) {
      const direction = state.target.offset > 0 ? "перелёт" : "недолёт";
      showToast(`Приземление на ${nf(state.result.range, 1)} м · ${direction} ${nf(state.target.distance, 1)} м`, "warning", 4400);
    } else {
      showToast(`Полёт завершён: ${nf(state.result.range, 1)} м за ${nf(state.result.totalTime, 2)} с`, "info");
    }
  }

  function handleLaunchButton() {
    if (state.playback.playing) {
      pausePlayback();
      return;
    }
    startPlayback();
  }

  function setChartType(type) {
    if (type !== "trajectory" && type !== "speed" && type !== "energy") return;
    state.chartType = type;
    syncChartTabs();
    mainChart.hideHover();
    updateChartLegend();
  }

  function toggleShowOption(key) {
    if (!(key in state.show)) return;
    state.show[key] = !state.show[key];
    syncToolButtons();
    updateChartLegend();
    writeStorage(STORAGE.show, JSON.stringify(state.show));
  }

  function switchView(viewName) {
    if (!refs.views[viewName] || state.view === viewName) return;
    if (state.playback.playing) pausePlayback();
    state.view = viewName;
    Object.entries(refs.views).forEach(([name, element]) => {
      const active = name === viewName;
      element.hidden = !active;
      element.classList.toggle("is-active", active);
    });
    refs.navTabs.forEach((tab) => {
      const active = tab.dataset.view === viewName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    mainChart.hideHover();
    if (viewName === "lab") {
      updateLiveUI();
      window.requestAnimationFrame(() => scene.resize());
    } else if (viewName === "compare") {
      state.ui.compareDirty = true;
      window.requestAnimationFrame(() => renderCompare());
    } else if (viewName === "theory") {
      const view = refs.views.theory;
      if (view) view.scrollTop = 0;
    }
  }

  function compareColor() {
    const used = new Set(state.compare.map((shot) => shot.color.toLowerCase()));
    let color = COMPARE_COLORS.find((candidate) => !used.has(candidate.toLowerCase()));
    if (!color) color = COMPARE_COLORS[state.compare.length % COMPARE_COLORS.length];
    return color;
  }

  function currentShotLabel() {
    let base = "Свой бросок";
    if (state.activePreset) base = Presets.getPreset(state.activePreset).label;
    const angle = nf(state.params.angle, state.params.angle % 1 ? 1 : 0);
    return `${base} · ${angle}°`;
  }

  function saveCompare() {
    const payload = state.compare.map((shot) => ({
      label: shot.label,
      color: shot.color,
      params: shot.params,
      visible: shot.visible
    }));
    writeStorage(STORAGE.compare, JSON.stringify(payload));
  }

  function updateCompareCounts() {
    const count = state.compare.length;
    refs.navCompareCount.textContent = String(count);
    refs.navCompareCount.classList.toggle("is-visible", count > 0);
    if (refs.compareCountBadge) refs.compareCountBadge.textContent = `${count} / ${COMPARE_LIMIT}`;
    refs.compareClearBtn.disabled = count === 0;
    if (count === 0) resetClearArm();
  }

  function addCurrentShot() {
    if (state.compare.length >= COMPARE_LIMIT) {
      showToast(`В журнале уже ${COMPARE_LIMIT} броска — удалите один, чтобы добавить новый`, "warning", 4200);
      return;
    }
    state.compare.push({
      id: newId(),
      label: currentShotLabel(),
      color: compareColor(),
      params: Object.assign({}, state.params),
      visible: true
    });
    saveCompare();
    updateCompareCounts();
    resetClearArm();
    if (state.view === "compare") renderCompare();
    else state.ui.compareDirty = true;
    showToast("Бросок добавлен в сравнение", "success");
  }

  function loadDemoShots() {
    if (state.compare.length >= COMPARE_LIMIT) {
      showToast(`Журнал заполнен (${COMPARE_LIMIT} из ${COMPARE_LIMIT})`, "warning");
      return;
    }
    const existing = new Set(state.compare.map((shot) => shot.label));
    let added = 0;
    for (const demo of Presets.DEMO_SHOTS) {
      if (state.compare.length >= COMPARE_LIMIT) break;
      if (existing.has(demo.label)) continue;
      state.compare.push({
        id: newId(),
        label: demo.label,
        color: state.compare.some((shot) => shot.color.toLowerCase() === demo.color.toLowerCase())
          ? compareColor()
          : demo.color,
        params: Physics.normalizeParams(demo.params),
        visible: true
      });
      existing.add(demo.label);
      added += 1;
    }
    if (!added) {
      showToast("Примеры уже есть в журнале", "info");
      return;
    }
    saveCompare();
    updateCompareCounts();
    resetClearArm();
    if (state.view === "compare") renderCompare();
    else state.ui.compareDirty = true;
    showToast(`Добавлено примеров: ${added}`, "success");
  }

  function prepareCompareShots() {
    return state.compare.map((shot, index) => {
      const params = Physics.normalizeParams(shot.params);
      return Object.assign({}, shot, {
        index,
        params,
        result: Physics.simulate(params)
      });
    });
  }

  function renderCompare() {
    const prepared = prepareCompareShots();
    state.comparePrepared = prepared;
    const visible = prepared.filter((shot) => shot.visible);

    refs.compareList.innerHTML = prepared.map((shot) => {
      const flags = [];
      flags.push(shot.params.dragEnabled
        ? '<span class="compare-flag is-accent">воздух</span>'
        : '<span class="compare-flag">вакуум</span>');
      if (shot.params.dragEnabled && Math.abs(shot.params.wind) > 0.01) {
        flags.push(`<span class="compare-flag">ветер ${nf(shot.params.wind, 1)} м/с</span>`);
      }
      if (Math.abs(shot.params.g - 9.81) > 0.01) {
        flags.push(`<span class="compare-flag">g ${nf(shot.params.g, 2)}</span>`);
      }
      if (shot.params.y0 > 0) {
        flags.push(`<span class="compare-flag">h₀ ${nf(shot.params.y0, 1)} м</span>`);
      }
      return `
        <article class="compare-item ${shot.visible ? "" : "is-hidden-shot"}" style="--compare-color:${shot.color}" data-id="${shot.id}">
          <div class="compare-item__top">
            <span class="compare-dot" aria-hidden="true"></span>
            <div class="compare-item__name">
              <strong title="${escapeHTML(shot.label)}">${escapeHTML(shot.label)}</strong>
              <small>${nf(shot.params.v0, 1)} м/с · y₀ ${nf(shot.params.y0, 1)} м</small>
            </div>
            <div class="compare-item__tools">
              <button type="button" data-action="visibility" aria-label="${shot.visible ? "Скрыть" : "Показать"} траекторию" title="${shot.visible ? "Скрыть" : "Показать"}">
                <svg class="icon" aria-hidden="true"><use href="#i-${shot.visible ? "eye" : "eye-off"}"></use></svg>
              </button>
              <button type="button" data-action="remove" aria-label="Удалить бросок" title="Удалить">
                <svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>
              </button>
            </div>
          </div>
          <div class="compare-item__stats">
            <span>Дальность <b>${nf(shot.result.range, 1)} м</b></span>
            <span>Высота <b>${nf(shot.result.maxHeight, 1)} м</b></span>
            <span>Время <b>${nf(shot.result.totalTime, 2)} с</b></span>
          </div>
          <div class="compare-item__flags">${flags.join("")}</div>
        </article>`;
    }).join("");

    refs.compareEmpty.hidden = prepared.length > 0;
    refs.compareList.hidden = prepared.length === 0;
    refs.compareCountBadge.textContent = `${prepared.length} / ${COMPARE_LIMIT}`;
    refs.compareCanvasEmpty.hidden = visible.length > 0;
    if (!visible.length) {
      refs.compareEmptyText.textContent = prepared.length ? "Все траектории скрыты" : "Здесь появятся траектории";
    }

    refs.compareLegend.innerHTML = visible.map((shot) => (
      legendItem(shot.label, shot.color)
    )).join("");

    if (!prepared.length) {
      refs.compareTableBody.innerHTML = '<tr class="table-placeholder"><td colspan="7">Журнал экспериментов пуст</td></tr>';
    } else {
      refs.compareTableBody.innerHTML = prepared.map((shot) => `
        <tr class="${shot.visible ? "" : "is-hidden-shot"}">
          <td><span class="table-shot"><i style="--shot-color:${shot.color}"></i>${escapeHTML(shot.label)}</span></td>
          <td>${nf(shot.params.v0, 1)}</td>
          <td>${nf(shot.params.angle, 1)}</td>
          <td>${nf(shot.result.range, 1)}</td>
          <td>${nf(shot.result.maxHeight, 1)}</td>
          <td>${nf(shot.result.totalTime, 2)}</td>
          <td>${nf(shot.result.impactSpeed, 1)}</td>
        </tr>`).join("");
    }

    if (!visible.length) {
      refs.compareInsight.textContent = prepared.length ? "Все траектории скрыты" : "Добавьте хотя бы один бросок";
    } else if (visible.length === 1) {
      refs.compareInsight.textContent = `${visible[0].label}: ${nf(visible[0].result.range, 1)} м за ${nf(visible[0].result.totalTime, 2)} с`;
    } else {
      const maxShot = visible.reduce((best, shot) => (shot.result.range > best.result.range ? shot : best), visible[0]);
      const minShot = visible.reduce((best, shot) => (shot.result.range < best.result.range ? shot : best), visible[0]);
      const spread = maxShot.result.range - minShot.result.range;
      refs.compareInsight.textContent = `Максимум дальности — «${maxShot.label}»: ${nf(maxShot.result.range, 1)} м · разброс ${nf(spread, 1)} м`;
    }

    updateCompareCounts();
    if (state.view === "compare") {
      compareChart.render({
        shots: visible.map((shot) => ({
          label: shot.label,
          color: shot.color,
          result: shot.result
        })),
        theme: state.theme
      });
      state.ui.compareDirty = false;
    } else {
      state.ui.compareDirty = true;
    }
  }

  function removeCompareShot(id) {
    const before = state.compare.length;
    state.compare = state.compare.filter((shot) => shot.id !== id);
    if (state.compare.length === before) return;
    saveCompare();
    updateCompareCounts();
    resetClearArm();
    if (state.view === "compare") renderCompare();
    else state.ui.compareDirty = true;
    showToast("Бросок удалён из журнала", "info");
  }

  function toggleCompareVisibility(id) {
    const shot = state.compare.find((item) => item.id === id);
    if (!shot) return;
    shot.visible = !shot.visible;
    saveCompare();
    renderCompare();
  }

  function resetClearArm() {
    if (state.ui.clearTimer) {
      window.clearTimeout(state.ui.clearTimer);
      state.ui.clearTimer = null;
    }
    state.ui.clearArmed = false;
    refs.compareClearBtn.classList.remove("is-armed");
    if (refs.compareClearLabel) refs.compareClearLabel.textContent = "Очистить журнал";
  }

  function handleClearCompare() {
    if (!state.compare.length) return;
    if (!state.ui.clearArmed) {
      state.ui.clearArmed = true;
      refs.compareClearBtn.classList.add("is-armed");
      if (refs.compareClearLabel) refs.compareClearLabel.textContent = "Нажмите ещё раз";
      state.ui.clearTimer = window.setTimeout(() => resetClearArm(), 2600);
      return;
    }
    state.compare = [];
    saveCompare();
    resetClearArm();
    updateCompareCounts();
    renderCompare();
    showToast("Журнал сравнения очищен", "info");
  }

  function buildCompareView() {
    const prepared = prepareCompareShots();
    const visible = prepared.filter((shot) => shot.visible);
    return {
      shots: visible.map((shot) => ({
        label: shot.label,
        color: shot.color,
        result: shot.result
      })),
      theme: state.theme
    };
  }

  function exportCompare() {
    if (!buildCompareView().shots.length) {
      showToast("Сначала добавьте хотя бы одну видимую траекторию", "warning");
      return;
    }
    const canvas = compareChart.exportCanvas(buildCompareView(), 1600);
    downloadCanvas(canvas, "ballistika_compare.png");
    showToast("Сравнение сохранено в PNG", "success");
  }

  function exportScene() {
    const view = buildView();
    const canvas = scene.exportCanvas(view, 1600);
    downloadCanvas(canvas, exportFileName("png"));
    showToast("Снимок сцены сохранён", "success");
  }

  function exportChart() {
    const canvas = mainChart.exportCanvas(buildView(), 1500);
    downloadCanvas(canvas, `ballistika_chart_${state.chartType}.png`);
    showToast("График сохранён в PNG", "success");
  }

  function exportCsv() {
    if (!state.result) return;
    const csv = `\ufeff${Physics.csvFromResult(state.result)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, exportFileName("csv"));
    showToast("Данные полёта сохранены в CSV", "success");
  }

  function formatWind(value) {
    if (Math.abs(value) < 0.01) return "штиль";
    return value > 0 ? `попутный, ${nf(value, 1)} м/с` : `встречный, ${nf(Math.abs(value), 1)} м/с`;
  }

  function reportConclusion() {
    const p = state.params;
    const r = state.result;
    const sentences = [];
    sentences.push(
      `При начальной скорости v₀ = ${nf(p.v0, 1)} м/с, угле α = ${nf(p.angle, 1)}° и высоте запуска y₀ = ${nf(p.y0, 1)} м снаряд пролетел ${nf(r.range, 1)} м за ${nf(r.totalTime, 2)} с.`
    );
    sentences.push(
      `Максимальная высота траектории составила ${nf(r.maxHeight, 1)} м, а скорость в момент приземления — ${nf(r.impactSpeed, 1)} м/с.`
    );
    if (p.dragEnabled && state.reference) {
      const decrease = state.reference.range - r.range;
      const percent = state.reference.range > 0 ? Math.abs(decrease / state.reference.range * 100) : 0;
      const windText = Math.abs(p.wind) < 0.01 ? "при отсутствии ветра" : `при ${formatWind(p.wind)}`;
      sentences.push(
        `В численной модели ${windText} дальность оказалась ${decrease >= 0 ? "меньше" : "больше"} идеальной на ${nf(Math.abs(decrease), 1)} м (${nf(percent, 1)}%). Сила сопротивления воздуха направлена против скорости снаряда относительно воздуха.`
      );
    } else {
      sentences.push("Результат соответствует аналитической модели движения в однородном поле тяжести без сопротивления воздуха.");
    }
    if (p.targetEnabled) {
      if (state.target.hit) {
        sentences.push(`Наземная мишень на расстоянии ${nf(p.targetDistance, 0)} м поражена; отклонение от центра — ${nf(state.target.distance, 2)} м.`);
      } else {
        sentences.push(`Мишень на расстоянии ${nf(p.targetDistance, 0)} м не поражена: ${state.target.offset > 0 ? "перелёт" : "недолёт"} составил ${nf(state.target.distance, 1)} м.`);
      }
    }
    return sentences.join(" ");
  }

  function buildReportHtml() {
    const p = state.params;
    const r = state.result;
    const date = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());

    const exportView = buildView();
    exportView.time = r.totalTime;
    exportView.playing = false;
    exportView.interactive = false;
    const sceneCanvas = scene.exportCanvas(exportView, 1400);
    const sceneImage = sceneCanvas.toDataURL("image/jpeg", 0.92);

    const sampleInterval = r.totalTime > 0 ? Math.max(0.2, r.totalTime / 5) : 0;
    const sampleRows = Physics.tableSamples(r, sampleInterval || 0.5).slice(0, 7);
    const sampleHtml = sampleRows.map((row) => `
      <tr><td>${nf(row.t, 2)}</td><td>${nf(row.x, 1)}</td><td>${nf(row.y, 1)}</td><td>${nf(row.speed, 1)}</td></tr>
    `).join("");

    const modelText = p.dragEnabled ? "численная модель RK4 с сопротивлением воздуха" : "аналитическая модель без сопротивления воздуха";
    const environmentHtml = p.dragEnabled
      ? `Сопротивление воздуха: включено · ветер: ${formatWind(p.wind)} · масса: ${nf(p.mass, 2)} кг · радиус: ${nf(p.radius, 2)} м · C<sub>d</sub>: ${nf(p.cd, 2)} · ρ: ${nf(p.rho, 3)} кг/м³`
      : "Сопротивление воздуха: выключено · модель свободного падения";

    const targetHtml = !p.targetEnabled
      ? "Мишень в эксперименте не использовалась."
      : state.target.hit
        ? `Мишень на ${nf(p.targetDistance, 0)} м поражена. Отклонение от центра: ${nf(state.target.distance, 2)} м.`
        : `Мишень на ${nf(p.targetDistance, 0)} м не поражена. ${state.target.offset > 0 ? "Перелёт" : "Недолёт"}: ${nf(state.target.distance, 1)} м.`;

    const formulas = p.dragEnabled
      ? [
        `<div class="report-formula">F<sub>сопр</sub> = ½ · ρ · C<sub>d</sub> · A · |v<sub>отн</sub>| · v<sub>отн</sub></div>`,
        `<div class="report-formula">v<sub>отн</sub> = v − w; &nbsp; A = πr²</div>`,
        `<div class="report-formula">a<sub>x</sub> = −k|v<sub>отн</sub>|v<sub>x,отн</sub>, &nbsp; a<sub>y</sub> = −g − k|v<sub>отн</sub>|v<sub>y</sub></div>`,
        `<div class="report-formula">k = ρC<sub>d</sub>A / (2m) · шаг интегрирования 0,005 с</div>`
      ]
      : [
        `<div class="report-formula">x(t) = v₀·cos α·t</div>`,
        `<div class="report-formula">y(t) = y₀ + v₀·sin α·t − ½gt²</div>`,
        `<div class="report-formula">L = v₀·cos α·T</div>`,
        `<div class="report-formula">H<sub>max</sub> = y₀ + v₀²sin²α / (2g)</div>`
      ];

    return `
      <article class="report-doc">
        <div class="report-doc__head">
          <div>
            <div class="report-doc__brand">
              <img src="${REPORT_LOGO_DATA_URL}" alt="">
              <div><strong>БАЛЛИСТИКА</strong><span>интерактивная лаборатория движения</span></div>
            </div>
            <h1 class="report-doc__title">Отчёт об эксперименте</h1>
          </div>
          <div class="report-doc__date">${escapeHTML(date)}</div>
        </div>
        <div class="report-doc__meta">
          <p class="report-note"><strong>Автор:</strong> _________________________ &nbsp;&nbsp; <strong>Класс:</strong> ________ &nbsp;&nbsp; <strong>Работа:</strong> движение тела, брошенного под углом к горизонту</p>
          <h3>Цель работы</h3>
          <p class="report-note">Исследовать кинематические характеристики полёта тела, брошенного под углом к горизонту, и оценить влияние сопротивления воздуха и ветра на траекторию.</p>
          <h3>Условия эксперимента</h3>
          <div class="report-params">
            <div class="report-param"><span>Начальная скорость</span><b>${nf(p.v0, 1)} м/с</b></div>
            <div class="report-param"><span>Угол броска</span><b>${nf(p.angle, 1)}°</b></div>
            <div class="report-param"><span>Высота запуска</span><b>${nf(p.y0, 1)} м</b></div>
            <div class="report-param"><span>Ускорение g</span><b>${nf(p.g, 2)} м/с²</b></div>
          </div>
          <p class="report-note" style="margin-top:8px">${environmentHtml}. Модель: ${modelText}.</p>
          <h3>Результаты</h3>
          <div class="report-results">
            <div class="report-result"><span>Дальность</span><b>${nf(r.range, 1)} <small>м</small></b></div>
            <div class="report-result"><span>Максимальная высота</span><b>${nf(r.maxHeight, 1)} <small>м</small></b></div>
            <div class="report-result"><span>Время полёта</span><b>${nf(r.totalTime, 2)} <small>с</small></b></div>
            <div class="report-result"><span>Скорость удара</span><b>${nf(r.impactSpeed, 1)} <small>м/с</small></b></div>
          </div>
          <p class="report-note" style="margin-top:9px">${escapeHTML(targetHtml)}</p>
          <h3>Снимок эксперимента</h3>
          <figure class="report-scene"><img src="${sceneImage}" alt="Траектория полёта снаряда"></figure>
          <h3>Использованные соотношения</h3>
          <div class="report-formulas">${formulas.join("")}</div>
          <h3>Выборка данных</h3>
          <table class="report-table">
            <thead><tr><th>t, с</th><th>x, м</th><th>y, м</th><th>v, м/с</th></tr></thead>
            <tbody>${sampleHtml}</tbody>
          </table>
          <h3>Вывод</h3>
          <p class="report-note">${escapeHTML(reportConclusion())}</p>
          <p class="report-note report-disclaimer">Модель рассматривает снаряд как материальную точку, использует плоскую Землю и не учитывает вращение снаряда, эффект Магнуса и изменение плотности воздуха с высотой.</p>
        </div>
        <div class="report-doc__foot">
          <span>Сформировано в интерактивной лаборатории «Баллистика»</span>
          <span>Подпись: ____________________</span>
        </div>
      </article>`;
  }

  function openReport() {
    refs.reportPreview.innerHTML = buildReportHtml();
    if (!refs.reportDialog.open) refs.reportDialog.showModal();
  }

  function pdfAvoidRanges(reportDoc, canvasWidth) {
    const docRect = reportDoc.getBoundingClientRect();
    const scale = canvasWidth / Math.max(1, docRect.width);
    return Array.from(reportDoc.querySelectorAll(".report-scene, .report-params, .report-results, .report-formulas, .report-table"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: (rect.top - docRect.top) * scale,
          bottom: (rect.bottom - docRect.top) * scale
        };
      })
      .sort((a, b) => a.top - b.top);
  }

  function pdfWhitespaceCut(ctx, target, pageStart, avoidRanges) {
    const availableBack = Math.max(0, target - pageStart - 24);
    const searchDistance = Math.min(availableBack, Math.round((target - pageStart) * 0.38));
    if (searchDistance < 4) return target;
    const searchStart = Math.floor(target - searchDistance);
    const height = Math.ceil(target) - searchStart;
    if (height < 2) return target;

    const width = ctx.canvas.width;
    let strip;
    try {
      strip = ctx.getImageData(0, searchStart, width, height).data;
    } catch (error) {
      return target;
    }
    const inAvoidRange = (y) => avoidRanges.some((range) => y > range.top + 2 && y < range.bottom - 2);

    for (let row = height - 1; row >= 1; row -= 1) {
      const y = searchStart + row;
      if (inAvoidRange(y)) continue;
      let isWhite = true;
      for (let x = 0; x < width; x += 2) {
        const index = (row * width + x) * 4;
        if (strip[index] < 249 || strip[index + 1] < 249 || strip[index + 2] < 249) {
          isWhite = false;
          break;
        }
      }
      if (isWhite) return y;
    }
    return target;
  }

  function pdfPageCuts(canvas, pageHeightPx, avoidRanges) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const cuts = [0];
    let start = 0;
    let guard = 0;

    while (start < canvas.height - 2 && guard < 80) {
      guard += 1;
      const ideal = Math.min(canvas.height, start + pageHeightPx);
      if (ideal >= canvas.height - 2) {
        cuts.push(canvas.height);
        break;
      }

      let target = ideal;
      for (let i = 0; i < 6; i += 1) {
        const blocking = avoidRanges.find((range) => target > range.top + 2 && target < range.bottom - 2);
        if (!blocking) break;
        target = Math.max(start + 30, blocking.top - 12);
      }

      const cut = pdfWhitespaceCut(ctx, target, start, avoidRanges);
      const safeCut = cut > start + 60 ? cut : ideal;
      cuts.push(Math.round(Math.min(canvas.height, safeCut)));
      start = safeCut;
    }

    if (cuts[cuts.length - 1] < canvas.height) cuts.push(canvas.height);
    return cuts;
  }

  async function saveReportPdf() {
    if (!refs.reportDialog.open || !refs.reportPreview.querySelector(".report-doc")) return;
    if (refs.saveReportPdfBtn.disabled) return;
    if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) {
      showToast("Не удалось загрузить библиотеку PDF", "danger", 4200);
      return;
    }

    const button = refs.saveReportPdfBtn;
    const label = refs.saveReportPdfLabel;
    const originalLabel = "Сохранить PDF";
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    if (label) label.textContent = "Готовим PDF…";
    let stage = null;

    try {
      const source = refs.reportPreview.querySelector(".report-doc");
      stage = document.createElement("div");
      stage.className = "pdf-export-stage";
      stage.setAttribute("aria-hidden", "true");
      const clone = source.cloneNode(true);
      stage.appendChild(clone);
      document.body.appendChild(stage);

      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

      const canvas = await window.html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: 1280,
        windowHeight: 1800,
        scrollX: 0,
        scrollY: 0
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const pxPerMm = canvas.width / contentWidth;
      const pageHeightPx = contentHeight * pxPerMm;
      const avoidRanges = pdfAvoidRanges(clone, canvas.width);
      const cuts = pdfPageCuts(canvas, pageHeightPx, avoidRanges);
      const pageCount = Math.max(1, cuts.length - 1);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      pdf.setProperties({
        title: "Ballistika - report",
        subject: "Projectile motion experiment",
        creator: "Ballistika"
      });

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        if (pageIndex > 0) pdf.addPage();
        const top = Math.round(cuts[pageIndex]);
        const bottom = Math.round(cuts[pageIndex + 1]);
        const sliceHeight = Math.max(1, bottom - top);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const pageCtx = pageCanvas.getContext("2d");
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(canvas, 0, top, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const imageData = pageCanvas.toDataURL("image/png");
        const imageHeightMm = sliceHeight / pxPerMm;
        pdf.addImage(imageData, "PNG", margin, margin, contentWidth, imageHeightMm, undefined, "FAST");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(128, 141, 135);
        pdf.text(`Ballistika · ${pageIndex + 1} / ${pageCount}`, pageWidth / 2, pageHeight - 4, { align: "center" });
      }

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`Ballistika_Otchet_${date}.pdf`);
      if (label) label.textContent = "PDF сохранён";
      window.setTimeout(() => {
        if (label) label.textContent = originalLabel;
      }, 1800);
      showToast("PDF-отчёт сохранён", "success");
    } catch (error) {
      console.error("PDF export failed", error);
      if (label) label.textContent = "Ошибка PDF";
      window.setTimeout(() => {
        if (label) label.textContent = originalLabel;
      }, 2200);
      showToast("Не удалось сохранить PDF", "danger", 4200);
    } finally {
      if (stage) stage.remove();
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  function initQuiz() {
    state.quiz = { index: 0, score: 0, answered: false, complete: false };
    refs.quizResult.hidden = true;
    refs.quizBody.hidden = false;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const index = state.quiz.index;
    const question = quizQuestions[index];
    refs.quizQuestion.textContent = question.question;
    refs.quizOptions.innerHTML = question.options.map((option, optionIndex) => (
      `<button class="quiz-option" type="button" data-option="${optionIndex}">
        <span class="quiz-option__letter">${["А", "Б", "В", "Г"][optionIndex]}</span>
        <span>${escapeHTML(option)}</span>
      </button>`
    )).join("");
    refs.quizFeedback.hidden = true;
    refs.quizFeedback.classList.remove("is-correct", "is-wrong");
    refs.quizFeedback.innerHTML = "";
    refs.quizCounter.textContent = `${index + 1} / ${quizQuestions.length}`;
    refs.quizProgress.style.width = `${(index / quizQuestions.length) * 100}%`;
    refs.quizScore.textContent = `Верно: ${state.quiz.score}`;
    refs.quizNext.disabled = true;
    refs.quizNext.textContent = index === quizQuestions.length - 1 ? "Результат" : "Дальше";
    refs.quizBody.hidden = false;
    refs.quizResult.hidden = true;
    state.quiz.answered = false;
  }

  function answerQuiz(optionIndex) {
    if (state.quiz.answered || state.quiz.complete) return;
    const question = quizQuestions[state.quiz.index];
    state.quiz.answered = true;
    const correct = optionIndex === question.answer;
    if (correct) state.quiz.score += 1;

    $$(".quiz-option", refs.quizOptions).forEach((button, index) => {
      button.disabled = true;
      if (index === question.answer) button.classList.add("is-correct");
      if (index === optionIndex && !correct) button.classList.add("is-wrong");
    });

    refs.quizFeedback.hidden = false;
    refs.quizFeedback.classList.toggle("is-correct", correct);
    refs.quizFeedback.classList.toggle("is-wrong", !correct);
    refs.quizFeedback.innerHTML = correct
      ? `<strong>Верно.</strong> ${escapeHTML(question.explanation)}`
      : `<strong>Не совсем.</strong> Правильный ответ — ${escapeHTML(question.options[question.answer])}. ${escapeHTML(question.explanation)}`;
    refs.quizProgress.style.width = `${((state.quiz.index + 1) / quizQuestions.length) * 100}%`;
    refs.quizScore.textContent = `Верно: ${state.quiz.score}`;
    refs.quizNext.disabled = false;
  }

  function nextQuizStep() {
    if (!state.quiz.answered) return;
    if (state.quiz.index === quizQuestions.length - 1) {
      finishQuiz();
      return;
    }
    state.quiz.index += 1;
    renderQuizQuestion();
  }

  function finishQuiz() {
    state.quiz.complete = true;
    refs.quizBody.hidden = true;
    refs.quizResult.hidden = false;
    refs.quizProgress.style.width = "100%";
    refs.quizCounter.textContent = `${quizQuestions.length} / ${quizQuestions.length}`;
    const score = state.quiz.score;
    let title = "Стоит повторить";
    let text = "Перечитайте блоки с формулами и попробуйте ещё раз — главное здесь понять, как связаны угол, скорость и дальность.";
    if (score === quizQuestions.length) {
      title = "Безупречно";
      text = "Все четыре ответа верны. Вы уверенно ориентируетесь в идеальной и численной моделях баллистики.";
    } else if (score === quizQuestions.length - 1) {
      title = "Хороший результат";
      text = `Верных ответов: ${score} из ${quizQuestions.length}. Осталось уточнить одну деталь — загляните в теорию.`;
    } else if (score === 2) {
      title = "Половина пути";
      text = "Базовая идея ясна. Повторите оптимальный угол, независимость движений и роль сопротивления воздуха.";
    }
    refs.quizResultTitle.textContent = title;
    refs.quizResultText.textContent = `${text} Результат: ${score} из ${quizQuestions.length}.`;
  }

  function updateThemeUI() {
    refs.themeToggle.setAttribute(
      "aria-label",
      state.theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"
    );
  }

  function openHelp() {
    if (!refs.helpDialog.open) refs.helpDialog.showModal();
  }

  function toggleFullscreen() {
    const doc = document;
    if (!doc.fullscreenElement) {
      const target = doc.documentElement;
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => showToast("Полноэкранный режим недоступен", "warning"));
      }
    } else if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    }
  }

  function bindEvents() {
    refs.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => switchView(tab.dataset.view));
    });
    if (refs.brand) {
      refs.brand.addEventListener("click", (event) => {
        event.preventDefault();
        switchView("lab");
      });
    }

    refs.themeToggle.addEventListener("click", toggleTheme);
    refs.soundToggle.addEventListener("click", toggleSound);
    refs.controlsToggleBtn.addEventListener("click", toggleControlsPanel);
    refs.fullscreenBtn.addEventListener("click", toggleFullscreen);
    refs.helpBtn.addEventListener("click", openHelp);
    refs.headerReportBtn.addEventListener("click", openReport);
    refs.openReportBtn.addEventListener("click", openReport);
    refs.saveReportPdfBtn.addEventListener("click", saveReportPdf);

    refs.presetButtons.forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });
    refs.randomizeBtn.addEventListener("click", randomizeExperiment);

    controlPairs.forEach((pair) => {
      pair.range.addEventListener("input", () => {
        commitPairValue(pair, parseNumber(pair.range.value), "range");
      });
      pair.num.addEventListener("input", () => {
        const value = parseNumber(pair.num.value);
        if (!Number.isFinite(value) || value < pair.min || value > pair.max) return;
        commitPairValue(pair, value, "number");
      });
      const finalize = () => {
        let value = parseNumber(pair.num.value);
        if (!Number.isFinite(value)) value = state.params[pair.key];
        value = clamp(value, pair.min, pair.max);
        pair.num.value = formatInput(value);
        commitPairValue(pair, value, "number");
        syncPairValue(pair);
      };
      pair.num.addEventListener("change", finalize);
      pair.num.addEventListener("blur", finalize);
    });

    simpleNumberFields.forEach((field) => {
      field.el.addEventListener("input", () => handleNumberFieldInput(field));
      field.el.addEventListener("change", () => finalizeNumberField(field));
      field.el.addEventListener("blur", () => finalizeNumberField(field));
    });

    refs.gravityChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const value = Number(chip.dataset.gravity);
        if (!Number.isFinite(value)) return;
        state.params.g = value;
        refs.gravityNum.value = formatInput(value);
        syncGravityChips();
        markCustomPreset();
        resetPlaybackForEdit();
      });
    });

    refs.dragToggle.addEventListener("change", () => {
      state.params.dragEnabled = refs.dragToggle.checked;
      syncEnvironmentUI();
      updateChartLegend();
      markCustomPreset();
      resetPlaybackForEdit();
      if (state.params.dragEnabled) {
        showToast("Включена численная модель с сопротивлением воздуха", "info");
      }
    });

    refs.targetToggle.addEventListener("change", () => {
      state.params.targetEnabled = refs.targetToggle.checked;
      syncTargetUI();
      markCustomPreset();
      resetPlaybackForEdit();
    });

    refs.autoAimBtn.addEventListener("click", autoAim);
    refs.launchBtn.addEventListener("click", handleLaunchButton);
    refs.resetBtn.addEventListener("click", resetFlight);
    refs.playBtn.addEventListener("click", togglePlayback);

    refs.timeSlider.addEventListener("input", () => {
      if (!state.result || state.result.totalTime <= 0) return;
      state.playback.playing = false;
      state.playback.time = state.result.totalTime * clamp(Number(refs.timeSlider.value), 0, 1);
      updateLiveUI();
    });

    refs.speedSelect.addEventListener("change", () => {
      const value = Number(refs.speedSelect.value);
      state.playback.speed = Number.isFinite(value) ? value : 1;
    });

    refs.toolButtons.forEach((button) => {
      button.addEventListener("click", () => toggleShowOption(button.dataset.tool));
    });
    refs.sceneExportBtn.addEventListener("click", exportScene);

    refs.chartTabs.forEach((tab) => {
      tab.addEventListener("click", () => setChartType(tab.dataset.chart));
    });
    refs.chartDownload.addEventListener("click", exportChart);

    refs.addCompareBtn.addEventListener("click", addCurrentShot);
    refs.exportCsvBtn.addEventListener("click", exportCsv);
    refs.exportPngBtn.addEventListener("click", exportScene);

    refs.compareAddBtn.addEventListener("click", addCurrentShot);
    refs.compareAddEmpty.addEventListener("click", addCurrentShot);
    refs.compareDemoBtn.addEventListener("click", loadDemoShots);
    refs.compareDemoEmpty.addEventListener("click", loadDemoShots);
    refs.compareClearBtn.addEventListener("click", handleClearCompare);
    refs.compareExportBtn.addEventListener("click", exportCompare);
    refs.compareList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const item = button.closest("[data-id]");
      if (!item) return;
      const id = item.dataset.id;
      if (button.dataset.action === "remove") removeCompareShot(id);
      else if (button.dataset.action === "visibility") toggleCompareVisibility(id);
    });

    refs.quizOptions.addEventListener("click", (event) => {
      const option = event.target.closest("[data-option]");
      if (!option) return;
      answerQuiz(Number(option.dataset.option));
    });
    refs.quizNext.addEventListener("click", nextQuizStep);
    refs.quizRestart.addEventListener("click", initQuiz);

    $$("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = document.getElementById(button.dataset.closeDialog);
        if (dialog && dialog.open) dialog.close();
      });
    });
    [refs.helpDialog, refs.reportDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target && target.closest("input, select, textarea, [contenteditable='true']")) return;
      if (document.querySelector("dialog[open]")) return;
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (event.code === "Space") {
        if (state.view !== "lab" || (target && target.closest("button, a"))) return;
        event.preventDefault();
        togglePlayback();
      } else if (key === "r" && state.view === "lab") {
        event.preventDefault();
        resetFlight();
      } else if (key === "v" && state.view === "lab") {
        event.preventDefault();
        toggleShowOption("vectors");
      } else if (key === "g" && state.view === "lab") {
        event.preventDefault();
        toggleShowOption("grid");
      } else if (key === "t") {
        event.preventDefault();
        toggleTheme();
      } else if (key === "f") {
        event.preventDefault();
        toggleFullscreen();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      refs.fullscreenBtn.setAttribute(
        "aria-label",
        document.fullscreenElement ? "Выйти из полноэкранного режима" : "Полноэкранный режим"
      );
    });

    window.addEventListener("resize", () => {
      state.ui.compareDirty = true;
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        state.ui.compareDirty = true;
        if (scene) scene.resize();
      }
    });
  }

  function loop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const dt = Math.min(0.06, Math.max(0, (timestamp - lastFrameTime) / 1000));
    lastFrameTime = timestamp;

    if (state.ui.needsCompute) computeNow();

    if (state.playback.playing && state.view === "lab" && state.result) {
      const total = state.result.totalTime;
      const nextTime = state.playback.time + dt * state.playback.speed;
      if (total <= 0.001) {
        state.playback.playing = false;
      } else if (nextTime >= total) {
        state.playback.time = total;
        state.playback.playing = false;
        onFlightFinished();
        updateLiveUI();
      } else {
        state.playback.time = nextTime;
      }
    }

    if (state.view === "lab") {
      const view = buildView();
      scene.render(view);
      mainChart.render(view);
      updateLiveUI();
    } else if (state.view === "compare" && state.ui.compareDirty) {
      renderCompare();
    }

    window.requestAnimationFrame(loop);
  }

  function init() {
    setTheme(state.theme);
    setControlsCollapsed(false, false);
    updateThemeUI();
    applySoundState();
    syncControls();

    scene = SceneFactory.create(refs.sceneCanvas, {
      onAim: handleDragAim,
      onDragChange: (dragging) => {
        if (dragging) refs.aimHint.classList.add("is-hidden");
      }
    });
    mainChart = Charts.createMain(refs.chartCanvas, refs.chartTooltip);
    compareChart = Charts.createCompare(refs.compareCanvas);

    computeNow();
    initQuiz();
    bindEvents();
    renderCompare();
    window.requestAnimationFrame(loop);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        state.ui.compareDirty = true;
        if (scene) scene.resize();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
