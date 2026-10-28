(function registerScene(root) {
  "use strict";

  const P = root.Ballistics.Physics;
  const RAD = Math.PI / 180;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function random() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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
    const decimals = step < 1 ? Math.min(2, Math.max(0, -Math.floor(Math.log10(step)))) : 0;
    return value.toFixed(decimals).replace(".", ",");
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(digits == null ? 1 : digits).replace(".", ",");
  }

  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== "#") return hex;
    let cleaned = hex.slice(1);
    if (cleaned.length === 3) cleaned = cleaned.split("").map((c) => c + c).join("");
    const n = parseInt(cleaned, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function labelPill(ctx, text, x, y, palette, options) {
    const opts = options || {};
    const font = opts.font || '500 8px "JetBrains Mono", monospace';
    const padX = opts.padX || 6;
    const padY = opts.padY || 4;
    const align = opts.align || "center";
    ctx.save();
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const w = metrics.width + padX * 2;
    const h = (opts.height || 8) + padY * 2;
    let left = x;
    if (align === "center") left = x - w / 2;
    if (align === "right") left = x - w;
    const top = y - h / 2;
    roundRect(ctx, left, top, w, h, 5);
    ctx.fillStyle = opts.bg || palette.labelBg;
    ctx.fill();
    ctx.strokeStyle = opts.border || palette.labelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = opts.color || palette.labelText;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, left + padX, top + h / 2 + 0.5);
    ctx.restore();
    return w;
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width, headSize) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = headSize || 6;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(angle - 0.38) * head, y2 - Math.sin(angle - 0.38) * head);
    ctx.lineTo(x2 - Math.cos(angle + 0.38) * head, y2 - Math.sin(angle + 0.38) * head);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function getPalette(theme) {
    if (theme === "light") {
      return {
        skyTop: "#cfe4dd",
        skyMid: "#e7efdf",
        skyBottom: "#f5ddba",
        sun: "#ffc683",
        sunCore: "#fff0d2",
        sunGlow: "rgba(255, 173, 94, 0.34)",
        sunGlowSoft: "rgba(255, 196, 128, 0.08)",
        mountainFar: "#b8cec2",
        mountainFar2: "#a8c2b4",
        mountainMid: "#92b4a3",
        mountainMid2: "#82a692",
        mountainNear: "#6d947e",
        mountainNear2: "#5c806b",
        snow: "#f3f5e8",
        cloud: "rgba(255, 255, 248, 0.44)",
        cloudShade: "rgba(124, 153, 138, 0.12)",
        groundTop: "#719b7d",
        groundMid: "#5e8972",
        groundDeep: "#416453",
        groundFacetA: "#7ea787",
        groundFacetB: "#67917a",
        groundFacetC: "#567d68",
        horizon: "rgba(255, 230, 193, 0.32)",
        grid: "rgba(27, 67, 54, 0.11)",
        gridStrong: "rgba(27, 67, 54, 0.2)",
        axis: "rgba(30, 71, 58, 0.42)",
        axisText: "rgba(34, 76, 63, 0.7)",
        planned: "rgba(193, 93, 38, 0.36)",
        trail: "#da6c2c",
        trailHi: "#ffcf91",
        trailGlow: "rgba(218, 108, 44, 0.3)",
        reference: "rgba(5, 135, 117, 0.6)",
        ball: "#f08a43",
        ballHi: "#ffe0af",
        ballDark: "#b74c2d",
        target: "#c34b5d",
        targetSoft: "rgba(195, 75, 93, 0.16)",
        targetGlow: "rgba(195, 75, 93, 0.26)",
        text: "rgba(25, 58, 48, 0.86)",
        textMuted: "rgba(46, 82, 70, 0.56)",
        labelBg: "rgba(250, 252, 244, 0.86)",
        labelBorder: "rgba(31, 73, 60, 0.16)",
        labelText: "rgba(23, 55, 45, 0.85)",
        cannon: "#526d64",
        cannonLight: "#759182",
        cannonDark: "#314a42",
        cannonAccent: "#d77c45",
        dust: "rgba(117, 92, 64, 0.32)",
        vector: "#c45f24",
        vectorX: "#078d7b",
        vectorY: "#3f6fce",
        impact: "#8d5b2f",
        particle: "#e58d4e",
        hud: "#1d4a3b"
      };
    }

    return {
      skyTop: "#06101a",
      skyMid: "#0a2030",
      skyBottom: "#153a46",
      sun: "#ffb46d",
      sunCore: "#ffe5bd",
      sunGlow: "rgba(255, 156, 78, 0.22)",
      sunGlowSoft: "rgba(255, 163, 89, 0.045)",
      mountainFar: "#0a1d2b",
      mountainFar2: "#0d2433",
      mountainMid: "#0c2634",
      mountainMid2: "#0f2e3d",
      mountainNear: "#0b202b",
      mountainNear2: "#0a1a23",
      snow: "#34545f",
      cloud: "rgba(159, 197, 199, 0.08)",
      cloudShade: "rgba(3, 10, 15, 0.2)",
      groundTop: "#102a30",
      groundMid: "#0a1d24",
      groundDeep: "#06131a",
      groundFacetA: "#143039",
      groundFacetB: "#0d242d",
      groundFacetC: "#081a21",
      horizon: "rgba(255, 156, 85, 0.08)",
      grid: "rgba(122, 196, 197, 0.09)",
      gridStrong: "rgba(178, 226, 222, 0.17)",
      axis: "rgba(185, 225, 222, 0.3)",
      axisText: "rgba(190, 224, 220, 0.54)",
      planned: "rgba(255, 184, 114, 0.26)",
      trail: "#ffa45c",
      trailHi: "#ffe0b2",
      trailGlow: "rgba(255, 164, 92, 0.35)",
      reference: "rgba(94, 234, 212, 0.52)",
      ball: "#ffb064",
      ballHi: "#fff2d5",
      ballDark: "#d46137",
      target: "#ff93a2",
      targetSoft: "rgba(255, 147, 162, 0.12)",
      targetGlow: "rgba(255, 147, 162, 0.25)",
      text: "rgba(231, 245, 242, 0.86)",
      textMuted: "rgba(183, 218, 215, 0.46)",
      labelBg: "rgba(5, 16, 23, 0.68)",
      labelBorder: "rgba(188, 229, 225, 0.13)",
      labelText: "rgba(221, 241, 238, 0.82)",
      cannon: "#3b5460",
      cannonLight: "#65808a",
      cannonDark: "#1e323d",
      cannonAccent: "#ff9c55",
      dust: "rgba(196, 152, 109, 0.22)",
      vector: "#ffcc91",
      vectorX: "#5eead4",
      vectorY: "#82aaff",
      impact: "#d89e6b",
      particle: "#ffb46b",
      hud: "#0b222a"
    };
  }

  function getLayout(width, height, params, result, reference, target) {
    const isCompact = width < 560;
    const exporting = Boolean(params.__export);
    const left = exporting ? 84 : isCompact ? 38 : 46;
    const right = exporting ? 66 : isCompact ? 18 : 28;
    const top = exporting ? 86 : 28;
    const bottom = exporting ? 108 : isCompact ? 62 : 58;

    const targetEnabled = params.targetEnabled;
    let xHigh = Math.max(result.range, 12);
    let xLow = Math.min(0, result.range);
    if (reference) xHigh = Math.max(xHigh, reference.range);
    if (target && targetEnabled) {
      xHigh = Math.max(xHigh, params.targetDistance + params.targetRadius * 1.6);
    }

    const rawSpan = Math.max(10, xHigh - xLow);
    const padding = rawSpan * 0.075;
    xLow -= padding * 0.9;
    xHigh += padding;
    if (xLow > 0) xLow = 0;

    const yHigh = Math.max(result.maxHeight, reference ? reference.maxHeight : 0, params.y0, 5) * 1.2;
    const plot = {
      left,
      right: width - right,
      top,
      bottom: height - bottom,
      width: width - left - right,
      height: height - top - bottom
    };

    // Один масштаб по осям: визуальный наклон траектории совпадает с углом броска.
    const equalScale = Math.min(
      plot.width / Math.max(0.001, xHigh - xLow),
      plot.height / Math.max(0.001, yHigh)
    );
    const xHighView = xLow + plot.width / equalScale;
    const xScale = equalScale;
    const yScale = equalScale;

    return {
      width,
      height,
      plot,
      xLow,
      xHigh: xHighView,
      yHigh,
      groundY: plot.bottom,
      xScale,
      yScale,
      origin: {
        x: plot.left + (0 - xLow) * xScale,
        y: plot.bottom - params.y0 * yScale
      },
      sx(value) {
        return plot.left + (value - xLow) * xScale;
      },
      sy(value) {
        return plot.bottom - value * yScale;
      },
      compact: isCompact,
      exporting
    };
  }

  function drawSky(ctx, width, height, layout, palette, theme, now) {
    const sky = ctx.createLinearGradient(0, 0, 0, layout.groundY + 6);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.58, palette.skyMid);
    sky.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, layout.groundY + 4);

    const sunX = width * (width < 560 ? 0.75 : 0.81);
    const sunY = height * 0.26;
    const halo = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, Math.max(width, height) * 0.34);
    halo.addColorStop(0, palette.sunGlow);
    halo.addColorStop(0.42, palette.sunGlowSoft);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, layout.groundY);

    if (theme === "dark") {
      const rng = mulberry32(0x51a7c0de);
      for (let i = 0; i < 78; i += 1) {
        const x = rng() * width;
        const y = rng() * layout.groundY * 0.7;
        const radius = rng() * 1.05 + 0.25;
        const twinkle = 0.28 + 0.42 * Math.abs(Math.sin(now * 0.0003 + i * 1.73));
        ctx.fillStyle = `rgba(219, 239, 236, ${twinkle * (0.55 + rng() * 0.45)})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (i % 19 === 0) {
          ctx.strokeStyle = `rgba(219, 239, 236, ${twinkle * 0.28})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }
    }

    // Низкополигональное солнце
    const sunRadius = Math.max(16, Math.min(width, height) * 0.038);
    ctx.save();
    ctx.translate(sunX, sunY);
    const facets = 14;
    for (let i = 0; i < facets; i += 1) {
      const a1 = (i / facets) * Math.PI * 2;
      const a2 = ((i + 1) / facets) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a1) * sunRadius, Math.sin(a1) * sunRadius);
      ctx.lineTo(Math.cos(a2) * sunRadius, Math.sin(a2) * sunRadius);
      ctx.closePath();
      ctx.fillStyle = i % 3 === 0
        ? palette.sunCore
        : i % 3 === 1
          ? palette.sun
          : hexToRgba(palette.sun, 0.86);
      ctx.fill();
    }
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = palette.sunCore;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, sunRadius * 0.68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Низкополигональные облака
    const cloudRng = mulberry32(0x20c10d);
    for (let n = 0; n < 4; n += 1) {
      const cx = width * (0.1 + n * 0.24) + cloudRng() * 50;
      const cy = height * (0.12 + cloudRng() * 0.25);
      const scale = (0.55 + cloudRng() * 0.8) * Math.max(0.7, width / 1000);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = theme === "dark" ? 0.36 : 0.55;
      const cloud = [
        [-46, 6], [-28, -8], [-12, -4], [2, -13], [23, -4], [38, 6], [18, 11], [-24, 11]
      ];
      ctx.beginPath();
      ctx.moveTo(cloud[0][0] * scale, cloud[0][1] * scale);
      cloud.slice(1).forEach((point) => ctx.lineTo(point[0] * scale, point[1] * scale));
      ctx.closePath();
      ctx.fillStyle = palette.cloud;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-30 * scale, 2 * scale);
      ctx.lineTo(2 * scale, -13 * scale);
      ctx.lineTo(38 * scale, 6 * scale);
      ctx.lineTo(18 * scale, 11 * scale);
      ctx.closePath();
      ctx.fillStyle = palette.cloudShade;
      ctx.fill();
      ctx.restore();
    }
  }

  function ridgePoints(rng, width, groundY, amplitude, step) {
    const points = [];
    let x = -step * 0.8;
    let previous = groundY - amplitude * (0.45 + rng() * 0.25);
    points.push({ x, y: previous });
    while (x < width + step) {
      x += step * (0.58 + rng() * 0.9);
      const wave = Math.sin(x / width * 8.2 + rng() * 1.8) * 0.2;
      const heightRatio = 0.18 + rng() * 0.84 + wave;
      const y = groundY - amplitude * clamp(heightRatio, 0.1, 1.1);
      points.push({ x, y });
      previous = y;
    }
    return points;
  }

  function drawMountainLayer(ctx, width, layout, palette, options) {
    const { seed, amplitude, step, topColor, shadeColor, highlight, snow } = options;
    const rng = mulberry32(seed);
    const groundY = layout.groundY + 4;
    const points = ridgePoints(rng, width, groundY, amplitude, step);

    const gradient = ctx.createLinearGradient(0, groundY - amplitude, 0, groundY + 40);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, shadeColor);
    ctx.beginPath();
    ctx.moveTo(-20, groundY + 30);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.lineTo(width + 20, groundY + 30);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Кристаллические грани
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const mid = (a.x + b.x) / 2;
      const base = groundY + 2 + rng() * amplitude * 0.15;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(mid + (rng() - 0.5) * 18, base);
      ctx.closePath();
      ctx.fillStyle = highlight
        ? hexToRgba(highlight, 0.035 + rng() * 0.04)
        : "rgba(255,255,255,0.02)";
      ctx.fill();
    }

    if (snow) {
      for (let i = 1; i < points.length - 1; i += 1) {
        const p = points[i];
        const left = points[i - 1];
        const right = points[i + 1];
        if (p.y < groundY - amplitude * 0.63) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(lerp(p.x, left.x, 0.35), lerp(p.y, left.y, 0.35) + 7);
          ctx.lineTo(lerp(p.x, right.x, 0.35), lerp(p.y, right.y, 0.35) + 7);
          ctx.closePath();
          ctx.fillStyle = hexToRgba(snow, 0.17);
          ctx.fill();
        }
      }
    }
  }

  function drawLandscape(ctx, width, height, layout, palette, theme) {
    drawMountainLayer(ctx, width, layout, palette, {
      seed: 0x1f3d5b,
      amplitude: Math.max(90, layout.groundY * 0.47),
      step: 96,
      topColor: palette.mountainFar,
      shadeColor: palette.mountainFar2,
      highlight: palette.snow,
      snow: theme === "light"
    });
    drawMountainLayer(ctx, width, layout, palette, {
      seed: 0x63a1e2,
      amplitude: Math.max(62, layout.groundY * 0.32),
      step: 72,
      topColor: palette.mountainMid,
      shadeColor: palette.mountainMid2,
      highlight: palette.snow,
      snow: theme === "light"
    });
    drawMountainLayer(ctx, width, layout, palette, {
      seed: 0x77c2a4,
      amplitude: Math.max(38, layout.groundY * 0.18),
      step: 58,
      topColor: palette.mountainNear,
      shadeColor: palette.mountainNear2,
      highlight: theme === "light" ? "#ffffff" : "#7ba7a3",
      snow: false
    });

    // Дымка на горизонте
    const haze = ctx.createLinearGradient(0, layout.groundY - 100, 0, layout.groundY);
    haze.addColorStop(0, "rgba(0,0,0,0)");
    haze.addColorStop(1, palette.horizon);
    ctx.fillStyle = haze;
    ctx.fillRect(0, layout.groundY - 100, width, 100);

    // Земля
    const ground = ctx.createLinearGradient(0, layout.groundY, 0, height);
    ground.addColorStop(0, palette.groundTop);
    ground.addColorStop(0.45, palette.groundMid);
    ground.addColorStop(1, palette.groundDeep);
    ctx.fillStyle = ground;
    ctx.fillRect(0, layout.groundY, width, height - layout.groundY);

    const rng = mulberry32(0x7a31df);
    const groundHeight = height - layout.groundY;
    for (let i = 0; i < 16; i += 1) {
      const x = (i / 15) * width + (rng() - 0.5) * 70;
      const w = 50 + rng() * 120;
      const depth = groundHeight * (0.25 + rng() * 0.9);
      ctx.beginPath();
      ctx.moveTo(x, layout.groundY + 1);
      ctx.lineTo(x + w, layout.groundY + 1);
      ctx.lineTo(x + w * (0.55 + rng() * 0.3), layout.groundY + depth);
      ctx.closePath();
      ctx.fillStyle = i % 3 === 0
        ? palette.groundFacetA
        : i % 3 === 1
          ? palette.groundFacetB
          : palette.groundFacetC;
      ctx.globalAlpha = 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Трава и мелкие низкополигональные кусты на линии земли
    const grassRng = mulberry32(0x1774aa);
    for (let i = 0; i < 24; i += 1) {
      const x = grassRng() * width;
      if (Math.abs(x - layout.origin.x) < 38) continue;
      const h = 4 + grassRng() * 9;
      const w = 2 + grassRng() * 5;
      ctx.beginPath();
      ctx.moveTo(x - w, layout.groundY + 1);
      ctx.lineTo(x + (grassRng() - 0.5) * w, layout.groundY - h);
      ctx.lineTo(x + w * 1.5, layout.groundY + 1);
      ctx.closePath();
      ctx.fillStyle = theme === "light" ? "rgba(35, 91, 69, 0.33)" : "rgba(94, 173, 149, 0.16)";
      ctx.fill();
    }

    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, layout.groundY + 0.5);
    ctx.lineTo(width, layout.groundY + 0.5);
    ctx.stroke();
  }

  function drawGrid(ctx, layout, palette, params, result) {
    const { plot, xHigh, yHigh, groundY, sx, sy, width, compact } = layout;
    const xStep = niceStep(xHigh, compact ? 3 : 5);
    const yStep = niceStep(yHigh, compact ? 3 : 4);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.font = `${compact ? 7.5 : 8.5}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";

    for (let value = 0; value <= xHigh + 1e-9; value += xStep) {
      const x = sx(value);
      if (x < plot.left - 1 || x > width) continue;
      ctx.strokeStyle = value === 0 ? palette.gridStrong : palette.grid;
      ctx.setLineDash(value === 0 ? [] : [2, 5]);
      ctx.beginPath();
      ctx.moveTo(x, plot.top);
      ctx.lineTo(x, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = palette.axisText;
      ctx.textAlign = "center";
      const label = formatTick(value, xStep);
      const labelY = groundY + (compact ? 12 : 14);
      ctx.fillText(label, x, labelY);
    }

    for (let value = yStep; value <= yHigh + 1e-9; value += yStep) {
      const y = sy(value);
      if (y < plot.top - 1) continue;
      ctx.strokeStyle = palette.grid;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(width - (compact ? 10 : 18), y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = palette.axisText;
      ctx.textAlign = "right";
      ctx.fillText(formatTick(value, yStep), plot.left - 7, y);
    }

    ctx.fillStyle = palette.axisText;
    ctx.textAlign = "right";
    ctx.font = `${compact ? 7 : 8}px "JetBrains Mono", monospace`;
    ctx.fillText("x, м", width - (compact ? 16 : 24), groundY - 8);
    ctx.textAlign = "right";
    ctx.fillText("y, м", plot.left - 7, plot.top - 11);

    ctx.restore();
  }

  function drawTarget(ctx, layout, palette, params, target, time, finished, now) {
    if (!params.targetEnabled) return;
    const x = layout.sx(params.targetDistance);
    if (x < -40 || x > layout.width + 40) return;
    const groundY = layout.groundY;
    const boardY = groundY - Math.max(30, layout.height * 0.1);
    const scale = clamp(layout.width / 900, 0.85, 1.35);
    const radius = 13 * scale;
    const pulse = finished && target && target.hit ? 1 + Math.sin(now * 0.005) * 0.08 : 1;

    ctx.save();

    // Световой ориентир
    const beam = ctx.createLinearGradient(0, groundY - 110, 0, groundY);
    beam.addColorStop(0, "rgba(0,0,0,0)");
    beam.addColorStop(1, palette.targetSoft);
    ctx.fillStyle = beam;
    ctx.fillRect(x - 28, groundY - 110, 56, 110);

    // Основание
    ctx.fillStyle = palette.targetSoft;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 1, 24 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.target, 0.32);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 1, 24 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Флагшток
    ctx.strokeStyle = hexToRgba(palette.target, 0.75);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, boardY + radius);
    ctx.stroke();

    // Мишень
    ctx.translate(x, boardY);
    ctx.scale(pulse, pulse);
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 2.5);
    glow.addColorStop(0, palette.targetGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hexToRgba(palette.target, 0.13);
    ctx.strokeStyle = hexToRgba(palette.target, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.64, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = palette.target;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.target, 0.7);
    ctx.beginPath();
    ctx.moveTo(-radius * 1.15, 0);
    ctx.lineTo(radius * 1.15, 0);
    ctx.moveTo(0, -radius * 1.15);
    ctx.lineTo(0, radius * 1.15);
    ctx.stroke();

    // Вымпел
    ctx.fillStyle = palette.targetSoft;
    ctx.strokeStyle = palette.target;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.1);
    ctx.lineTo(15 * scale, -radius * 1.35);
    ctx.lineTo(0, -radius * 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    labelPill(
      ctx,
      `${formatNumber(params.targetDistance, Number.isInteger(params.targetDistance) ? 0 : 1)} м`,
      x,
      boardY - radius * 1.8 - 13 * scale,
      palette,
      { color: hexToRgba(palette.target, 0.92), border: hexToRgba(palette.target, 0.25), bg: layout.exporting ? "rgba(12,20,22,0.7)" : palette.labelBg }
    );
  }

  function traceSamples(samples, tLimit, sx, sy, maxPoints) {
    const points = [];
    let lastX = null;
    let lastY = null;
    const limit = tLimit == null ? Infinity : tLimit;
    for (let i = 0; i < samples.length; i += 1) {
      const sample = samples[i];
      if (sample.t > limit + 1e-9) break;
      const x = sx(sample.x);
      const y = sy(sample.y);
      if (lastX == null || Math.hypot(x - lastX, y - lastY) > 0.7) {
        points.push({ x, y, t: sample.t, state: sample });
        lastX = x;
        lastY = y;
      }
    }
    if (limit !== Infinity) {
      const current = P.interpolateState(samples, Math.min(limit, samples[samples.length - 1].t));
      if (current) {
        const x = sx(current.x);
        const y = sy(current.y);
        if (!points.length || Math.hypot(x - lastX, y - lastY) > 0.1) {
          points.push({ x, y, t: current.t, state: current });
        }
      }
    }
    if (maxPoints && points.length > maxPoints) {
      const step = Math.ceil(points.length / maxPoints);
      const reduced = [];
      for (let i = 0; i < points.length; i += step) reduced.push(points[i]);
      if (reduced[reduced.length - 1] !== points[points.length - 1]) reduced.push(points[points.length - 1]);
      return reduced;
    }
    return points;
  }

  function strokeSmoothPath(ctx, points) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  function drawPaths(ctx, layout, palette, params, result, reference, show, time) {
    const { sx, sy, plot } = layout;
    const total = result.totalTime;
    const clippedTime = clamp(time, 0, total);
    const finished = total > 0 && time >= total - 1e-6;

    if (params.dragEnabled && show.reference && reference) {
      const refPoints = traceSamples(reference.samples, null, sx, sy, 1400);
      ctx.save();
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = palette.reference;
      ctx.globalAlpha = 0.8;
      strokeSmoothPath(ctx, refPoints);
      ctx.restore();
      if (refPoints.length) {
        const end = refPoints[refPoints.length - 1];
        ctx.save();
        ctx.font = '500 8px "JetBrains Mono", monospace';
        ctx.fillStyle = palette.reference;
        ctx.globalAlpha = 0.82;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        const label = "без сопротивления";
        const lw = ctx.measureText(label).width;
        const lx = Math.min(layout.plot.right, end.x + 4);
        ctx.fillText(label, lx, Math.max(plot.top + 10, end.y - 9));
        ctx.restore();
      }
    }

    const allPoints = traceSamples(result.samples, null, sx, sy, 1800);
    if (!finished) {
      if (show.trail && clippedTime <= 0.01 && allPoints.length > 1) {
        ctx.save();
        const preview = ctx.createLinearGradient(allPoints[0].x, allPoints[0].y, allPoints[allPoints.length - 1].x, allPoints[allPoints.length - 1].y);
        preview.addColorStop(0, hexToRgba(palette.trail, 0.14));
        preview.addColorStop(0.55, hexToRgba(palette.trail, 0.44));
        preview.addColorStop(1, hexToRgba(palette.trailHi, 0.3));
        ctx.strokeStyle = preview;
        ctx.lineWidth = 1.35;
        ctx.shadowColor = palette.trail;
        ctx.shadowBlur = 7;
        strokeSmoothPath(ctx, allPoints);
        ctx.restore();
      }
      ctx.save();
      ctx.lineWidth = 1;
      ctx.setLineDash([1.5, 5]);
      ctx.strokeStyle = palette.planned;
      ctx.globalAlpha = clippedTime <= 0.01 ? 0.75 : 0.5;
      strokeSmoothPath(ctx, allPoints);
      ctx.restore();
    }

    if (show.trail) {
      const consumed = traceSamples(result.samples, clippedTime, sx, sy, 1600);
      if (consumed.length > 1) {
        ctx.save();
        const pathGradient = ctx.createLinearGradient(consumed[0].x, consumed[0].y, consumed[consumed.length - 1].x, consumed[consumed.length - 1].y);
        pathGradient.addColorStop(0, hexToRgba(palette.trail, 0.18));
        pathGradient.addColorStop(0.35, palette.trail);
        pathGradient.addColorStop(1, palette.trailHi);

        ctx.strokeStyle = palette.trailGlow;
        ctx.lineWidth = 7;
        ctx.shadowColor = palette.trail;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.26;
        strokeSmoothPath(ctx, consumed);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pathGradient;
        ctx.lineWidth = 2.25;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        strokeSmoothPath(ctx, consumed);

        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = palette.trailHi;
        ctx.lineWidth = 0.7;
        strokeSmoothPath(ctx, consumed);
        ctx.restore();
      }
    }

    return finished;
  }

  function drawApexAnnotations(ctx, layout, palette, params, result, show, time, finished, playing) {
    if (!show.grid || result.totalTime <= 0) return;
    if (playing && !finished && time < result.maxHeightTime) return;
    if (params.angle <= 0 && params.y0 <= 0) return;
    const x = layout.sx(result.samples.reduce((best, s) => (s.y > best.y ? s : best), result.samples[0]).x);
    const apexSample = result.samples.reduce((best, s) => (s.y > best.y ? s : best), result.samples[0]);
    const y = layout.sy(apexSample.y);
    if (x < layout.plot.left || x > layout.plot.right || y < layout.plot.top - 30) return;

    ctx.save();
    ctx.strokeStyle = hexToRgba(palette.vectorY, 0.26);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, layout.groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = hexToRgba(palette.vectorY, 0.75);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    labelPill(
      ctx,
      `Hmax ${formatNumber(result.maxHeight, 1)} м`,
      x + 8,
      Math.max(layout.plot.top + 11, y - 14),
      palette,
      { align: "left", color: palette.text, border: palette.labelBorder }
    );
  }

  function drawRangeMeasure(ctx, layout, palette, params, result, target, finished, time, show) {
    if (!show.grid || result.totalTime <= 0) return;
    const x1 = layout.sx(0);
    const x2 = layout.sx(result.range);
    const y = layout.groundY - 12;
    if (Math.abs(x2 - x1) < 20) return;

    ctx.save();
    ctx.strokeStyle = hexToRgba(palette.text, 0.3);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = hexToRgba(palette.text, 0.36);
    ctx.beginPath();
    ctx.moveTo(x1, y - 4);
    ctx.lineTo(x1, y + 4);
    ctx.moveTo(x2, y - 4);
    ctx.lineTo(x2, y + 4);
    ctx.stroke();
    ctx.restore();

    const middle = (x1 + x2) / 2;
    const label = `L = ${formatNumber(result.range, 1)} м`;
    labelPill(ctx, label, middle, y - 12, palette, { color: palette.textMuted, border: palette.labelBorder, bg: palette.labelBg });

    if (target && target.enabled && !target.hit && finished) {
      const targetX = layout.sx(params.targetDistance);
      if (Math.abs(targetX - x2) > 8) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(palette.target, 0.7);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x2, layout.groundY + 4);
        ctx.lineTo(targetX, layout.groundY + 4);
        ctx.stroke();
        ctx.restore();
        labelPill(
          ctx,
          `${target.offset > 0 ? "перелёт" : "недолёт"} ${formatNumber(target.distance, 1)} м`,
          (x2 + targetX) / 2,
          layout.groundY + 16,
          palette,
          { color: palette.target, border: hexToRgba(palette.target, 0.28), bg: palette.labelBg }
        );
      }
    }
  }

  function drawCannon(ctx, layout, palette, params, time, interactive) {
    const origin = layout.origin;
    const groundY = layout.groundY;
    const angle = params.angle * RAD;
    const len = clamp(layout.plot.width * 0.078, 30, 56);
    const width = clamp(len * 0.24, 7, 11.5);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scale = clamp(layout.width / 1000, 0.78, 1.35);

    // Тень
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(origin.x - 8, groundY + 2, 36 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const pivotX = origin.x - cos * len * 0.48;
    const pivotY = origin.y + sin * len * 0.48;

    // Опоры
    ctx.save();
    ctx.strokeStyle = palette.cannonDark;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pivotX - 7, pivotY);
    ctx.lineTo(pivotX - 17, groundY - 4);
    ctx.moveTo(pivotX + 7, pivotY);
    ctx.lineTo(pivotX + 15, groundY - 4);
    ctx.stroke();

    ctx.fillStyle = palette.cannon;
    ctx.beginPath();
    ctx.moveTo(pivotX - 19, groundY);
    ctx.lineTo(pivotX - 8, groundY - 10);
    ctx.lineTo(pivotX + 6, groundY - 6);
    ctx.lineTo(pivotX + 17, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexToRgba(palette.cannonLight, 0.4);
    ctx.beginPath();
    ctx.moveTo(pivotX - 8, groundY - 10);
    ctx.lineTo(pivotX + 6, groundY - 6);
    ctx.lineTo(pivotX + 2, groundY - 2);
    ctx.lineTo(pivotX - 5, groundY - 3);
    ctx.closePath();
    ctx.fill();

    // Колесо
    const wheelR = 8 * scale;
    const wheelX = pivotX - 4;
    const wheelY = groundY - wheelR;
    ctx.fillStyle = palette.cannonDark;
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.cannonLight, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelR * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wheelX, wheelY);
      ctx.lineTo(wheelX + Math.cos(a) * wheelR * 0.7, wheelY + Math.sin(a) * wheelR * 0.7);
      ctx.stroke();
    }
    ctx.restore();

    // Ствол
    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(-angle);
    const bodyGradient = ctx.createLinearGradient(-len, -width, 0, width);
    bodyGradient.addColorStop(0, palette.cannonDark);
    bodyGradient.addColorStop(0.48, palette.cannon);
    bodyGradient.addColorStop(1, palette.cannonLight);
    ctx.beginPath();
    ctx.moveTo(-len, -width * 0.64);
    ctx.lineTo(-len * 0.12, -width * 0.82);
    ctx.lineTo(-3, -width * 0.66);
    ctx.lineTo(0, -width * 0.52);
    ctx.lineTo(0, width * 0.52);
    ctx.lineTo(-3, width * 0.66);
    ctx.lineTo(-len * 0.12, width * 0.82);
    ctx.lineTo(-len, width * 0.64);
    ctx.closePath();
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.cannonDark, 0.9);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Грани ствола
    ctx.beginPath();
    ctx.moveTo(-len * 0.9, -width * 0.46);
    ctx.lineTo(-len * 0.2, -width * 0.6);
    ctx.lineTo(-len * 0.15, -width * 0.2);
    ctx.lineTo(-len * 0.85, -width * 0.15);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(palette.cannonLight, 0.34);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-len * 0.8, width * 0.1);
    ctx.lineTo(-len * 0.15, width * 0.3);
    ctx.lineTo(-len * 0.3, width * 0.56);
    ctx.lineTo(-len * 0.82, width * 0.38);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(palette.cannonDark, 0.45);
    ctx.fill();

    // Обоймы
    ctx.strokeStyle = hexToRgba(palette.cannonAccent, 0.52);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-len * 0.38, -width * 0.72);
    ctx.lineTo(-len * 0.43, width * 0.66);
    ctx.moveTo(-len * 0.74, -width * 0.65);
    ctx.lineTo(-len * 0.78, width * 0.59);
    ctx.stroke();

    // Дуло
    ctx.fillStyle = palette.cannonDark;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.5, width * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.cannonAccent, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.5, width * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Точка запуска
    ctx.save();
    const pulse = interactive ? 0.65 + Math.sin(performance.now() * 0.004) * 0.25 : 0.35;
    ctx.strokeStyle = hexToRgba(palette.cannonAccent, pulse);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 10 + Math.sin(performance.now() * 0.002) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawAimOverlay(ctx, layout, palette, params, interactive, origin, angle, len);
  }

  function drawAimOverlay(ctx, layout, palette, params, interactive, origin, angle, barrelLen) {
    if (!interactive) return;
    const radius = Math.max(50, Math.min(88, barrelLen * 1.8));
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = hexToRgba(palette.vectorX, 0.42);
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, radius, -angle, 0, false);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = hexToRgba(palette.vectorX, 0.26);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + Math.cos(angle) * (radius + 16), origin.y - Math.sin(angle) * (radius + 16));
    ctx.stroke();

    const handleX = origin.x + Math.cos(angle) * radius;
    const handleY = origin.y - Math.sin(angle) * radius;
    const pulse = 0.5 + Math.sin(performance.now() * 0.0045) * 0.16;
    ctx.fillStyle = hexToRgba(palette.vectorX, 0.12);
    ctx.beginPath();
    ctx.arc(handleX, handleY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.vectorX, 0.7);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(handleX, handleY, 4.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(palette.vectorX, pulse + 0.2);
    ctx.beginPath();
    ctx.arc(handleX, handleY, 1.8, 0, Math.PI * 2);
    ctx.fill();

    const midAngle = angle * 0.5;
    const labelX = origin.x + Math.cos(midAngle) * (radius + 17);
    const labelY = origin.y - Math.sin(midAngle) * (radius + 17);
    labelPill(
      ctx,
      `${Math.round(params.angle)}°`,
      labelX,
      labelY,
      palette,
      { color: palette.vectorX, border: hexToRgba(palette.vectorX, 0.26), bg: palette.labelBg, font: '600 8px "JetBrains Mono", monospace' }
    );
    ctx.restore();
  }

  function drawVelocityVectors(ctx, layout, palette, state, params, show, finished) {
    if (!show || finished || !state) return;
    const x = layout.sx(state.x);
    const y = layout.sy(state.y);
    if (x < 0 || x > layout.width + 20 || y < 0 || y > layout.height + 20) return;
    const maxReference = Math.max(params.v0, state.speed, 1);
    const lengthScale = Math.min(68, Math.max(42, layout.plot.width * 0.08)) / maxReference;

    const vx = state.vx * lengthScale;
    const vy = state.vy * lengthScale;
    const vxEndX = x + vx;
    const vxEndY = y;
    const vyEndX = x;
    const vyEndY = y - vy;
    const vEndX = x + vx;
    const vEndY = y - vy;

    ctx.save();
    // Компоненты
    ctx.setLineDash([3, 4]);
    if (Math.abs(vx) > 6) {
      drawArrow(ctx, x, y, vxEndX, vxEndY, hexToRgba(palette.vectorX, 0.68), 1, 4.5);
      ctx.fillStyle = hexToRgba(palette.vectorX, 0.8);
      ctx.font = '500 7.5px "JetBrains Mono", monospace';
      ctx.textAlign = vx >= 0 ? "left" : "right";
      ctx.textBaseline = "top";
      ctx.fillText("vx", vxEndX + (vx >= 0 ? 4 : -4), vxEndY + 4);
    }
    if (Math.abs(vy) > 6) {
      drawArrow(ctx, x, y, vyEndX, vyEndY, hexToRgba(palette.vectorY, 0.68), 1, 4.5);
      ctx.fillStyle = hexToRgba(palette.vectorY, 0.86);
      ctx.font = '500 7.5px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = vy >= 0 ? "bottom" : "top";
      ctx.fillText("vy", vyEndX + 4, vyEndY + (vy >= 0 ? -3 : 4));
    }
    ctx.setLineDash([]);

    // Полная скорость
    drawArrow(ctx, x, y, vEndX, vEndY, palette.vector, 1.8, 6);
    ctx.fillStyle = palette.vector;
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.textAlign = vx >= 0 ? "left" : "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("v", vEndX + (vx >= 0 ? 5 : -5), vEndY - 4);
    ctx.restore();
  }

  function drawProjectile(ctx, layout, palette, state, result, show, finished, time, interactive, hit) {
    if (!state) return;
    const x = layout.sx(state.x);
    const y = layout.sy(state.y);
    const compact = layout.compact;
    const baseRadius = compact ? 4.5 : 6.2;
    const now = performance.now();

    if (show && state.t > 0.02) {
      const particles = [
        { dt: 0.025, r: 3.6, a: 0.45 },
        { dt: 0.05, r: 2.8, a: 0.3 },
        { dt: 0.085, r: 2, a: 0.18 },
        { dt: 0.13, r: 1.2, a: 0.1 }
      ];
      ctx.save();
      for (const particle of particles) {
        const ps = P.interpolateState(result.samples, Math.max(0, time - particle.dt));
        if (!ps) continue;
        ctx.fillStyle = hexToRgba(palette.particle, particle.a);
        ctx.beginPath();
        ctx.arc(layout.sx(ps.x), layout.sy(ps.y), particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Свечение
    const glowRadius = baseRadius * (finished ? 3 : 4);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    glow.addColorStop(0, hexToRgba(palette.ballHi, finished ? 0.3 : 0.52));
    glow.addColorStop(0.5, hexToRgba(palette.ball, finished ? 0.12 : 0.25));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Низкополигональный снаряд
    const rotation = time * 2.6 + (state.angle || 0) * 0.02;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    const facets = 8;
    for (let i = 0; i < facets; i += 1) {
      const a1 = (i / facets) * Math.PI * 2;
      const a2 = ((i + 1) / facets) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a1) * baseRadius, Math.sin(a1) * baseRadius);
      ctx.lineTo(Math.cos(a2) * baseRadius, Math.sin(a2) * baseRadius);
      ctx.closePath();
      ctx.fillStyle = i % 3 === 0 ? palette.ballHi : i % 3 === 1 ? palette.ball : palette.ballDark;
      ctx.fill();
    }
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = palette.ballHi;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (interactive && !finished) {
      const pulse = 1 + Math.sin(now * 0.005) * 0.16;
      ctx.strokeStyle = hexToRgba(palette.vectorX, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, baseRadius + 7 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (finished && hit) {
      ctx.save();
      ctx.fillStyle = palette.labelBg;
      ctx.strokeStyle = hexToRgba(palette.target, 0.45);
      ctx.lineWidth = 1;
      // Надпись «В цель» появляется только у завершённого попадания.
      labelPill(ctx, "В ЦЕЛЬ", x, y - 28, palette, {
        color: palette.target,
        border: hexToRgba(palette.target, 0.4),
        bg: palette.labelBg,
        font: '600 8px "JetBrains Mono", monospace'
      });
      ctx.restore();
    }
  }

  function drawImpact(ctx, layout, palette, result, target, time, show) {
    if (!result || result.totalTime <= 0) return;
    if (time < result.totalTime - 1e-6) return;
    const x = layout.sx(result.impact.x);
    const y = layout.groundY;
    if (!Number.isFinite(x)) return;

    const hit = target && target.enabled && target.hit;
    const age = clamp((performance.now() % 60000) / 1000, 0, 60);
    // Статичная отметка удара; лёгкая анимация не влияет на экспорт.
    ctx.save();
    const ringRadius = 9 + Math.sin(age * 2) * 1.4;
    ctx.strokeStyle = hit ? hexToRgba(palette.target, 0.6) : hexToRgba(palette.impact, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, ringRadius, ringRadius * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = hit ? hexToRgba(palette.target, 0.2) : hexToRgba(palette.impact, 0.18);
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 4.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i += 1) {
      const px = x + (i - 2) * 4.5;
      const ph = 3 + (i % 3) * 2;
      ctx.fillStyle = hexToRgba(palette.dust, 0.25);
      ctx.beginPath();
      ctx.moveTo(px - 2, y);
      ctx.lineTo(px, y - ph);
      ctx.lineTo(px + 2, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (hit && show) {
      const rng = mulberry32(0x99ac12);
      const paletteColors = [palette.ball, palette.target, palette.vectorX, palette.vectorY, palette.ballHi];
      for (let i = 0; i < 18; i += 1) {
        const angle = -Math.PI + rng() * Math.PI * 2;
        const speed = 8 + rng() * 26;
        const offset = Math.sin(age * 4 + i) * 0.4;
        const px = x + Math.cos(angle) * speed + offset * 8;
        const py = y - 12 + Math.sin(angle) * speed * 0.55;
        ctx.fillStyle = hexToRgba(paletteColors[i % paletteColors.length], 0.5);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.fillRect(-1.4, -1.4, 2.8, 2.8);
        ctx.restore();
      }
    }
  }

  function drawExportCaption(ctx, width, height, palette, params, result, target) {
    ctx.save();
    ctx.fillStyle = palette.text;
    ctx.font = '700 15px "Unbounded", "Onest", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("БАЛЛИСТИКА", 28, 24);
    ctx.fillStyle = palette.textMuted;
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.letterSpacing = "0.14em";
    ctx.fillText("ЛАБОРАТОРИЯ ДВИЖЕНИЯ · СНИМОК ЭКСПЕРИМЕНТА", 28, 48);

    ctx.textAlign = "right";
    ctx.fillStyle = palette.text;
    ctx.font = '600 10px "JetBrains Mono", monospace';
    const paramsLine = `v₀ = ${formatNumber(params.v0, 0)} м/с   α = ${formatNumber(params.angle, 0)}°   y₀ = ${formatNumber(params.y0, 1)} м   g = ${formatNumber(params.g, 2)} м/с²`;
    ctx.fillText(paramsLine, width - 28, 30);
    ctx.fillStyle = palette.textMuted;
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillText(params.dragEnabled ? "модель: RK4 + сопротивление воздуха" : "модель: идеальная парабола (вакуум)", width - 28, 48);

    const lineY = height - 44;
    ctx.strokeStyle = palette.labelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, lineY);
    ctx.lineTo(width - 28, lineY);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = palette.textMuted;
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillText(`L = ${formatNumber(result.range, 1)} м   ·   Hmax = ${formatNumber(result.maxHeight, 1)} м   ·   T = ${formatNumber(result.totalTime, 2)} с`, 28, lineY + 10);
    ctx.textAlign = "right";
    if (target && target.enabled) {
      ctx.fillStyle = target.hit ? palette.target : palette.textMuted;
      ctx.fillText(`мишень: ${target.hit ? "поражена" : "промах"}`, width - 28, lineY + 10);
    }
    ctx.restore();
  }

  function drawScene(ctx, width, height, view) {
    const params = view.params;
    const result = view.result;
    const reference = view.reference;
    const target = view.target;
    const show = view.show || {};
    const theme = view.theme || "dark";
    const palette = getPalette(theme);
    const now = performance.now();
    const currentTime = clamp(view.time || 0, 0, result.totalTime);
    const isPlaying = Boolean(view.playing);
    const interactive = Boolean(view.interactive) && !isPlaying;
    const finished = result.totalTime > 0 && currentTime >= result.totalTime - 1e-6;
    const layout = getLayout(width, height, params, result, reference, target);
    const current = P.interpolateState(result.samples, currentTime);

    ctx.clearRect(0, 0, width, height);
    drawSky(ctx, width, height, layout, palette, theme, now);
    drawLandscape(ctx, width, height, layout, palette, theme);
    if (show.grid) drawGrid(ctx, layout, palette, params, result);
    drawTarget(ctx, layout, palette, params, target, currentTime, finished, now);
    drawCannon(ctx, layout, palette, params, currentTime, interactive);
    drawPaths(ctx, layout, palette, params, result, reference, show, currentTime);
    drawApexAnnotations(ctx, layout, palette, params, result, show, currentTime, finished, isPlaying);
    drawRangeMeasure(ctx, layout, palette, params, result, target, finished, currentTime, show);
    drawVelocityVectors(ctx, layout, palette, current, params, show, finished);
    drawProjectile(ctx, layout, palette, current, result, show, finished, currentTime, interactive, target && target.hit);
    drawImpact(ctx, layout, palette, result, target, currentTime, show);
    if (layout.exporting) drawExportCaption(ctx, width, height, palette, params, result, target);

    return { layout, palette };
  }

  function create(canvas, options) {
    const opts = options || {};
    const ctx = canvas.getContext("2d");
    const state = {
      view: null,
      width: 0,
      height: 0,
      dpr: 1,
      dragging: false,
      layout: null,
      raf: null
    };
    const wrapper = canvas.closest(".stage-wrap");

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(rect.width * dpr);
      const pixelHeight = Math.round(rect.height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      state.width = rect.width;
      state.height = rect.height;
      state.dpr = dpr;
      if (state.view) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, rect.width, rect.height, state.view);
        state.layout = getLayout(rect.width, rect.height, state.view.params, state.view.result, state.view.reference, state.view.target);
      }
    }

    function render(view) {
      state.view = view;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (state.width !== rect.width || state.height !== rect.height || state.dpr !== dpr) {
        state.dpr = dpr;
        state.width = rect.width;
        state.height = rect.height;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const drawn = drawScene(ctx, rect.width, rect.height, view);
      state.layout = drawn.layout;
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function isNearGrip(point) {
      if (!state.layout) return false;
      const origin = state.layout.origin;
      const radius = Math.max(100, Math.min(170, state.layout.width * 0.24));
      return Math.hypot(point.x - origin.x, point.y - origin.y) <= radius;
    }

    function setAngleFromPoint(point) {
      if (!state.layout) return;
      const origin = state.layout.origin;
      const angle = Math.atan2(origin.y - point.y, point.x - origin.x) / RAD;
      const clamped = Math.round(clamp(angle, 0, 90));
      if (opts.onAim) opts.onAim(clamped);
    }

    function onPointerDown(event) {
      if (!state.view || !state.view.interactive || state.view.playing) return;
      const point = pointFromEvent(event);
      if (!isNearGrip(point)) return;
      event.preventDefault();
      state.dragging = true;
      state.dragPointer = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      if (wrapper) {
        wrapper.classList.add("is-dragging");
        wrapper.classList.remove("is-armable");
      }
      setAngleFromPoint(point);
      if (opts.onDragChange) opts.onDragChange(true);
    }

    function onPointerMove(event) {
      const point = pointFromEvent(event);
      if (state.dragging) {
        event.preventDefault();
        setAngleFromPoint(point);
        return;
      }
      if (!state.view || !state.view.interactive || state.view.playing) {
        canvas.style.cursor = "default";
        if (wrapper) wrapper.classList.remove("is-armable");
        return;
      }
      const near = isNearGrip(point);
      canvas.style.cursor = near ? "grab" : "default";
      if (wrapper) wrapper.classList.toggle("is-armable", near);
    }

    function endDrag(event) {
      if (!state.dragging) return;
      state.dragging = false;
      if (event && canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      if (wrapper) wrapper.classList.remove("is-dragging");
      if (opts.onDragChange) opts.onDragChange(false);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", () => {
      if (!state.dragging && wrapper) wrapper.classList.remove("is-armable");
    });

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => resize());
      observer.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener("resize", resize);
    }
    resize();

    function exportCanvas(view, requestedWidth) {
      const exportWidth = requestedWidth || 1600;
      const logicalWidth = 960;
      const logicalHeight = 540;
      const scale = exportWidth / logicalWidth;
      const exportHeight = Math.round(logicalHeight * scale);
      const offscreen = document.createElement("canvas");
      offscreen.width = exportWidth;
      offscreen.height = exportHeight;
      const offCtx = offscreen.getContext("2d");
      offCtx.scale(scale, scale);
      const exportView = Object.assign({}, view, {
        params: Object.assign({}, view.params, { __export: true }),
        interactive: false,
        playing: false
      });
      drawScene(offCtx, logicalWidth, logicalHeight, exportView);
      return offscreen;
    }

    return {
      render,
      resize,
      exportCanvas,
      destroy() {
        if (observer) observer.disconnect();
        else window.removeEventListener("resize", resize);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", endDrag);
        canvas.removeEventListener("pointercancel", endDrag);
      }
    };
  }

  root.Ballistics = root.Ballistics || {};
  root.Ballistics.Scene = { create };
}(window));
