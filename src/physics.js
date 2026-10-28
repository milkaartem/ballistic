(function registerPhysics(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.Ballistics = root.Ballistics || {};
    root.Ballistics.Physics = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createPhysics() {
  "use strict";

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const MAX_TIME = 180;

  const DEFAULTS = Object.freeze({
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
    targetDistance: 60,
    targetRadius: 3
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeParams(input) {
    const p = Object.assign({}, DEFAULTS, input || {});
    return {
      v0: clamp(numberOr(p.v0, DEFAULTS.v0), 0.1, 250),
      angle: clamp(numberOr(p.angle, DEFAULTS.angle), 0, 90),
      y0: clamp(numberOr(p.y0, DEFAULTS.y0), 0, 500),
      g: clamp(numberOr(p.g, DEFAULTS.g), 0.05, 50),
      dragEnabled: Boolean(p.dragEnabled),
      wind: clamp(numberOr(p.wind, DEFAULTS.wind), -100, 100),
      mass: clamp(numberOr(p.mass, DEFAULTS.mass), 0.005, 100),
      radius: clamp(numberOr(p.radius, DEFAULTS.radius), 0.005, 10),
      cd: clamp(numberOr(p.cd, DEFAULTS.cd), 0.001, 5),
      rho: clamp(numberOr(p.rho, DEFAULTS.rho), 0, 20),
      targetEnabled: Boolean(p.targetEnabled),
      targetDistance: clamp(numberOr(p.targetDistance, DEFAULTS.targetDistance), 0.1, 5000),
      targetRadius: clamp(numberOr(p.targetRadius, DEFAULTS.targetRadius), 0.1, 100)
    };
  }

  function dragFactor(p) {
    const area = Math.PI * p.radius * p.radius;
    return (0.5 * p.rho * p.cd * area) / p.mass;
  }

  function makeState(t, x, y, vx, vy, ax, ay) {
    return {
      t,
      x,
      y,
      vx,
      vy,
      ax,
      ay,
      speed: Math.hypot(vx, vy),
      angle: Math.abs(Math.atan2(vy, vx)) * RAD
    };
  }

  function finishResult(mode, params, samples, extra) {
    let maxHeight = samples.length ? samples[0].y : 0;
    let maxHeightTime = 0;
    let pathLength = 0;
    let previous = samples[0] || null;

    for (let i = 0; i < samples.length; i += 1) {
      const point = samples[i];
      if (point.y > maxHeight) {
        maxHeight = point.y;
        maxHeightTime = point.t;
      }
      if (previous && i > 0) {
        pathLength += Math.hypot(point.x - previous.x, point.y - previous.y);
      }
      previous = point;
    }

    const last = samples[samples.length - 1] || makeState(0, 0, params.y0, 0, 0, 0, -params.g);
    const impactAngle = last.speed > 1e-9
      ? Math.abs(Math.atan2(last.vy, last.vx)) * RAD
      : 0;

    const result = {
      model: mode,
      params,
      samples,
      start: samples[0] || makeState(0, 0, params.y0, 0, 0, 0, -params.g),
      impact: last,
      totalTime: last.t,
      range: last.x,
      maxHeight,
      maxHeightTime,
      impactSpeed: last.speed,
      impactAngle,
      pathLength,
      dragFactor: params.dragEnabled ? dragFactor(params) : 0,
      truncated: false
    };

    Object.assign(result, extra || {});
    return result;
  }

  function simulateVacuum(input) {
    const p = normalizeParams(input);
    const angle = p.angle * DEG;
    const vx = p.v0 * Math.cos(angle);
    const vy = p.v0 * Math.sin(angle);
    const discriminant = Math.max(0, vy * vy + 2 * p.g * p.y0);
    const totalTime = (vy + Math.sqrt(discriminant)) / p.g;

    if (totalTime <= 1e-8) {
      const initial = makeState(0, 0, p.y0, vx, vy, 0, -p.g);
      return finishResult("vacuum", p, [initial]);
    }

    const sampleCount = clamp(Math.ceil(totalTime / 0.02), 24, 2400);
    const samples = [];
    for (let i = 0; i <= sampleCount; i += 1) {
      const t = totalTime * (i / sampleCount);
      const x = vx * t;
      const y = Math.max(0, p.y0 + vy * t - 0.5 * p.g * t * t);
      samples.push(makeState(
        i === sampleCount ? totalTime : t,
        x,
        y,
        vx,
        vy - p.g * t,
        0,
        -p.g
      ));
    }

    return finishResult("vacuum", p, samples, { analyticTime: totalTime });
  }

  function simulateDrag(input, options) {
    const p = normalizeParams(input);
    const opts = options || {};
    const angle = p.angle * DEG;
    const k = dragFactor(p);
    const sampleInterval = Math.max(0.006, numberOr(opts.sampleInterval, 0.012));
    const vacuumEstimate = (p.v0 * Math.sin(angle) + Math.sqrt(
      Math.pow(p.v0 * Math.sin(angle), 2) + 2 * p.g * p.y0
    )) / p.g;
    const maxTime = Math.min(MAX_TIME, Math.max(12, vacuumEstimate * 1.6 + 4));
    const requestedStep = numberOr(opts.dt, 0.005);
    const h = Math.min(requestedStep, Math.max(0.002, maxTime / 16000));

    function acceleration(vx, vy) {
      const relX = vx - p.wind;
      const relSpeed = Math.hypot(relX, vy);
      const coefficient = k * relSpeed;
      return {
        ax: -coefficient * relX,
        ay: -p.g - coefficient * vy
      };
    }

    const initialVx = p.v0 * Math.cos(angle);
    const initialVy = p.v0 * Math.sin(angle);
    const initialAcc = acceleration(initialVx, initialVy);
    const initial = makeState(0, 0, p.y0, initialVx, initialVy, initialAcc.ax, initialAcc.ay);

    if (p.y0 <= 0 && initialVy <= 0) {
      return finishResult("drag", p, [initial], { truncated: false });
    }

    const samples = [initial];
    let t = 0;
    let x = 0;
    let y = p.y0;
    let vx = initialVx;
    let vy = initialVy;
    let lastRecordedT = 0;
    let truncated = false;

    for (let step = 0; step < 80000; step += 1) {
      const prev = { t, x, y, vx, vy };

      // RK4 для системы (x, y, vx, vy)
      const a1 = acceleration(vx, vy);
      const k1x = vx;
      const k1y = vy;
      const k1vx = a1.ax;
      const k1vy = a1.ay;

      const a2 = acceleration(vx + 0.5 * h * k1vx, vy + 0.5 * h * k1vy);
      const k2x = vx + 0.5 * h * k1vx;
      const k2y = vy + 0.5 * h * k1vy;
      const k2vx = a2.ax;
      const k2vy = a2.ay;

      const a3 = acceleration(vx + 0.5 * h * k2vx, vy + 0.5 * h * k2vy);
      const k3x = vx + 0.5 * h * k2vx;
      const k3y = vy + 0.5 * h * k2vy;
      const k3vx = a3.ax;
      const k3vy = a3.ay;

      const a4 = acceleration(vx + h * k3vx, vy + h * k3vy);
      const k4x = vx + h * k3vx;
      const k4y = vy + h * k3vy;
      const k4vx = a4.ax;
      const k4vy = a4.ay;

      const nextX = x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      const nextY = y + (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      const nextVx = vx + (h / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx);
      const nextVy = vy + (h / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy);
      const nextT = t + h;

      if (nextY <= 0) {
        const fraction = clamp(prev.y / Math.max(1e-12, prev.y - nextY), 0, 1);
        const impactT = prev.t + h * fraction;
        const impactX = prev.x + (nextX - prev.x) * fraction;
        const impactVx = prev.vx + (nextVx - prev.vx) * fraction;
        const impactVy = prev.vy + (nextVy - prev.vy) * fraction;
        const impactAcc = acceleration(impactVx, impactVy);
        const impact = makeState(
          impactT,
          impactX,
          0,
          impactVx,
          impactVy,
          impactAcc.ax,
          impactAcc.ay
        );

        if (samples.length > 1 && Math.abs(impact.t - lastRecordedT) < 1e-9) {
          samples[samples.length - 1] = impact;
        } else if (impact.t > samples[samples.length - 1].t + 1e-9) {
          samples.push(impact);
        }
        t = impactT;
        x = impactX;
        y = 0;
        vx = impactVx;
        vy = impactVy;
        break;
      }

      x = nextX;
      y = nextY;
      vx = nextVx;
      vy = nextVy;
      t = nextT;

      if (t - lastRecordedT >= sampleInterval) {
        const acc = acceleration(vx, vy);
        samples.push(makeState(t, x, y, vx, vy, acc.ax, acc.ay));
        lastRecordedT = t;
      }

      if (t >= maxTime) {
        const acc = acceleration(vx, vy);
        if (t > samples[samples.length - 1].t) {
          samples.push(makeState(t, x, y, vx, vy, acc.ax, acc.ay));
        }
        truncated = true;
        break;
      }
    }

    return finishResult("drag", p, samples, { truncated });
  }

  function simulate(input, options) {
    const p = normalizeParams(input);
    if (!p.dragEnabled) return simulateVacuum(p);
    return simulateDrag(p, options);
  }

  function interpolateState(samples, time) {
    if (!samples || samples.length === 0) return null;
    const last = samples[samples.length - 1];
    if (time <= 0) return samples[0];
    if (time >= last.t) return last;

    let low = 0;
    let high = samples.length - 1;
    while (low + 1 < high) {
      const mid = (low + high) >> 1;
      if (samples[mid].t <= time) low = mid;
      else high = mid;
    }

    const a = samples[low];
    const b = samples[high];
    const span = b.t - a.t;
    if (span <= 1e-12) return b;
    const f = clamp((time - a.t) / span, 0, 1);

    return makeState(
      time,
      a.x + (b.x - a.x) * f,
      a.y + (b.y - a.y) * f,
      a.vx + (b.vx - a.vx) * f,
      a.vy + (b.vy - a.vy) * f,
      a.ax + (b.ax - a.ax) * f,
      a.ay + (b.ay - a.ay) * f
    );
  }

  function evaluateTarget(result, input) {
    const p = normalizeParams(input || result.params);
    if (!p.targetEnabled) {
      return { enabled: false, hit: false, offset: 0, score: 0, direction: "" };
    }

    const offset = result.range - p.targetDistance;
    const distance = Math.abs(offset);
    const hit = distance <= p.targetRadius;
    const ratio = distance / Math.max(1e-9, p.targetRadius);
    let score = 0;
    if (hit) score = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;

    return {
      enabled: true,
      hit,
      score,
      offset,
      distance,
      relative: ratio,
      direction: distance < 1e-9 ? "exact" : offset > 0 ? "over" : "under",
      targetDistance: p.targetDistance,
      targetRadius: p.targetRadius
    };
  }

  function tableSamples(result, interval) {
    const step = Math.max(0.01, numberOr(interval, 0.5));
    if (!result || !result.samples.length) return [];
    if (result.totalTime <= 0.01) return [result.samples[0]];

    const rows = [];
    for (let t = 0; t < result.totalTime - 1e-9; t += step) {
      rows.push(interpolateState(result.samples, t));
    }
    rows.push(result.impact);
    return rows;
  }

  function optimalVacuumAngle(input) {
    const p = normalizeParams(input);
    return Math.atan(p.v0 / Math.sqrt(p.v0 * p.v0 + 2 * p.g * p.y0)) * RAD;
  }

  function makeVacuumReference(input) {
    const p = normalizeParams(input);
    return simulateVacuum(Object.assign({}, p, { dragEnabled: false, wind: 0 }));
  }

  /**
   * Подбирает угол для наземной мишени. Для модели с сопротивлением
   * выполняется численный поиск по диапазону углов.
   */
  function solveAngleForTarget(input) {
    const p = normalizeParams(input);
    const target = p.targetDistance;
    const optimized = Object.assign({}, p, { targetEnabled: false });
    let bestAngle = p.angle;
    let bestError = Infinity;
    let bestResult = null;
    const hits = [];

    function test(angle, dt) {
      const params = Object.assign({}, optimized, { angle });
      const result = simulate(params, { dt });
      const error = Math.abs(result.range - target);
      if (error < bestError) {
        bestError = error;
        bestAngle = angle;
        bestResult = result;
      }
      return error;
    }

    for (let angle = 1; angle <= 89; angle += 1) {
      const error = test(angle, 0.022);
      if (error <= p.targetRadius) hits.push(angle);
    }

    for (let angle = Math.max(1, bestAngle - 1); angle <= Math.min(89, bestAngle + 1); angle += 0.1) {
      test(Number(angle.toFixed(2)), 0.012);
    }

    let chosen = bestAngle;
    if (hits.length) {
      const sorted = hits.slice().sort((a, b) => Math.abs(a - p.angle) - Math.abs(b - p.angle));
      for (const candidate of sorted) {
        const exactError = test(candidate, 0.006);
        if (exactError <= p.targetRadius) {
          chosen = candidate;
          break;
        }
      }
    }

    const finalParams = Object.assign({}, p, { angle: chosen });
    const finalResult = simulate(finalParams);
    const finalError = Math.abs(finalResult.range - target);

    return {
      angle: chosen,
      error: finalError,
      hit: finalError <= p.targetRadius,
      result: finalResult,
      searchResult: bestResult
    };
  }

  function csvFromResult(result) {
    const rows = [
      ["time_s", "x_m", "y_m", "vx_ms", "vy_ms", "speed_ms", "angle_deg"],
      ...result.samples.map((s) => [
        s.t.toFixed(4),
        s.x.toFixed(4),
        s.y.toFixed(4),
        s.vx.toFixed(4),
        s.vy.toFixed(4),
        s.speed.toFixed(4),
        s.angle.toFixed(3)
      ])
    ];
    return rows.map((row) => row.join(",")).join("\r\n");
  }

  return {
    DEG,
    RAD,
    DEFAULTS,
    normalizeParams,
    simulate,
    simulateVacuum,
    simulateDrag,
    interpolateState,
    evaluateTarget,
    tableSamples,
    optimalVacuumAngle,
    makeVacuumReference,
    solveAngleForTarget,
    dragFactor,
    csvFromResult
  };
}));
