import React from "react";
import { Icon } from "./icons";
import "./landing.css";

export default function Landing({
  onEnter,
  busy,
  error,
  sound,
  onToggleSound,
}) {
  return (
    <div className="landing">
      <div className="landing-ghost" aria-hidden="true">
        <img src="/assets/resident.png" alt="" width="1086" height="1448" />
        <img
          className="ghost-echo"
          src="/assets/resident.png"
          alt=""
          width="1086"
          height="1448"
        />
      </div>
      <div className="dust" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />
      <header className="landing-header">
        <span className="wordmark">The Last Process</span>
        <button
          className="quiet-button"
          onClick={onToggleSound}
          aria-pressed={sound}
        >
          <Icon name={sound ? "sound" : "mute"} /> Sound {sound ? "on" : "off"}
        </button>
      </header>
      <main className="landing-copy">
        <h1>
          Someone left this
          <br />
          process{" "}
          <span className="haunted-word" data-text="running.">
            running.
          </span>
        </h1>
        <p>
          An abandoned desktop. Three corrupted files.
          <br />A resident who never left.
        </p>
        <button
          className="primary entrance-button"
          onClick={onEnter}
          disabled={busy}
        >
          {busy ? "Reopening the archive…" : "Reopen the desktop"}
          <Icon name="arrow" />
        </button>
        <span className="landing-details">3 puzzles · 2 endings</span>
        {error && (
          <p className="landing-error" role="alert">
            {error}
          </p>
        )}
      </main>
      <footer className="landing-footer">
        A fictional browser escape room. No real commands are executed.
      </footer>
    </div>
  );
}
