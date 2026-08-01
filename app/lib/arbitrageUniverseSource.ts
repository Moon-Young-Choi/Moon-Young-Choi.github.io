import type { ArbitrageUniverseV1, UniverseFrame } from "./arbitrageUniverse";

export type ArbitrageUniverseSnapshot = Readonly<{
  universe: ArbitrageUniverseV1;
  frame: UniverseFrame;
  frameIndex: number;
  playing: boolean;
}>;

export type ArbitrageUniverseSubscriber = (snapshot: ArbitrageUniverseSnapshot) => void;
export type UniverseTimerHandle = ReturnType<typeof globalThis.setInterval>;

export type UniverseScheduler = {
  setInterval: (callback: () => void, intervalMs: number) => UniverseTimerHandle;
  clearInterval: (handle: UniverseTimerHandle) => void;
};

export type SimulatedUniverseSourceOptions = {
  initialFrameIndex?: number;
  autoPlay?: boolean;
  scheduler?: UniverseScheduler;
};

export interface ArbitrageUniverseDataSource {
  load(): Promise<ArbitrageUniverseSnapshot>;
  subscribe(listener: ArbitrageUniverseSubscriber): () => void;
  pause(): void;
  resume(): void;
  close(): void;
}

export type ArbitrageUniverseSourceFactory = (
  signal?: AbortSignal,
) => Promise<ArbitrageUniverseDataSource>;

const defaultScheduler: UniverseScheduler = {
  setInterval(callback, intervalMs) {
    return globalThis.setInterval(callback, intervalMs);
  },
  clearInterval(handle) {
    globalThis.clearInterval(handle);
  },
};

function normalizedFrameIndex(index: number, frameCount: number) {
  if (!Number.isInteger(index)) throw new TypeError("initialFrameIndex must be an integer");
  return ((index % frameCount) + frameCount) % frameCount;
}

export class SimulatedUniverseSource implements ArbitrageUniverseDataSource {
  readonly universe: ArbitrageUniverseV1;

  private readonly scheduler: UniverseScheduler;
  private readonly listeners = new Set<ArbitrageUniverseSubscriber>();
  private frameIndex: number;
  private playing: boolean;
  private closed = false;
  private timer: UniverseTimerHandle | null = null;

  constructor(universe: ArbitrageUniverseV1, options: SimulatedUniverseSourceOptions = {}) {
    if (universe.schemaVersion !== 1) throw new Error("Unsupported arbitrage universe schema");
    if (universe.summary.frameIntervalMs !== 1000) {
      throw new Error("Simulated arbitrage universe must use a deterministic 1 Hz interval");
    }
    if (universe.frames.length === 0 || universe.frames.length !== universe.summary.frameCount) {
      throw new Error("Simulated arbitrage universe requires its complete frame sequence");
    }

    this.universe = universe;
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.frameIndex = normalizedFrameIndex(options.initialFrameIndex ?? 0, universe.frames.length);
    this.playing = options.autoPlay !== false;
  }

  async load(): Promise<ArbitrageUniverseSnapshot> {
    this.assertOpen();
    return this.snapshot();
  }

  subscribe(listener: ArbitrageUniverseSubscriber): () => void {
    this.assertOpen();
    if (typeof listener !== "function") throw new TypeError("Universe subscriber must be a function");

    this.listeners.add(listener);
    try {
      listener(this.snapshot());
    } catch (error) {
      this.listeners.delete(listener);
      throw error;
    }
    this.ensureTimer();

    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.clearTimer();
    };
  }

  pause(): void {
    if (this.closed || !this.playing) return;
    this.playing = false;
    this.clearTimer();
    this.emit();
  }

  resume(): void {
    if (this.closed || this.playing) return;
    this.playing = true;
    this.emit();
    this.ensureTimer();
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.playing = false;
    this.clearTimer();
    this.listeners.clear();
  }

  private assertOpen() {
    if (this.closed) throw new Error("Arbitrage universe data source is closed");
  }

  private snapshot(): ArbitrageUniverseSnapshot {
    const frame = this.universe.frames[this.frameIndex];
    if (!frame) throw new Error(`Arbitrage universe frame ${this.frameIndex} is missing`);
    return Object.freeze({
      universe: this.universe,
      frame,
      frameIndex: this.frameIndex,
      playing: this.playing,
    });
  }

  private ensureTimer() {
    if (this.closed || !this.playing || this.timer !== null || this.listeners.size === 0) return;
    this.timer = this.scheduler.setInterval(() => this.advance(), 1000);
    const timerWithUnref = this.timer as UniverseTimerHandle & { unref?: () => void };
    timerWithUnref.unref?.();
  }

  private clearTimer() {
    if (this.timer === null) return;
    this.scheduler.clearInterval(this.timer);
    this.timer = null;
  }

  private advance() {
    if (this.closed || !this.playing) return;
    this.frameIndex = (this.frameIndex + 1) % this.universe.frames.length;
    this.emit();
  }

  private emit() {
    if (this.listeners.size === 0) return;
    const snapshot = this.snapshot();
    for (const listener of [...this.listeners]) listener(snapshot);
  }
}
