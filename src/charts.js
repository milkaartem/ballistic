(function registerCharts(root) {
  "use strict";

  const P = root.Ballistics.Physics;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function niceStep(maxValue, targetCount) {
    if (!Number.isFinite(maxValue) || maxValue <= 0) return 1;
    const rough = maxValue / Math.max(2, targetCount);
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / power;
    let nice = 1;
    if (normalized > 5) nice = 10;
    else if (normalized > 2) nice = 5;
    else if (normalized > 1) nice = 2;
    return nice * power;
  }

  function formatTick(value, step) {
    if (Math.abs(value) < 1e-9) return "0";
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
    return value.toFixed(decimals).replace(".", ",");
  }

  function formatValue(value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1).replace(".", ",") + "k";
    }
    return value.toFixed(digits == null ? 1 : digits).replace(".", ",");
  }

  function getChartPalette(theme) {
    if (theme === "light") {
      return {
        text: "rgba(27, 63, 52, 0.82)",
        muted: "rgba(52, 89, 76, 0.45)",
        grid: "rgba(24, 61, 49, 0.085)",
        axis: "rgba(31, 72, 59, 0.25)",
        accent: "#d96b2b",
        teal: "#078d7b",
        blue: "#3f6fce",
        white: "#17332a",
        rose: "#c45160",
        target: "#c45160",
        areaTop: "rgba(217, 107, 43, 0.18)",
        areaBottom: "rgba(217, 107, 43, 0)",
        tooltipBg: "#fbfcf8",
        tooltipLine: "rgba(24, 61, 49, 0.15)",
        background: "#f6f9f3"
      };
    }
    return {
      text: "rgba(231, 246, 242, 0.86)",
      muted: "rgba(189, 222, 218, 0.45)",
      grid: "rgba(160, 211, 216, 0.09)",
      axis: "rgba(179, 221, 218, 0.23)",
      accent: "#ffa45c",
      teal: "#5eead4",
      blue: "#82aaff",
      white: "#eef7f5",
      rose: "#ff93a2",
      target: "#ff93a2",
      areaTop: "rgba(255, 164, 92, 0.16)",
      areaBottom: "rgba(255, 164, 92, 0)",
      tooltipBg: "#0b1822",
      tooltipLine: "rgba(169, 212, 215, 0.16)",
      background: "#08141d"
    };
  }

  function prepareCanvas(canvas, width, height) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawGrid(ctx, plot, xStep, yStep, xMax, yMax, palette, opts) {
    const options = opts || {};
    ctx.save();
    ctx.font = '8.5px "JetBrains Mono", monospace';
    ctx.textBaseline = "middle";
    ctx.lineWidth = 1;
    for (let v = 0; v <= xMax + 1e-9; v += xStep) {
      const x = plot.left + (v / xMax) * plot.width;
      if (x > plot.left + plot.width + 1) continue;
      ctx.strokeStyle = palette.grid;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(x, plot.top);
      ctx.lineTo(x, plot.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = palette.muted;
      ctx.textAlign = "center";
      ctx.fillText(formatTick(v, xStep), x, plot.bottom + 13);
    }
    for (let v = 0; v <= yMax + 1e-9; v += yStep) {
      const y = plot.bottom - (v / yMax) * plot.height;
      if (y < plot.top - 1) continue;
      ctx.strokeStyle = palette.grid;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.left + plot.width, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = palette.muted;
      ctx.textAlign = "right";
      ctx.fillText(formatTick(v, yStep), plot.left - 7, y);
    }
    ctx.strokeStyle = palette.axis;
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.bottom + 0.5);
    ctx.lineTo(plot.left + plot.width, plot.bottom + 0.5);
    ctx.moveTo(plot.left + 0.5, plot.top);
    ctx.lineTo(plot.left + 0.5, plot.bottom);
    ctx.stroke();

    if (options.xUnit) {
      ctx.fillStyle = palette.muted;
      ctx.textAlign = "right";
      ctx.font = '7.5px "JetBrains Mono", monospace';
      ctx.fillText(options.xUnit, plot.left + plot.width, plot.bottom + 25);
    }
    if (options.yUnit) {
      ctx.textAlign = "left";
      ctx.font = '7.5px "JetBrains Mono", monospace';
      ctx.fillText(options.yUnit, plot.left, plot.top - 8);
    }
    ctx.restore();
  }

  function drawTimeCurrent(ctx, plot, xTime, totalTime, palette, opts) {
    if (!Number.isFinite(totalTime) || totalTime <= 1e-9) return;
    const options = opts || {};
    const x = plot.left + clamp(xTime / totalTime, 0, 1) * plot.width;
    ctx.save();
    ctx.strokeStyle = options.color || palette.accent;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x, plot.top);
    ctx.lineTo(x, plot.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = options.color || palette.accent;
    ctx.beginPath();
    ctx.arc(x, plot.top - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function linePath(ctx, points, plot, xScale, yScale, xOf, yOf) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(plot.left + xScale(xOf(points[0])), plot.bottom - yScale(yOf(points[0])));
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(plot.left + xScale(xOf(points[i])), plot.bottom - yScale(yOf(points[i])));
    }
    ctx.stroke();
  }

  function decimate(points, maxPoints) {
    if (points.length <= maxPoints) return points;
    const step = Math.ceil(points.length / maxPoints);
    const result = [];
    for (let i = 0; i < points.length; i += step) result.push(points[i]);
    if (result[result.length - 1] !== points[points.length - 1]) result.push(points[points.length - 1]);
    return result;
  }

  function energyAt(state, params) {
    const kinetic = 0.5 * params.mass * state.speed * state.speed;
    const potential = params.mass * params.g * state.y;
    return { kinetic, potential, total: kinetic + potential };
  }

  function trajectorySeries(result) {
    return decimate(result.samples.map((sample) => ({
      t: sample.t,
      x: sample.x,
      y: sample.y,
      speed: sample.speed
    })), 500);
  }

  function speedSeries(result) {
    return decimate(result.samples.map((sample) => ({
      t: sample.t,
      speed: sample.speed,
      vx: sample.vx,
      vy: sample.vy
    })), 500);
  }

  function energySeries(result, params) {
    return decimate(result.samples.map((sample) => {
      const e = energyAt(sample, params);
      return { t: sample.t, kinetic: e.kinetic, potential: e.potential, total: e.total };
    }), 500);
  }

  function nearestPoint(series, domainValue, key) {
    if (!series.length) return null;
    let low = 0;
    let high = series.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (series[mid][key] < domainValue) low = mid + 1;
      else high = mid;
    }
    const current = series[low];
    const previous = series[Math.max(0, low - 1)];
    return Math.abs(previous[key] - domainValue) <= Math.abs(current[key] - domainValue) ? previous : current;
  }

  function seriesPoint(series, index) {
    return series[clamp(index, 0, series.length - 1)];
  }

  function currentState(result, time, params, mode) {
    const state = P.interpolateState(result.samples, time);
    if (!state) return null;
    if (mode === "energy") {
      const e = energyAt(state, params);
      return { t: state.t, x: state.x, y: state.y, speed: state.speed, kinetic: e.kinetic, potential: e.potential, total: e.total };
    }
    return {
      t: state.t,
      x: state.x,
      y: state.y,
      speed: state.speed,
      vx: state.vx,
      vy: state.vy,
      kinetic: 0.5 * params.mass * state.speed * state.speed,
      potential: params.mass * params.g * state.y
    };
  }

  function drawTooltip(tooltip, html, localX, localY, containerWidth, containerHeight) {
    if (!tooltip) return;
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    const tooltipWidth = tooltip.offsetWidth || 120;
    const tooltipHeight = tooltip.offsetHeight || 60;
    let left = localX + 14;
    let top = localY - tooltipHeight - 12;
    if (left + tooltipWidth > containerWidth - 6) left = localX - tooltipWidth - 14;
    if (left < 6) left = 6;
    if (top < 4) top = localY + 14;
    if (top + tooltipHeight > containerHeight - 4) top = containerHeight - tooltipHeight - 4;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function clearTooltip(tooltip) {
    if (!tooltip) return;
    tooltip.hidden = true;
  }

  function drawTitle(ctx, width, title, subtitle, palette) {
    ctx.save();
    ctx.fillStyle = palette.text;
    ctx.font = '500 18px "Unbounded", "Onest", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, 26, 20);
    ctx.fillStyle = palette.muted;
    ctx.font = '8.5px "JetBrains Mono", monospace';
    ctx.fillText(subtitle, 26, 45);
    ctx.restore();
  }

  function getExportLegend(type, view, palette) {
    if (type === "trajectory") {
      const items = [{ label: "Траектория", color: palette.accent }];
      if (view && view.params && view.params.dragEnabled) items.push({ label: "Без сопротивления", color: palette.teal, dashed: true });
      return items;
    }
    if (type === "speed") {
      return [
        { label: "|v|", color: palette.accent },
        { label: "|vx|", color: palette.teal, dashed: true },
        { label: "|vy|", color: palette.blue, dashed: true }
      ];
    }
    return [
      { label: "Кинетическая", color: palette.accent },
      { label: "Потенциальная", color: palette.teal },
      { label: "Полная", color: palette.white }
    ];
  }

  function drawLegendInCanvas(ctx, width, items, palette) {
    ctx.save();
    ctx.font = '8.5px "JetBrains Mono", monospace';
    let totalWidth = 0;
    items.forEach((item) => { totalWidth += ctx.measureText(item.label).width + 24; });
    let x = width - 26 - totalWidth;
    const y = 27;
    items.forEach((item) => {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      if (item.dashed) ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 12, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = palette.muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, x + 17, y + 0.5);
      x += ctx.measureText(item.label).width + 24;
    });
    ctx.restore();
  }

  function drawMainChart(ctx, width, height, view, hover) {
    const type = view.type || "trajectory";
    const result = view.result;
    const params = view.params;
    const palette = getChartPalette(view.theme);
    const exporting = Boolean(view.exporting);
    const compact = width < 500;
    const plot = {
      left: exporting ? 57 : compact ? 36 : 43,
      right: width - (exporting ? 30 : compact ? 12 : 16),
      top: exporting ? 68 : 12,
      bottom: height - (exporting ? 44 : compact ? 32 : 30)
    };
    plot.width = plot.right - plot.left;
    plot.height = plot.bottom - plot.top;

    ctx.clearRect(0, 0, width, height);
    if (exporting) {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);
      drawTitle(ctx, width, type === "trajectory" ? "Траектория полёта" : type === "speed" ? "Скорость снаряда" : "Баланс энергии",
        `${view.params.dragEnabled ? "численная модель RK4" : "идеальная модель"} · v₀ ${formatValue(params.v0, 0)} м/с · α ${formatValue(params.angle, 0)}°`,
        palette);
      drawLegendInCanvas(ctx, width, getExportLegend(type, view, palette), palette);
    }

    if (type === "trajectory") {
      const referenceForDomain = params.dragEnabled ? view.reference : null;
      const xMax = Math.max(result.range, referenceForDomain ? referenceForDomain.range : 0, 1) * 1.05;
      const yMax = Math.max(result.maxHeight, referenceForDomain ? referenceForDomain.maxHeight : 0, 1) * 1.12;
      const xStep = niceStep(xMax, compact ? 3 : 5);
      const yStep = niceStep(yMax, compact ? 2 : 4);
      drawGrid(ctx, plot, xStep, yStep, xMax, yMax, palette, { xUnit: "x, м", yUnit: "y, м" });
      const xScale = (value) => (value / xMax) * plot.width;
      const yScale = (value) => (value / yMax) * plot.height;
      const series = trajectorySeries(result);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(plot.left + xScale(series[0].x), plot.bottom);
      series.forEach((point) => ctx.lineTo(plot.left + xScale(point.x), plot.bottom - yScale(point.y)));
      ctx.lineTo(plot.left + xScale(series[series.length - 1].x), plot.bottom);
      ctx.closePath();
      const area = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
      area.addColorStop(0, palette.areaTop);
      area.addColorStop(1, palette.areaBottom);
      ctx.fillStyle = area;
      ctx.fill();
      ctx.restore();

      if (params.dragEnabled && view.reference) {
        const refSeries = trajectorySeries(view.reference);
        ctx.save();
        ctx.strokeStyle = palette.teal;
        ctx.globalAlpha = 0.68;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        linePath(ctx, refSeries, plot, (v) => (v / xMax) * plot.width, (v) => (v / yMax) * plot.height, (point) => point.x, (point) => point.y);
        ctx.restore();
      }

      ctx.save();
      const lineGradient = ctx.createLinearGradient(plot.left, plot.bottom, plot.right, plot.top);
      lineGradient.addColorStop(0, palette.accent);
      lineGradient.addColorStop(1, palette.accent);
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.9;
      linePath(ctx, series, plot, (v) => (v / xMax) * plot.width, (v) => (v / yMax) * plot.height, (point) => point.x, (point) => point.y);
      ctx.restore();

      if (params.targetEnabled) {
        const tx = plot.left + (Math.min(params.targetDistance, xMax) / xMax) * plot.width;
        if (params.targetDistance <= xMax * 1.01) {
          ctx.save();
          ctx.strokeStyle = palette.target;
          ctx.globalAlpha = 0.3;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(tx, plot.top);
          ctx.lineTo(tx, plot.bottom);
          ctx.stroke();
          ctx.restore();
        }
      }

      const current = currentState(result, view.time, params, "trajectory");
      const cx = plot.left + xScale(current.x || 0);
      const cy = plot.bottom - yScale(current.y || 0);
      ctx.save();
      ctx.fillStyle = palette.accent;
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = palette.areaTop;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      view.__chartGeometry = {
        plot,
        xMax,
        yMax,
        series,
        xFromPointer(px) {
          return clamp(((px - plot.left) / plot.width) * xMax, 0, xMax);
        }
      };
    } else if (type === "speed") {
      const series = speedSeries(result);
      const total = Math.max(result.totalTime, 0.001);
      const xMax = total;
      const yMax = Math.max(params.v0, ...series.map((point) => point.speed), 1) * 1.08;
      const xStep = niceStep(xMax, compact ? 3 : 5);
      const yStep = niceStep(yMax, compact ? 2 : 4);
      drawGrid(ctx, plot, xStep, yStep, xMax, yMax, palette, { xUnit: "t, с", yUnit: "v, м/с" });
      const xScale = (v) => (v / xMax) * plot.width;
      const yScale = (v) => (v / yMax) * plot.height;

      ctx.save();
      ctx.strokeStyle = palette.blue;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 4]);
      linePath(ctx, series, plot, xScale, yScale, (point) => point.t, (point) => Math.abs(point.vy));
      ctx.strokeStyle = palette.teal;
      linePath(ctx, series, plot, xScale, yScale, (point) => point.t, (point) => Math.abs(point.vx));
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 8;
      linePath(ctx, series, plot, xScale, yScale, (point) => point.t, (point) => point.speed);
      ctx.restore();

      drawTimeCurrent(ctx, plot, view.time, total, palette);

      const current = currentState(result, view.time, params, "speed");
      const cx = plot.left + xScale(current.t);
      ctx.save();
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(cx, plot.bottom - yScale(current.speed), 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.teal;
      ctx.beginPath();
      ctx.arc(cx, plot.bottom - yScale(Math.abs(current.vx)), 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.blue;
      ctx.beginPath();
      ctx.arc(cx, plot.bottom - yScale(Math.abs(current.vy)), 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      view.__chartGeometry = {
        plot,
        xMax,
        yMax,
        series,
        xFromPointer(px) {
          return clamp(((px - plot.left) / plot.width) * xMax, 0, xMax);
        }
      };
    } else {
      const series = energySeries(result, params);
      const total = Math.max(result.totalTime, 0.001);
      const rawMax = Math.max(1, ...series.map((point) => point.total));
      const useKilo = rawMax >= 1000;
      const divisor = useKilo ? 1000 : 1;
      const yMax = (rawMax / divisor) * 1.11;
      const xMax = total;
      const xStep = niceStep(xMax, compact ? 3 : 5);
      const yStep = niceStep(yMax, compact ? 2 : 4);
      drawGrid(ctx, plot, xStep, yStep, xMax, yMax, palette, { xUnit: "t, с", yUnit: useKilo ? "E, кДж" : "E, Дж" });
      const xScale = (v) => (v / xMax) * plot.width;
      const yScale = (v) => (v / divisor / yMax) * plot.height;

      const kineticPoints = series.map((point) => ({ t: point.t, value: point.kinetic }));
      const potentialPoints = series.map((point) => ({ t: point.t, value: point.potential }));
      const totalPoints = series.map((point) => ({ t: point.t, value: point.total }));

      ctx.save();
      const fill = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
      fill.addColorStop(0, palette.areaTop);
      fill.addColorStop(1, palette.areaBottom);
      ctx.beginPath();
      ctx.moveTo(plot.left, plot.bottom);
      kineticPoints.forEach((point) => ctx.lineTo(plot.left + xScale(point.t), plot.bottom - yScale(point.value)));
      ctx.lineTo(plot.left + xScale(kineticPoints[kineticPoints.length - 1].t), plot.bottom);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.lineWidth = 1.4;
      ctx.strokeStyle = palette.teal;
      linePath(ctx, potentialPoints, plot, xScale, yScale, (point) => point.t, (point) => point.value);
      ctx.strokeStyle = palette.white;
      ctx.globalAlpha = 0.72;
      linePath(ctx, totalPoints, plot, xScale, yScale, (point) => point.t, (point) => point.value);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 8;
      linePath(ctx, kineticPoints, plot, xScale, yScale, (point) => point.t, (point) => point.value);
      ctx.restore();

      drawTimeCurrent(ctx, plot, view.time, total, palette);
      const current = currentState(result, view.time, params, "energy");
      const cx = plot.left + xScale(current.t);
      ctx.save();
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(cx, plot.bottom - yScale(current.kinetic), 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.teal;
      ctx.beginPath();
      ctx.arc(cx, plot.bottom - yScale(current.potential), 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      view.__chartGeometry = {
        plot,
        xMax,
        yMax: yMax * divisor,
        series,
        useKilo,
        xFromPointer(px) {
          return clamp(((px - plot.left) / plot.width) * xMax, 0, xMax);
        }
      };
    }

    if (hover && hover.fraction != null) {
      const geometry = view.__chartGeometry;
      if (geometry) {
        const x = geometry.plot.left + hover.fraction * geometry.plot.width;
        ctx.save();
        ctx.strokeStyle = palette.muted;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x, geometry.plot.top);
        ctx.lineTo(x, geometry.plot.bottom);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function tooltipHtml(type, point, params, useKilo) {
    if (!point) return "";
    if (type === "trajectory") {
      return `<span>t</span> <b>${formatValue(point.t, 2)} с</b><br><span>x</span> <b>${formatValue(point.x, 1)} м</b><br><span>y</span> <b>${formatValue(point.y, 1)} м</b>`;
    }
    if (type === "speed") {
      return `<span>t</span> <b>${formatValue(point.t, 2)} с</b><br><span>|v|</span> <b>${formatValue(point.speed, 1)} м/с</b><br><span>vx</span> <b>${formatValue(point.vx, 1)}</b><br><span>vy</span> <b>${formatValue(point.vy, 1)}</b>`;
    }
    const unit = useKilo ? "кДж" : "Дж";
    const divisor = useKilo ? 1000 : 1;
    return `<span>t</span> <b>${formatValue(point.t, 2)} с</b><br><span>Ek</span> <b>${formatValue(point.kinetic / divisor, 1)} ${unit}</b><br><span>Ep</span> <b>${formatValue(point.potential / divisor, 1)} ${unit}</b><br><span>E</span> <b>${formatValue(point.total / divisor, 1)} ${unit}</b>`;
  }

  function createMain(canvas, tooltip) {
    const state = {
      view: null,
      hover: null,
      width: 0,
      height: 0,
      geometry: null
    };

    function ensureCanvas() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      state.width = rect.width;
      state.height = rect.height;
      return true;
    }

    function draw(withHover) {
      if (!state.view) return;
      const ctx = prepareCanvas(canvas, state.width, state.height);
      drawMainChart(ctx, state.width, state.height, state.view, withHover === false ? null : state.hover);
    }

    function render(view) {
      const previousType = state.view ? state.view.type : null;
      state.view = view;
      if (previousType !== view.type) {
        state.hover = null;
        clearTooltip(tooltip);
      }
      if (!ensureCanvas()) return;
      draw();
    }

    function nearestForHover(fraction) {
      if (!state.view) return null;
      const type = state.view.type;
      const result = state.view.result;
      const params = state.view.params;
      if (type === "trajectory") {
        const referenceForDomain = params.dragEnabled && state.view.reference ? state.view.reference : null;
        const xMax = Math.max(result.range, referenceForDomain ? referenceForDomain.range : 0, 1) * 1.05;
        return nearestPoint(trajectorySeries(result), fraction * xMax, "x");
      }
      if (type === "speed") {
        return nearestPoint(speedSeries(result), fraction * Math.max(result.totalTime, 0.001), "t");
      }
      const rawMax = Math.max(1, result.samples.reduce((max, sample) => {
        const e = energyAt(sample, params);
        return Math.max(max, e.total);
      }, 0));
      return nearestPoint(energySeries(result, params), fraction * Math.max(result.totalTime, 0.001), "t");
    }

    function updateHover(event) {
      if (!state.view) return;
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const plot = state.view.__chartGeometry ? state.view.__chartGeometry.plot : null;
      if (!plot || localX < plot.left - 4 || localX > plot.left + plot.width + 4 || localY < plot.top - 8 || localY > plot.bottom + 10) {
        if (state.hover) {
          state.hover = null;
          clearTooltip(tooltip);
          draw();
        }
        return;
      }
      const fraction = clamp((localX - plot.left) / plot.width, 0, 1);
      const point = nearestForHover(fraction);
      if (!point) return;
      const useKilo = state.view.type === "energy" && Math.max(1, ...energySeries(state.view.result, state.view.params).map((p) => p.total)) >= 1000;
      state.hover = { fraction };
      draw();
      const container = canvas.parentElement;
      drawTooltip(tooltip, tooltipHtml(state.view.type, point, state.view.params, useKilo), localX, localY, container.clientWidth, container.clientHeight);
    }

    function hideHover() {
      state.hover = null;
      clearTooltip(tooltip);
      if (state.view) draw();
    }

    function exportCanvas(view, width) {
      const exportWidth = width || 1200;
      const logicalWidth = 760;
      const logicalHeight = 319;
      const scale = exportWidth / logicalWidth;
      const exportHeight = Math.round(logicalHeight * scale);
      const offscreen = document.createElement("canvas");
      offscreen.width = exportWidth;
      offscreen.height = exportHeight;
      const ctx = offscreen.getContext("2d");
      ctx.scale(scale, scale);
      drawMainChart(ctx, logicalWidth, logicalHeight, Object.assign({}, view, { exporting: true }), null);
      return offscreen;
    }

    canvas.addEventListener("pointermove", updateHover);
    canvas.addEventListener("pointerleave", hideHover);

    return { render, hideHover, exportCanvas };
  }

  function createCompare(canvas) {
    const state = { view: null, width: 0, height: 0 };

    function render(view) {
      state.view = view;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      state.width = rect.width;
      state.height = rect.height;
      const ctx = prepareCanvas(canvas, rect.width, rect.height);
      drawCompare(ctx, rect.width, rect.height, view);
    }

    function exportCanvas(view, width) {
      const exportWidth = width || 1600;
      const logicalWidth = 900;
      const logicalHeight = 450;
      const scale = exportWidth / logicalWidth;
      const exportHeight = Math.round(logicalHeight * scale);
      const offscreen = document.createElement("canvas");
      offscreen.width = exportWidth;
      offscreen.height = exportHeight;
      const ctx = offscreen.getContext("2d");
      ctx.scale(scale, scale);
      drawCompare(ctx, logicalWidth, logicalHeight, Object.assign({}, view, { exporting: true }));
      return offscreen;
    }

    return { render, exportCanvas };
  }

  function drawCompare(ctx, width, height, view) {
    const shots = (view.shots || []).filter((shot) => shot.visible !== false && shot.result);
    const theme = view.theme || "dark";
    const palette = getChartPalette(theme);
    const exporting = Boolean(view.exporting);
    const compact = width < 600;
    const plot = {
      left: exporting ? 58 : compact ? 38 : 48,
      right: width - (exporting ? 32 : compact ? 14 : 20),
      top: exporting ? 74 : compact ? 16 : 18,
      bottom: height - (exporting ? 46 : compact ? 32 : 31)
    };
    plot.width = plot.right - plot.left;
    plot.height = plot.bottom - plot.top;

    ctx.clearRect(0, 0, width, height);
    if (!shots.length) return;

    if (exporting) {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);
      drawTitle(ctx, width, "Сравнение траекторий", "наложение экспериментов в единых координатах", palette);
      let legendX = width - 26;
      ctx.save();
      ctx.font = '8.5px "JetBrains Mono", monospace';
      for (let i = shots.length - 1; i >= 0; i -= 1) {
        const shot = shots[i];
        const labelWidth = ctx.measureText(shot.label || "").width + 22;
        legendX -= labelWidth;
        ctx.strokeStyle = shot.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(legendX, 28);
        ctx.lineTo(legendX + 12, 28);
        ctx.stroke();
        ctx.fillStyle = palette.muted;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(shot.label || "", legendX + 17, 28);
      }
      ctx.restore();
    }

    let xMax = 1;
    let yMax = 1;
    shots.forEach((shot) => {
      xMax = Math.max(xMax, shot.result.range);
      yMax = Math.max(yMax, shot.result.maxHeight);
    });
    xMax *= 1.05;
    yMax *= 1.14;
    const xStep = niceStep(xMax, compact ? 3 : 5);
    const yStep = niceStep(yMax, compact ? 3 : 4);
    drawGrid(ctx, plot, xStep, yStep, xMax, yMax, palette, { xUnit: "x, м", yUnit: "y, м" });

    const xScale = (value) => (value / xMax) * plot.width;
    const yScale = (value) => (value / yMax) * plot.height;

    shots.forEach((shot, index) => {
      const series = trajectorySeries(shot.result);
      if (!series.length) return;
      ctx.save();
      ctx.strokeStyle = shot.color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.9;
      linePath(ctx, series, plot, xScale, yScale, (point) => point.x, (point) => point.y);
      ctx.shadowBlur = 0;
      const last = series[series.length - 1];
      const ix = plot.left + xScale(last.x);
      const iy = plot.bottom - yScale(last.y);
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = shot.color;
      ctx.font = '600 8px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(index + 1), ix + 5, iy - 3);
      ctx.restore();
    });

    // Точка старта
    ctx.save();
    ctx.fillStyle = palette.muted;
    ctx.beginPath();
    ctx.arc(plot.left + xScale(0), plot.bottom - yScale(0), 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  root.Ballistics = root.Ballistics || {};
  root.Ballistics.Charts = { createMain, createCompare, getChartPalette };
}(window));
