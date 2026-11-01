import React, { useEffect, useRef, useState } from "react";
import { api, getToken, saveToken } from "./api";
import FileExplorer from "./FileExplorer";
import FileReader from "./FileReader";
import GhostPanel from "./GhostPanel";
import { Icon } from "./icons";

export default function App() {
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(0);
  const [hosted, setHosted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ghostBusy, setGhostBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [hint, setHint] = useState(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [sound, setSound] = useState(false);
  const ambient = useRef(null);

  function accept(result) {
    setGame(result.game);
    setSelected(result.game.stage);
    setHosted(result.hosted_available);
  }

  async function start(resume = false) {
    setError("");
    setBusy(true);
    try {
      if (resume && getToken()) {
        try {
          accept(await api("session"));
          return;
        } catch (err) {
          if (![401, 404].includes(err.status)) throw err;
        }
      }
      const result = await api("sessions", {});
      saveToken(result.token);
      accept(result);
      setNotice(null);
      setDialogue(null);
      setHint(null);
      setConfirmRestart(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    start(true);
    return () => {
      ambient.current?.close();
    };
  }, []);

  async function answer(value) {
    setBusy(true);
    setError("");
    try {
      const result = await api("answer", { stage: game.stage, answer: value });
      setGame(result.game);
      setNotice(result);
      if (result.correct) {
        setSelected(result.game.stage);
        setHint(null);
        setDialogue(null);
      }
      return result.correct;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function speak(message) {
    setGhostBusy(true);
    setError("");
    try {
      const result = await api("ghost", { message });
      setDialogue(result);
      setHint(result);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setGhostBusy(false);
    }
  }

  async function finish(choice) {
    setBusy(true);
    setError("");
    try {
      setGame((await api("ending", { choice })).game);
      setNotice(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSound() {
    if (sound) {
      await ambient.current?.close();
      ambient.current = null;
      setSound(false);
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtx();
      ambient.current = context;
      const gain = context.createGain();
      gain.gain.value = 0.025;
      gain.connect(context.destination);
      [55, 82.41].forEach((frequency) => {
        const wave = context.createOscillator();
        wave.type = "sine";
        wave.frequency.value = frequency;
        wave.connect(gain);
        wave.start();
      });
      await context.resume();
      setSound(true);
    } catch {
      setError(
        "Ambient audio is unavailable in this browser. You can still play.",
      );
    }
  }

  return (
    <div className="shell">
      <header className="masthead">
        <h1>The Last Process</h1>
        <p>
          An abandoned desktop.
          <br />
          One process still running.
        </p>
        <button
          className="secondary restart"
          onClick={() => setConfirmRestart(true)}
          disabled={busy || ghostBusy}
        >
          <Icon name="restart" /> Restart
        </button>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {confirmRestart && (
        <div className="restart-confirm" role="alert">
          <p>
            Start a new recovery? Your current progress will be replaced on this
            device.
          </p>
          <button className="primary" onClick={() => start()} disabled={busy}>
            Start again
          </button>
          <button
            className="secondary"
            onClick={() => setConfirmRestart(false)}
          >
            Keep playing
          </button>
        </div>
      )}
      {game ? (
        <main className="desktop">
          <FileExplorer
            game={game}
            selected={selected}
            onSelect={setSelected}
          />
          <FileReader
            game={game}
            selected={selected}
            busy={busy || ghostBusy}
            onAnswer={answer}
            onFinish={finish}
            notice={notice}
          />
          <GhostPanel
            game={game}
            hosted={hosted}
            busy={ghostBusy || busy}
            onSpeak={speak}
            dialogue={dialogue}
            hint={hint}
          />
        </main>
      ) : (
        <main className="loading">
          <p>
            {busy ? "Reopening the archive…" : "The archive is not responding."}
          </p>
          {!busy && (
            <button className="primary" onClick={() => start(true)}>
              Try again
            </button>
          )}
        </main>
      )}
      <footer>
        <div className="recovery">
          Recovery <span>{game?.stage || 0} / 3</span>
          <div
            className="progress"
            aria-label={`${game?.stage || 0} of 3 puzzles recovered`}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < (game?.stage || 0) ? "done" : ""} />
            ))}
          </div>
        </div>
        <div className="footer-line" />
        <button
          className="sound-control"
          onClick={toggleSound}
          aria-pressed={sound}
        >
          <Icon name={sound ? "sound" : "mute"} /> Sound {sound ? "on" : "off"}
        </button>
        <span className="fiction-note">
          Fictional system. No real commands executed.
        </span>
      </footer>
    </div>
  );
}
