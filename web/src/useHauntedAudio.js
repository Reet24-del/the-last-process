import { useCallback, useEffect, useRef, useState } from "react";

// Procedural audio only. No microphone, voice cloning or external audio requests.
export function useHauntedAudio() {
  const [enabled, setEnabled] = useState(false);
  const graph = useRef(null);
  const switching = useRef(false);
  const toggle = useCallback(async () => {
    if (switching.current) return;
    switching.current = true;
    try {
      if (graph.current) {
        const old = graph.current;
        graph.current = null;
        setEnabled(false);
        await old.context.close();
        return;
      }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error("Audio unavailable");
      const context = new Audio();
      const master = context.createGain();
      master.gain.value = 0.18;
      master.connect(context.destination);
      const bed = context.createGain();
      bed.gain.value = 0.12;
      bed.connect(master);
      graph.current = { context, master, bed };
      [55, 82.41, 110.1].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        const gain = context.createGain();
        gain.gain.value = index === 2 ? 0.15 : 0.5;
        oscillator.connect(gain);
        gain.connect(bed);
        oscillator.start();
      });
      const buffer = context.createBuffer(
        1,
        context.sampleRate * 4,
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02;
        data[i] = last * 3;
      }
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      const noiseGain = context.createGain();
      noiseGain.gain.value = 0.07;
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();
      await context.resume();
      setEnabled(true);
    } catch (error) {
      if (graph.current) {
        await graph.current.context.close();
        graph.current = null;
      }
      setEnabled(false);
      throw error;
    } finally {
      switching.current = false;
    }
  }, []);

  const cue = useCallback((kind) => {
    const current = graph.current;
    if (!current || current.context.state !== "running") return;
    const { context, master, bed } = current;
    const now = context.currentTime;
    if (kind === "enter") bed.gain.setTargetAtTime(0.12, now, 0.3);
    if (kind === "ending") bed.gain.setTargetAtTime(0.02, now, 0.8);
    const notes =
      {
        enter: [220, 164.81],
        unlock: [392, 523.25],
        wrong: [110],
        hint: [330, 311.13],
        ending: [261.63, 392, 523.25],
      }[kind] || [];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.13;
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(
        kind === "wrong" ? 0.09 : 0.13,
        start + 0.025,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.75);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }, []);

  useEffect(
    () => () => {
      const current = graph.current;
      graph.current = null;
      current?.context.close();
    },
    [],
  );
  return { enabled, toggle, cue };
}
