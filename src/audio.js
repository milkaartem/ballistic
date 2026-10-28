(function registerAudio(root) {
  "use strict";

  let context = null;
  let master = null;
  let enabled = false;

  function ensureContext() {
    if (!context) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      context = new AudioCtx();
      master = context.createGain();
      master.gain.value = 0.42;
      master.connect(context.destination);
    }
    if (context.state === "suspended") context.resume();
    return true;
  }

  function noiseBuffer(duration) {
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function envelope(gain, start, peak, attack, decay) {
    gain.gain.cancelScheduledValues(start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  }

  function playLaunch() {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime;

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer(0.7);
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.Q.value = 0.9;
    noiseFilter.frequency.setValueAtTime(280, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(920, now + 0.1);
    noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.55);
    const noiseGain = context.createGain();
    envelope(noiseGain, now, 0.16, 0.015, 0.52);
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start(now);
    noise.stop(now + 0.72);

    const body = context.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(72, now);
    body.frequency.exponentialRampToValueAtTime(138, now + 0.11);
    body.frequency.exponentialRampToValueAtTime(48, now + 0.4);
    const bodyGain = context.createGain();
    envelope(bodyGain, now, 0.11, 0.015, 0.36);
    body.connect(bodyGain).connect(master);
    body.start(now);
    body.stop(now + 0.45);
  }

  function playImpact() {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime;

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer(0.4);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(440, now);
    filter.frequency.exponentialRampToValueAtTime(92, now + 0.28);
    const gain = context.createGain();
    envelope(gain, now, 0.22, 0.01, 0.34);
    noise.connect(filter).connect(gain).connect(master);
    noise.start(now);
    noise.stop(now + 0.4);

    const thud = context.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(112, now);
    thud.frequency.exponentialRampToValueAtTime(38, now + 0.23);
    const thudGain = context.createGain();
    envelope(thudGain, now, 0.2, 0.008, 0.26);
    thud.connect(thudGain).connect(master);
    thud.start(now);
    thud.stop(now + 0.3);
  }

  function playHit() {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime;
    const notes = [784, 1046.5, 1318.5];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.11;
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      const gain = context.createGain();
      envelope(gain, start, 0.09, 0.012, 0.34);
      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  function playClick() {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
    const gain = context.createGain();
    envelope(gain, now, 0.035, 0.004, 0.07);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (enabled) ensureContext();
  }

  function isEnabled() {
    return enabled;
  }

  root.Ballistics = root.Ballistics || {};
  root.Ballistics.Audio = {
    setEnabled,
    isEnabled,
    play(name) {
      if (!enabled) return;
      if (name === "launch") playLaunch();
      else if (name === "impact") playImpact();
      else if (name === "hit") playHit();
      else if (name === "click") playClick();
    }
  };
}(window));
