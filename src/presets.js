(function registerPresets(root) {
  "use strict";

  const P = root.Ballistics.Physics;

  const BASE = Object.freeze({
    v0: 32,
    angle: 45,
    y0: 1.5,
    g: 9.81,
    dragEnabled: false,
    wind: 0,
    mass: 0.45,
    radius: 0.11,
    cd: 0.47,
    rho: 1.225,
    targetEnabled: true,
    targetDistance: 106,
    targetRadius: 3
  });

  const PRESETS = [
    {
      id: "classic",
      label: "Классика",
      hint: "45° · вакуум",
      description: "Идеальная парабола: максимальная дальность при броске с земли.",
      params: Object.assign({}, BASE, {
        angle: 45,
        targetDistance: 106
      })
    },
    {
      id: "flat",
      label: "Настильный",
      hint: "20° · быстро",
      description: "Малый угол, большая горизонтальная скорость и короткое время полёта.",
      params: Object.assign({}, BASE, {
        v0: 45,
        angle: 20,
        targetDistance: 137
      })
    },
    {
      id: "arc",
      label: "Высокая арка",
      hint: "65° · пик",
      description: "Крутая траектория с большой высотой и продолжительным полётом.",
      params: Object.assign({}, BASE, {
        v0: 28,
        angle: 65,
        y0: 2,
        targetDistance: 62
      })
    },
    {
      id: "drag",
      label: "Сопротивление",
      hint: "мяч + ветер",
      description: "Реальная модель: сила сопротивления и попутный ветер заметно меняют траекторию.",
      params: Object.assign({}, BASE, {
        v0: 38,
        angle: 42,
        dragEnabled: true,
        wind: 4,
        targetDistance: 59
      })
    }
  ];

  const DEMO_SHOTS = [
    {
      label: "30° · настильный",
      color: "#5eead4",
      params: Object.assign({}, BASE, {
        v0: 32,
        angle: 30,
        y0: 0,
        targetEnabled: false
      })
    },
    {
      label: "60° · высокий",
      color: "#82aaff",
      params: Object.assign({}, BASE, {
        v0: 32,
        angle: 60,
        y0: 0,
        targetEnabled: false
      })
    },
    {
      label: "45° · с воздухом",
      color: "#ffa45c",
      params: Object.assign({}, BASE, {
        v0: 32,
        angle: 45,
        y0: 0,
        dragEnabled: true,
        wind: 0,
        mass: 0.45,
        radius: 0.11,
        cd: 0.47,
        targetEnabled: false
      })
    }
  ];

  function cloneParams(params) {
    return Object.assign({}, BASE, params || {});
  }

  function getPreset(id) {
    return PRESETS.find((preset) => preset.id === id) || PRESETS[0];
  }

  function randomParams() {
    const v0 = Math.round(24 + Math.random() * 26);
    const angle = Math.round(22 + Math.random() * 48);
    const y0 = Math.round(Math.random() * 16) / 2;
    const g = 9.81;
    const dragEnabled = Math.random() < 0.28;
    const base = cloneParams({
      v0,
      angle,
      y0,
      g,
      dragEnabled,
      wind: dragEnabled ? Math.round((Math.random() * 12 - 3) * 2) / 2 : 0,
      mass: 0.45,
      radius: 0.11,
      cd: 0.47,
      rho: 1.225,
      targetEnabled: true
    });
    const result = P.simulate(base);
    const targetDistance = Math.max(10, Math.round(result.range));
    base.targetDistance = targetDistance;
    base.targetRadius = 3;
    return base;
  }

  root.Ballistics = root.Ballistics || {};
  root.Ballistics.Presets = {
    BASE,
    PRESETS,
    DEMO_SHOTS,
    cloneParams,
    getPreset,
    randomParams
  };
}(window));
