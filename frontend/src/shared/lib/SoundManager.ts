export type SoundName =
  | "move"
  | "capture"
  | "castle"
  | "check"
  | "checkmate"
  | "promote"
  | "illegal"
  | "game-start"
  | "game-end"
  | "lose"
  | "applause"
  | "button-click";

interface SoundConfig {
  src: string;
  volume?: number;
  allowOverlap?: boolean;
}

const SOUND_CONFIG: Record<SoundName, SoundConfig> = {
  move: { src: "/sounds/move.mp3" },
  capture: { src: "/sounds/capture.mp3" },
  castle: { src: "/sounds/castle.mp3" },
  check: { src: "/sounds/check.mp3" },
  checkmate: { src: "/sounds/checkmate.mp3" },
  promote: { src: "/sounds/promote.mp3" },
  illegal: { src: "/sounds/illegal.mp3" },
  "game-start": { src: "/sounds/game-start.mp3" },
  "game-end": { src: "/sounds/game-end.mp3" },
  // Subtle lose sfx: same file as game-end but played at a noticeably lower
  // volume so it feels quiet and understated compared to the win celebration.
  lose: { src: "/sounds/game-end.mp3", volume: 0.35 },
  applause: { src: "/sounds/applause.mp3", allowOverlap: true },
  "button-click": { src: "/sounds/button-click.mp3", allowOverlap: true },
};

export class SoundManager {
  private static sharedInstance: SoundManager;
  private sounds = new Map<SoundName, HTMLAudioElement>();
  private activeClones = new Set<HTMLAudioElement>();
  private muted = false;
  private globalVolume = 1;
  private readonly isBrowser = typeof window !== "undefined";

  constructor() {
    if (this.isBrowser) this.preload();
  }

  /** The shared, site-wide instance. Use this for boards that should follow the global mute preference. */
  static getInstance(): SoundManager {
    if (!SoundManager.sharedInstance) {
      SoundManager.sharedInstance = new SoundManager();
    }
    return SoundManager.sharedInstance;
  }

  /**
   * Creates a brand-new, independent SoundManager instance with its own
   * mute/volume state, isolated from the shared singleton and from any
   * other instance. Use this for a specific widget (e.g. HeroPuzzle) whose
   * mute toggle should NOT affect sound on the rest of the site.
   */
  static createInstance(): SoundManager {
    return new SoundManager();
  }

  private preload() {
    (Object.keys(SOUND_CONFIG) as SoundName[]).forEach((name) => {
      const config = SOUND_CONFIG[name];
      const audio = new Audio(config.src);
      audio.preload = "auto";
      audio.volume = (config.volume ?? 1) * this.globalVolume;
      audio.load();
      this.sounds.set(name, audio);
    });
  }

  play(name: SoundName) {
    if (!this.isBrowser || this.muted) return;

    const base = this.sounds.get(name);
    if (!base) {
      console.warn(`SoundManager: sound "${name}" not found`);
      return;
    }

    const config = SOUND_CONFIG[name];
    const node = config.allowOverlap
      ? (base.cloneNode(true) as HTMLAudioElement)
      : base;

    if (config.allowOverlap) {
      this.activeClones.add(node);
      const cleanup = () => {
        node.removeEventListener("ended", cleanup);
        node.removeEventListener("error", cleanup);
        node.src = "";
        this.activeClones.delete(node);
      };
      node.addEventListener("ended", cleanup);
      node.addEventListener("error", cleanup);
    } else {
      node.pause();
      node.currentTime = 0;
    }

    node.volume = (config.volume ?? 1) * this.globalVolume;
    node.play().catch((err: Error) => {
      // AbortError is expected: a second play() interrupted the pending promise of the previous call on the same node. The sound still plays correctly.
      if (err.name === 'AbortError') return;
      console.warn(`SoundManager: unable to play "${name}"`, err);
    });
  }

  playMove() {
    this.play("move");
  }

  playCapture() {
    this.play("capture");
  }

  playCastle() {
    this.play("castle");
  }

  playCheck() {
    this.play("check");
  }

  playCheckmate() {
    this.play("checkmate");
  }

  playPromote() {
    this.play("promote");
  }

  playIllegal() {
    this.play("illegal");
  }

  playGameStart() {
    this.play("game-start");
  }

  playGameEnd() {
    this.play("game-end");
  }

  /** Subtle lose sound — played when the player is checkmated in a puzzle. */
  playLose() {
    this.play("lose");
  }

  playApplause() {
    this.play("applause");
  }

  playButtonClick() {
    this.play("button-click");
  }

  stop(name: SoundName) {
    const audio = this.sounds.get(name);
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  stopAll() {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeClones.forEach((clone) => {
      clone.pause();
      clone.src = "";
    });
    this.activeClones.clear();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(volume: number) {
    this.globalVolume = Math.min(1, Math.max(0, volume));

    this.sounds.forEach((audio, name) => {
      const config = SOUND_CONFIG[name];
      audio.volume = (config.volume ?? 1) * this.globalVolume;
    });

    this.activeClones.forEach((clone) => {
      clone.volume = this.globalVolume;
    });
  }

  getVolume(): number {
    return this.globalVolume;
  }

  /**
   * Reads the stored sound preference from localStorage and applies it.
   * Only meaningful for the shared instance — call once at application
   * startup (e.g. in main.tsx or a top-level hook).
   * Defaults to sound ENABLED when no preference has been saved yet.
   */
  initFromStorage() {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem(SoundManager.STORAGE_KEY);
    this.muted = stored !== "true";
  }

  static readonly STORAGE_KEY = "sound-enabled";
}

// Shared, site-wide instance — used by anything that should follow the global mute preference.
export const soundManager = SoundManager.getInstance();