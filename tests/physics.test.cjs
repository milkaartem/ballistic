const assert = require("node:assert/strict");
const P = require("../src/physics.js");

const close = (actual, expected, tolerance, label) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: ожидалось ${expected} ± ${tolerance}, получено ${actual}`
  );
};

(function testVacuum45() {
  const result = P.simulate({ v0: 30, angle: 45, y0: 0, g: 9.81, dragEnabled: false });
  close(result.totalTime, 2 * 30 * Math.SQRT1_2 / 9.81, 0.002, "Время полёта 45°");
  close(result.range, 30 * 30 / 9.81, 0.02, "Дальность 45°");
  close(result.maxHeight, 30 * 30 / (4 * 9.81), 0.02, "Максимальная высота");
  close(result.impactSpeed, 30, 0.001, "Скорость удара");
  close(result.impactAngle, 45, 0.01, "Угол удара");
  assert.equal(result.model, "vacuum");
  assert.ok(result.samples.length > 20);
})();

(function testVacuumWithHeight() {
  const result = P.simulate({ v0: 20, angle: 30, y0: 10, g: 9.81, dragEnabled: false });
  const expectedTime = (20 * Math.sin(Math.PI / 6) + Math.sqrt(
    20 * 20 * 0.25 + 2 * 9.81 * 10
  )) / 9.81;
  close(result.totalTime, expectedTime, 0.01, "Время с высоты");
  close(result.range, 20 * Math.cos(Math.PI / 6) * expectedTime, 0.02, "Дальность с высоты");
  close(result.impact.y, 0, 1e-9, "Точка удара на земле");
})();

(function testHorizontalFromHeight() {
  const result = P.simulate({ v0: 12, angle: 0, y0: 20, g: 9.81, dragEnabled: false });
  const t = Math.sqrt(2 * 20 / 9.81);
  close(result.totalTime, t, 0.001, "Время падения");
  close(result.range, 12 * t, 0.02, "Горизонтальная дальность");
  close(result.maxHeight, 20, 1e-9, "Высота не растёт");
})();

(function testGroundHorizontalIsNoFlight() {
  const result = P.simulate({ v0: 20, angle: 0, y0: 0, g: 9.81, dragEnabled: false });
  assert.equal(result.range, 0);
  assert.equal(result.totalTime, 0);
  assert.equal(result.samples.length, 1);
})();

(function testDragReducesRange() {
  const params = { v0: 32, angle: 45, y0: 1.5, g: 9.81, mass: 0.45, radius: 0.11, cd: 0.47 };
  const ideal = P.simulate({ ...params, dragEnabled: false });
  const real = P.simulate({ ...params, dragEnabled: true, wind: 0 });
  assert.equal(real.model, "drag");
  assert.ok(real.range < ideal.range, "Сопротивление должно уменьшать дальность");
  assert.ok(real.maxHeight < ideal.maxHeight, "Сопротивление должно уменьшать высоту");
  close(real.impact.y, 0, 1e-9, "Удар о землю в модели RK4");
  assert.ok(real.dragFactor > 0);
})();

(function testTailwindExtendsRange() {
  const base = {
    v0: 32, angle: 40, y0: 1.5, g: 9.81, dragEnabled: true,
    mass: 0.2, radius: 0.16, cd: 0.5, rho: 1.225
  };
  const noWind = P.simulate({ ...base, wind: 0 });
  const tailWind = P.simulate({ ...base, wind: 12 });
  const headWind = P.simulate({ ...base, wind: -12 });
  assert.ok(tailWind.range > noWind.range, "Попутный ветер увеличивает дальность");
  assert.ok(headWind.range < noWind.range, "Встречный ветер уменьшает дальность");
})();

(function testInterpolation() {
  const result = P.simulate({ v0: 30, angle: 45, y0: 0, g: 9.81, dragEnabled: false });
  const state = P.interpolateState(result.samples, result.totalTime / 2);
  close(state.y, result.maxHeight, 0.05, "Высота в середине полёта");
  assert.ok(state.speed > 0);
})();

(function testTargetEvaluation() {
  const params = {
    v0: 30, angle: 45, y0: 0, g: 9.81,
    targetEnabled: true, targetDistance: 91.7, targetRadius: 3
  };
  const result = P.simulate(params);
  const target = P.evaluateTarget(result, params);
  assert.equal(target.enabled, true);
  assert.equal(target.hit, true);
  assert.equal(target.score, 3);
})();

(function testAutoAim() {
  const params = {
    v0: 30, angle: 25, y0: 0, g: 9.81,
    targetEnabled: true, targetDistance: 60, targetRadius: 1
  };
  const solved = P.solveAngleForTarget(params);
  assert.equal(solved.hit, true, `Автоприцел промахнулся: ${solved.error}`);
  close(solved.result.range, 60, 1, "Дальность после автоприцела");
  assert.ok(solved.angle > 20 && solved.angle < 70);
})();

(function testAutoAimWithDrag() {
  const params = {
    v0: 35, angle: 35, y0: 1.5, g: 9.81, dragEnabled: true,
    mass: 0.45, radius: 0.11, cd: 0.47, rho: 1.225, wind: 3,
    targetEnabled: true, targetDistance: 50, targetRadius: 2
  };
  const solved = P.solveAngleForTarget(params);
  assert.equal(solved.hit, true, `Численный автоприцел промахнулся: ${solved.error}`);
  close(solved.result.range, 50, 2, "Дальность с сопротивлением");
})();

(function testOptimalAngle() {
  close(P.optimalVacuumAngle({ v0: 30, y0: 0, g: 9.81 }), 45, 0.001, "Оптимум с земли");
  assert.ok(P.optimalVacuumAngle({ v0: 30, y0: 10, g: 9.81 }) < 45, "С высоты угол меньше 45°");
})();

(function testCsv() {
  const result = P.simulate({ v0: 20, angle: 30, y0: 1, g: 9.81 });
  const csv = P.csvFromResult(result);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], "time_s,x_m,y_m,vx_ms,vy_ms,speed_ms,angle_deg");
  assert.equal(lines.length, result.samples.length + 1);
})();

console.log("OK — все проверки физики пройдены.");
