import { useEffect, useMemo, useState } from 'react';
import { ProgressRing } from './components/ProgressRing';
import { useMeditationAudio } from './hooks/useMeditationAudio';
import { useWakeLock } from './hooks/useWakeLock';

const DURATIONS = [15, 20, 30] as const;
type DurationMinutes = (typeof DURATIONS)[number];
type SessionState = 'idle' | 'running' | 'paused' | 'complete';

const SECOND = 1000;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function safeDuration(value: number): DurationMinutes {
  return DURATIONS.includes(value as DurationMinutes) ? (value as DurationMinutes) : 15;
}

function App() {
  const storedDuration = Number(localStorage.getItem('meditation-duration'));
  const storedVolume = Number(localStorage.getItem('meditation-volume'));

  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(safeDuration(storedDuration));
  const [secondsLeft, setSecondsLeft] = useState(safeDuration(storedDuration) * 60);
  const [state, setState] = useState<SessionState>('idle');
  const [volumePercent, setVolumePercent] = useState(
    Number.isFinite(storedVolume) ? Math.min(100, Math.max(0, storedVolume)) : 40
  );

  const totalSeconds = durationMinutes * 60;
  const progress = useMemo(() => 1 - secondsLeft / totalSeconds, [secondsLeft, totalSeconds]);

  const audio = useMeditationAudio(volumePercent / 100);

  useWakeLock(state === 'running');

  useEffect(() => {
    if (state !== 'running') return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, SECOND);

    return () => window.clearInterval(intervalId);
  }, [state]);

  useEffect(() => {
    if (secondsLeft === 0 && state !== 'complete') {
      setState('complete');
      audio.stop();
    }
  }, [audio, secondsLeft, state]);

  useEffect(() => {
    localStorage.setItem('meditation-duration', String(durationMinutes));
  }, [durationMinutes]);

  useEffect(() => {
    localStorage.setItem('meditation-volume', String(volumePercent));
  }, [volumePercent]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (state === 'idle' || state === 'complete') {
          void handleStart();
        } else if (state === 'running') {
          handlePause();
        } else {
          void handleResume();
        }
      }

      if (event.code === 'Escape') {
        handleEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const selectDuration = (minutes: DurationMinutes) => {
    setDurationMinutes(minutes);
    if (state === 'idle' || state === 'complete') {
      setSecondsLeft(minutes * 60);
      setState('idle');
    }
  };

  const handleStart = async () => {
    if (state === 'running') return;
    if (state === 'complete') {
      setSecondsLeft(totalSeconds);
    }
    await audio.play();
    setState('running');
  };

  const handlePause = () => {
    if (state !== 'running') return;
    void audio.pause();
    setState('paused');
  };

  const handleResume = async () => {
    if (state !== 'paused') return;
    await audio.play();
    setState('running');
  };

  const handleEnd = () => {
    audio.stop();
    setSecondsLeft(totalSeconds);
    setState('idle');
  };

  const primaryLabel = state === 'running' ? 'Pause' : state === 'paused' ? 'Resume' : 'Start';

  return (
    <main className="app-shell">
      <section className="panel" aria-label="Meditation timer panel">
        <p className="eyebrow">Meditation Timer</p>
        <h1>Deep Focus Session</h1>

        <div className="duration-picker" role="group" aria-label="Select duration">
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={minutes === durationMinutes ? 'active' : ''}
              onClick={() => selectDuration(minutes)}
            >
              {minutes} min
            </button>
          ))}
        </div>

        <div className="timer-wrap">
          <ProgressRing progress={progress} label="Meditation progress" />
          <p className="timer-value" aria-live="polite">
            {formatTime(secondsLeft)}
          </p>
        </div>

        <div className="controls">
          {(state === 'idle' || state === 'complete') && (
            <button type="button" className="primary" onClick={() => void handleStart()}>
              {state === 'complete' ? 'Restart' : 'Start'}
            </button>
          )}

          {(state === 'running' || state === 'paused') && (
            <button
              type="button"
              className="primary"
              onClick={state === 'running' ? handlePause : () => void handleResume()}
            >
              {primaryLabel}
            </button>
          )}

          <button type="button" className="ghost" onClick={handleEnd}>
            End
          </button>
        </div>

        <label className="volume-control" htmlFor="volume">
          Volume
          <input
            id="volume"
            type="range"
            min="0"
            max="100"
            value={volumePercent}
            onChange={(event) => setVolumePercent(Number(event.target.value))}
            aria-label="Meditation audio volume"
          />
          <span>{volumePercent}%</span>
        </label>

        {state === 'complete' && <p className="complete-msg">Session complete. Breathe in the stillness.</p>}
        {audio.mode === 'tone' && <p className="audio-hint">Using ambient tone fallback (add /public/calm.mp3 for custom audio).</p>}
      </section>
    </main>
  );
}

export default App;
