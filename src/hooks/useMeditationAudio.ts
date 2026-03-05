import { useCallback, useEffect, useRef, useState } from 'react';

type AudioMode = 'none' | 'file' | 'tone';

const CALM_AUDIO_PATH = '/calm.mp3';

export function useMeditationAudio(volume: number) {
  const [mode, setMode] = useState<AudioMode>('none');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  const cleanNodes = useCallback(() => {
    audioBufferSourceRef.current?.stop();
    audioBufferSourceRef.current?.disconnect();
    oscillatorRef.current?.stop();
    oscillatorRef.current?.disconnect();
    audioBufferSourceRef.current = null;
    oscillatorRef.current = null;
  }, []);

  const getContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const ensureGainNode = useCallback((ctx: AudioContext) => {
    if (!gainNodeRef.current) {
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;
    }
    return gainNodeRef.current;
  }, [volume]);

  const play = useCallback(async () => {
    const ctx = await getContext();
    const gainNode = ensureGainNode(ctx);

    cleanNodes();

    try {
      const response = await fetch(CALM_AUDIO_PATH);
      if (!response.ok) throw new Error('Audio file missing');
      const fileData = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(fileData);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start(0, offsetRef.current % buffer.duration);
      startTimeRef.current = ctx.currentTime - offsetRef.current;
      audioBufferSourceRef.current = source;
      source.onended = () => {
        if (audioBufferSourceRef.current === source) {
          audioBufferSourceRef.current = null;
        }
      };
      setMode('file');
      return;
    } catch {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 174;
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 8;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(gainNode);
      osc.start();
      lfo.start();
      oscillatorRef.current = osc;
      startTimeRef.current = ctx.currentTime - offsetRef.current;
      setMode('tone');
    }
  }, [cleanNodes, ensureGainNode, getContext]);

  const pause = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    offsetRef.current = Math.max(0, ctx.currentTime - startTimeRef.current);
    cleanNodes();
  }, [cleanNodes]);

  const stop = useCallback(() => {
    offsetRef.current = 0;
    cleanNodes();
    setMode('none');
  }, [cleanNodes]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime ?? 0, 0.08);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
      audioContextRef.current = null;
    };
  }, [stop]);

  return { play, pause, stop, mode };
}
