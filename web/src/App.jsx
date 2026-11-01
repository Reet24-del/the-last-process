import React, { useState } from "react";
import { api, getToken, saveToken } from "./api";
import FileExplorer from "./FileExplorer";
import FileReader from "./FileReader";
import GhostPanel from "./GhostPanel";
import Landing from "./Landing";
import { useHauntedAudio } from "./useHauntedAudio";
import { Icon } from "./icons";

export default function App() {
  const [entered, setEntered] = useState(false);
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(0);
  const [hosted, setHosted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ghostBusy, setGhostBusy] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [hint, setHint] = useState(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const audio = useHauntedAudio();

  function reportError(err) {
    setError(
      err.name === "TimeoutError" || err.name === "AbortError"
        ? "The archive is taking longer to wake. Please try again in a moment."
        : err.message,
    );
  }

  async function start(resume = false) {
    setError("");
    setBusy(true);
    try {
      let result;
      if (resume && getToken()) {
        try {
          result = await api("session");
        } catch (err) {
          if (![401, 404].includes(err.status)) throw err;
        }
      }
      if (!result) {
        result = await api("sessions", {});
        saveToken(result.token);
      }
      setGame(result.game);
      setSelected(result.game.stage);
      setHosted(result.hosted_available);
      setNotice(null);
      setHint(null);
      setConfirmRestart(false);
      setEntered(true);
      audio.cue("enter");
      return true;
    } catch (err) {
      reportError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function enter() {
    if (game) {
      setEntered(true);
      audio.cue("enter");
    } else start(true);
  }

  async function answer(value) {
    setBusy(true);
    setError("");
    try {
      const result = await api("answer", { stage: game.stage, answer: value });
      setGame(result.game);
      setNotice(result);
      audio.cue(result.correct ? "unlock" : "wrong");
      if (result.correct) {
        setSelected(result.game.stage);
        setHint(null);
      }
      return result.correct;
    } catch (err) {
      reportError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function speak(message) {
    setGhostBusy(true);
    setPendingMessage(message);
    setError("");
    try {
      const result = await api("ghost", { message });
      setGame((current) => ({
        ...current,
        messages: [
          ...current.messages,
          { role: "player", text: message },
          { role: "ghost", text: result.reply, source: result.source },
        ].slice(-20),
      }));
      setHint(result);
      audio.cue("hint");
      return true;
    } catch (err) {
      reportError(err);
      return false;
    } finally {
      setGhostBusy(false);
      setPendingMessage("");
    }
  }

  async function finish(choice) {
    setBusy(true);
    setError("");
    try {
      setGame((await api("ending", { choice })).game);
      setNotice(null);
      audio.cue("ending");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSound() {
    try {
      await audio.toggle();
    } catch {
      setError(
        "Sound is unavailable in this browser. The game is ready to play.",
      );
    }
  }

  if (!entered)
    return (
      <Landing
        onEnter={enter}
        busy={busy}
        error={error}
        sound={audio.enabled}
        onToggleSound={toggleSound}
      />
    );

  return (
    <div className="shell game-arrival">
      <div className="world-backdrop" aria-hidden="true" />
      <header className="masthead">
        <h1>The Last Process</h1>
        <div className="header-controls">
          <button
            className="quiet-button"
            onClick={() => {
              setEntered(false);
              setError("");
            }}
            disabled={busy || ghostBusy}
          >
            <Icon name="back" /> Back to entrance
          </button>
          <button
            className="quiet-button"
            onClick={toggleSound}
            aria-pressed={audio.enabled}
          >
            <Icon name={audio.enabled ? "sound" : "mute"} /> Sound{" "}
            {audio.enabled ? "on" : "off"}
          </button>
          <button
            className="quiet-button"
            onClick={() => setConfirmRestart(true)}
            disabled={busy || ghostBusy}
          >
            <Icon name="restart" /> Restart
          </button>
        </div>
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
      <main className="desktop">
        <FileExplorer
          game={game}
          selected={selected}
          onSelect={(index) => {
            setSelected(index);
            setNotice(null);
          }}
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
          pendingMessage={pendingMessage}
          hint={hint}
        />
      </main>
      <footer>
        <span>Fictional system. No real commands executed.</span>
        <span className="footer-rule" />
        <span>3 puzzles · 2 endings</span>
      </footer>
    </div>
  );
}
