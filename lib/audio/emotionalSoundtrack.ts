"use client";

type SoundtrackState = {
  audioContext?: AudioContext;
  masterGain?: GainNode;
  intervalId?: number;
  nextChordIndex: number;
  started: boolean;
  muted: boolean;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
    __emotionalSoundtrack?: SoundtrackState;
  };

const chordProgression = [
  [220, 261.63, 329.63, 440],
  [196, 246.94, 293.66, 392],
  [174.61, 220, 261.63, 349.23],
  [196, 246.94, 329.63, 392],
];

const melodyNotes = [659.25, 587.33, 523.25, 493.88, 440, 523.25];
const SOUNDTRACK_EVENT = "emotional-soundtrack-change";

export function startEmotionalSoundtrack() {
  if (typeof window === "undefined") return;

  const audioWindow = window as AudioWindow;
  const state =
    audioWindow.__emotionalSoundtrack ??
    (audioWindow.__emotionalSoundtrack = {
      nextChordIndex: 0,
      started: false,
      muted: false,
    });

  if (state.started) {
    void state.audioContext?.resume();
    emitSoundtrackChange();
    return;
  }

  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextConstructor) return;

  const audioContext = state.audioContext ?? new AudioContextConstructor();
  const masterGain = state.masterGain ?? audioContext.createGain();

  if (!state.masterGain) {
    masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }

  state.audioContext = audioContext;
  state.masterGain = masterGain;
  state.started = true;
  state.muted = Boolean(state.muted);

  void audioContext.resume();

  const now = audioContext.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
  masterGain.gain.linearRampToValueAtTime(state.muted ? 0.0001 : 0.11, now + 1.8);

  scheduleChord(state, now + 0.04);
  state.intervalId = window.setInterval(() => {
    if (!state.audioContext) return;
    scheduleChord(state, state.audioContext.currentTime + 0.04);
  }, 4200);
  emitSoundtrackChange();
}

export function getEmotionalSoundtrackState() {
  if (typeof window === "undefined") return { started: false, muted: false };
  const state = (window as AudioWindow).__emotionalSoundtrack;
  return { started: Boolean(state?.started), muted: Boolean(state?.muted) };
}

export function setEmotionalSoundtrackMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  const state = (window as AudioWindow).__emotionalSoundtrack;
  if (!state) return;

  state.muted = muted;
  if (state.audioContext && state.masterGain) {
    const now = state.audioContext.currentTime;
    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setValueAtTime(Math.max(state.masterGain.gain.value, 0.0001), now);
    state.masterGain.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.11, now + 0.45);
    if (!muted) void state.audioContext.resume();
  }
  emitSoundtrackChange();
}

export function subscribeToEmotionalSoundtrack(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(SOUNDTRACK_EVENT, listener);
  return () => window.removeEventListener(SOUNDTRACK_EVENT, listener);
}

function emitSoundtrackChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SOUNDTRACK_EVENT));
}

function scheduleChord(state: SoundtrackState, startsAt: number) {
  const audioContext = state.audioContext;
  const masterGain = state.masterGain;
  if (!audioContext || !masterGain) return;

  const chord = chordProgression[state.nextChordIndex % chordProgression.length];
  const melody = melodyNotes[state.nextChordIndex % melodyNotes.length];

  chord.forEach((frequency, index) => {
    playTone({
      audioContext,
      destination: masterGain,
      frequency,
      startsAt: startsAt + index * 0.035,
      duration: 5.6,
      volume: index === 0 ? 0.036 : 0.022,
      type: index === 0 ? "sine" : "triangle",
    });
  });

  playTone({
    audioContext,
    destination: masterGain,
    frequency: melody,
    startsAt: startsAt + 1.25,
    duration: 2.7,
    volume: 0.018,
    type: "sine",
  });

  state.nextChordIndex += 1;
}

function playTone({
  audioContext,
  destination,
  frequency,
  startsAt,
  duration,
  volume,
  type,
}: {
  audioContext: AudioContext;
  destination: AudioNode;
  frequency: number;
  startsAt: number;
  duration: number;
  volume: number;
  type: OscillatorType;
}) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  oscillator.detune.setValueAtTime((frequency % 11) - 5, startsAt);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1050, startsAt);
  filter.Q.setValueAtTime(0.8, startsAt);

  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.65);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration + 0.08);
}
