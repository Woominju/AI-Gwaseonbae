"use client";
/**
 * 공간별 환경음·배경음 (Web Audio API 로 브라우저에서 직접 합성 — 외부 음원·스트리밍 없음).
 *  - 초기 상태: 꺼짐. 사용자가 '소리 켜기'를 눌러야 AudioContext 를 만든다(자동 재생 없음).
 *  - 장소 이동 시 1.2초 크로스페이드.
 *  - 상담 집중을 방해하지 않도록 전체 음량 상한을 낮게 둔다.
 * 광장: 바람(필터링된 브라운 노이즈 + 느린 LFO) + 새소리(짧은 사인 스윕)
 * 도서관: 낮은 실내 룸톤 + 가끔 페이지 넘기는 소리(대역 통과 노이즈 버스트)
 * 카페: 웅성거림(대역 통과 핑크 노이즈) + 컵 소리(고음 부분음 감쇠) + 잔잔한 자작 코드 진행
 */
import type { PlaceId } from "./places";

type Layer = { gain: GainNode; stop: () => void };

const MASTER_MAX = 0.5;

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layer: Layer | null = null;
  private noise: Record<"white" | "pink" | "brown", AudioBuffer> | null = null;
  private volume = 0.5;
  private muted = false;
  place: PlaceId | null = null;

  get enabled() {
    return !!this.ctx;
  }

  async enable(place: PlaceId) {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.noise = { white: this.makeNoise("white"), pink: this.makeNoise("pink"), brown: this.makeNoise("brown") };
    }
    await this.ctx.resume();
    this.applyVolume();
    this.switchTo(place);
  }

  disable() {
    this.layer?.stop();
    this.layer = null;
    this.place = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.applyVolume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolume();
  }

  private applyVolume() {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * MASTER_MAX, this.ctx.currentTime, 0.15);
  }

  switchTo(place: PlaceId) {
    if (!this.ctx || !this.master || this.place === place) return;
    this.place = place;
    const old = this.layer;
    const now = this.ctx.currentTime;
    if (old) {
      old.gain.gain.setTargetAtTime(0, now, 0.35);
      setTimeout(() => old.stop(), 1600);
    }
    const g = this.ctx.createGain();
    g.gain.value = 0;
    g.connect(this.master);
    const stop = place === "plaza" ? this.plaza(g) : place === "library" ? this.library(g) : this.cafe(g);
    g.gain.setTargetAtTime(1, now + 0.2, 0.4);
    this.layer = { gain: g, stop };
  }

  /** 짧은 효과음 (객체 클릭) */
  sfx(name: "clink" | "page" | "chirp" | "pop" | "splash") {
    if (!this.ctx || !this.master || this.muted) return;
    const out = this.master;
    if (name === "splash") this.splash(out);
    else if (name === "clink") this.clink(out, 0.5);
    else if (name === "page") this.page(out, 0.6);
    else if (name === "chirp") this.chirp(out, 0.4);
    else this.pop(out);
  }

  /* ---------- 합성 ---------- */

  private makeNoise(kind: "white" | "pink" | "brown"): AudioBuffer {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 3;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w * 0.5;
      else if (kind === "brown") {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      } else {
        b0 = 0.997 * b0 + 0.029591 * w;
        b1 = 0.985 * b1 + 0.032534 * w;
        b2 = 0.95 * b2 + 0.048056 * w;
        d[i] = (b0 + b1 + b2 + w * 0.05) * 0.9;
      }
    }
    return b;
  }

  private loop(kind: "white" | "pink" | "brown", dest: AudioNode, gain: number, filter?: { type: BiquadFilterType; f: number; q?: number }) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise![kind];
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = gain;
    let node: AudioNode = src;
    let bq: BiquadFilterNode | undefined;
    if (filter) {
      bq = ctx.createBiquadFilter();
      bq.type = filter.type;
      bq.frequency.value = filter.f;
      bq.Q.value = filter.q ?? 0.7;
      node.connect(bq);
      node = bq;
    }
    node.connect(g);
    g.connect(dest);
    src.start();
    return { src, g, bq, stop: () => { try { src.stop(); } catch { /* noop */ } src.disconnect(); g.disconnect(); bq?.disconnect(); } };
  }

  private lfo(param: AudioParam, rate: number, depth: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = rate;
    g.gain.value = depth;
    o.connect(g);
    g.connect(param);
    o.start();
    return () => { try { o.stop(); } catch { /* noop */ } o.disconnect(); g.disconnect(); };
  }

  private every(minMs: number, maxMs: number, fn: () => void) {
    let t: ReturnType<typeof setTimeout>;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      fn();
      t = setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
    };
    t = setTimeout(tick, minMs * 0.5 + Math.random() * minMs);
    return () => { alive = false; clearTimeout(t); };
  }

  private env(dest: AudioNode, peak: number, a: number, d: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest);
    setTimeout(() => g.disconnect(), (a + d) * 1000 + 200);
    return g;
  }

  private chirp(dest: AudioNode, vol: number) {
    const ctx = this.ctx!;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const o = ctx.createOscillator();
        o.type = "sine";
        const t = ctx.currentTime;
        const base = 2600 + Math.random() * 1200;
        o.frequency.setValueAtTime(base, t);
        o.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.05);
        o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.12);
        o.connect(this.env(dest, 0.08 * vol, 0.01, 0.13));
        o.start(t);
        o.stop(t + 0.16);
      }, i * 140);
    }
  }

  private page(dest: AudioNode, vol: number) {
    const ctx = this.ctx!;
    for (let k = 0; k < 2; k++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const src = ctx.createBufferSource();
        src.buffer = this.noise!.white;
        const bq = ctx.createBiquadFilter();
        bq.type = "bandpass";
        bq.frequency.value = 1800 + k * 900;
        bq.Q.value = 0.8;
        src.connect(bq);
        bq.connect(this.env(dest, 0.12 * vol, 0.02, 0.18));
        src.start(ctx.currentTime, Math.random() * 2);
        src.stop(ctx.currentTime + 0.25);
      }, k * 160);
    }
  }

  private clink(dest: AudioNode, vol: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    for (const f of [2637, 3951, 5274]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * (0.98 + Math.random() * 0.04);
      o.connect(this.env(dest, 0.05 * vol, 0.003, 0.5));
      o.start(t);
      o.stop(t + 0.6);
    }
  }

  /** 물 튀는 소리: 대역 통과 노이즈가 아래로 쓸려 내려가는 짧은 버스트 */
  private splash(dest: AudioNode) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise!.white;
    const bq = ctx.createBiquadFilter();
    bq.type = "bandpass";
    bq.Q.value = 1.2;
    const t = ctx.currentTime;
    bq.frequency.setValueAtTime(2400, t);
    bq.frequency.exponentialRampToValueAtTime(500, t + 0.5);
    src.connect(bq);
    bq.connect(this.env(dest, 0.12, 0.01, 0.55));
    src.start(t, Math.random());
    src.stop(t + 0.6);
  }

  private pop(dest: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const t = ctx.currentTime;
    o.type = "triangle";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.08);
    o.connect(this.env(dest, 0.06, 0.005, 0.12));
    o.start(t);
    o.stop(t + 0.15);
  }

  private plaza(dest: GainNode) {
    const wind = this.loop("brown", dest, 0.18, { type: "lowpass", f: 420 });
    const l1 = this.lfo(wind.bq!.frequency, 0.07, 220);
    const l2 = this.lfo(wind.g.gain, 0.11, 0.07);
    const birds = this.every(2500, 7000, () => this.chirp(dest, 1));
    return () => { l1(); l2(); birds(); wind.stop(); };
  }

  private library(dest: GainNode) {
    const room = this.loop("brown", dest, 0.07, { type: "lowpass", f: 220 });
    const hvac = this.loop("pink", dest, 0.015, { type: "bandpass", f: 900, q: 0.5 });
    const pages = this.every(7000, 15000, () => this.page(dest, 1));
    return () => { pages(); room.stop(); hvac.stop(); };
  }

  private cafe(dest: GainNode) {
    const ctx = this.ctx!;
    const murmur = this.loop("pink", dest, 0.06, { type: "bandpass", f: 520, q: 0.9 });
    const lm = this.lfo(murmur.g.gain, 0.23, 0.02);
    const clinks = this.every(5000, 11000, () => this.clink(dest, 1));
    // 자작 코드 진행 (Cmaj7 – Am7 – Dm7 – G7), 부드러운 패드 + 아르페지오
    const music = ctx.createGain();
    music.gain.value = 0.05;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    music.connect(lp);
    lp.connect(dest);
    const chords = [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [293.66, 349.23, 440.0, 523.25], [196.0, 246.94, 293.66, 349.23]];
    let ci = 0;
    const playChord = () => {
      if (!this.ctx) return;
      const t = ctx.currentTime;
      const ch = chords[ci++ % chords.length];
      for (const f of ch) {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f / 2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
        o.connect(g);
        g.connect(music);
        o.start(t);
        o.stop(t + 3.1);
      }
      ch.forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        const s = t + 0.35 + i * 0.55;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.35, s + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
        o.connect(g);
        g.connect(music);
        o.start(s);
        o.stop(s + 0.55);
      });
    };
    playChord();
    const iv = setInterval(playChord, 2800);
    return () => { lm(); clinks(); clearInterval(iv); murmur.stop(); setTimeout(() => { music.disconnect(); lp.disconnect(); }, 3200); };
  }
}
