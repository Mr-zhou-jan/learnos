"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  script: string;
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
  label?: string;
  autoPlay?: boolean;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  script,
  playing: externalPlaying,
  onPlayingChange,
  onEnded,
  label,
  autoPlay = false,
}: AudioPlayerProps) {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPlaying = externalPlaying !== undefined ? externalPlaying : internalPlaying;

  const setPlaying = useCallback(
    (v: boolean) => {
      setInternalPlaying(v);
      onPlayingChange?.(v);
    },
    [onPlayingChange]
  );

  const estimatedDuration = script ? Math.max(3, script.split(/\s+/).length / 2.5) : 10;

  const play = useCallback(() => {
    if (!script || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    if (intervalRef.current) clearInterval(intervalRef.current);

    const cleanText = script.replace(/[🎧📻❓📖📝📄🔗✍️🌐📐📚]/g, "");
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = "en-US";
    u.rate = 0.85;
    u.pitch = 1;

    setDuration(estimatedDuration);
    setCurrentTime(elapsedBeforePauseRef.current);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current) / 1000;
      setCurrentTime(Math.min(elapsed, estimatedDuration));
    }, 200);

    u.onend = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentTime(estimatedDuration);
      setPlaying(false);
      elapsedBeforePauseRef.current = 0;
      onEnded?.();
    };
    u.onerror = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaying(false);
    };

    window.speechSynthesis.speak(u);
    setPlaying(true);
  }, [script, estimatedDuration, setPlaying, onEnded]);

  const pause = useCallback(() => {
    window.speechSynthesis.cancel();
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedBeforePauseRef.current += (Date.now() - startTimeRef.current) / 1000;
    setPlaying(false);
  }, [setPlaying]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedBeforePauseRef.current = 0;
    setCurrentTime(0);
    setPlaying(false);
  }, [setPlaying]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, estimatedDuration));
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
      elapsedBeforePauseRef.current = clamped;
      setCurrentTime(clamped);

      if (isPlaying) {
        const ratio = clamped / estimatedDuration;
        const words = script.replace(/[🎧📻❓📖📝📄🔗✍️🌐📐📚]/g, "").split(/\s+/);
        const startWord = Math.floor(words.length * ratio);
        const remaining = words.slice(startWord).join(" ");
        if (remaining.trim()) {
          const u = new SpeechSynthesisUtterance(remaining);
          u.lang = "en-US";
          u.rate = 0.85;
          u.pitch = 1;
          startTimeRef.current = Date.now();
          intervalRef.current = setInterval(() => {
            const elapsed = clamped + (Date.now() - startTimeRef.current) / 1000;
            setCurrentTime(Math.min(elapsed, estimatedDuration));
          }, 200);
          u.onend = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setCurrentTime(estimatedDuration);
            setPlaying(false);
            elapsedBeforePauseRef.current = 0;
            onEnded?.();
          };
          u.onerror = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setPlaying(false);
          };
          window.speechSynthesis.speak(u);
        }
      }
    },
    [script, estimatedDuration, isPlaying, setPlaying, onEnded]
  );

  const rewind15 = useCallback(() => seek(currentTime - 15), [currentTime, seek]);
  const forward15 = useCallback(() => seek(currentTime + 15), [currentTime, seek]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      seek((e.clientX - rect.left) / rect.width * estimatedDuration);
    },
    [estimatedDuration, seek]
  );

  useEffect(() => {
    if (autoPlay && script) play();
    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!script) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-zinc-900 rounded-xl p-4 text-white">
      {label && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
      )}

      <div
        className="relative h-2 bg-zinc-700 rounded-full cursor-pointer mb-3 group"
        onClick={handleProgressClick}
      >
        <div
          className="absolute inset-y-0 left-0 bg-primary-400 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 tabular-nums w-10">{fmt(currentTime)}</span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={rewind15}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
            title="后退15秒"
          >
            <SkipBack className="w-4 h-4" />
            <span className="text-[10px] font-bold ml-0.5">15</span>
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className="w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-400 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={forward15}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
            title="前进15秒"
          >
            <span className="text-[10px] font-bold mr-0.5">15</span>
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={stop}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors ml-1"
            title="重新播放"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-xs text-zinc-400 tabular-nums w-10 text-right">{fmt(duration)}</span>
      </div>
    </div>
  );
}
