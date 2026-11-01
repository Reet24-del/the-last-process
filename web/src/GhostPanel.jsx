import React, { useState } from "react";

export default function GhostPanel({
  game,
  hosted,
  busy,
  onSpeak,
  dialogue,
  hint,
}) {
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (await onSpeak(message.trim() || "Please give me a hint."))
      setMessage("");
  }
  return (
    <aside className="resident" aria-label="Talk to the resident">
      <h2>The resident</h2>
      <div className={`portrait ${busy ? "listening" : ""}`}>
        <img
          src="/assets/resident.png"
          alt="A fictional ghostly face emerging from photographic grain"
        />
      </div>
      <div className="dialogue" aria-live="polite">
        <p>
          {dialogue?.reply ||
            (game.stage === 3
              ? "You found the words I could not say. You can close the listener now."
              : "You weren’t supposed to reopen this.")}
        </p>
        <span className="source">
          {dialogue?.source?.startsWith("gemma")
            ? "Gemma · live dialogue"
            : dialogue?.source
              ? "Authored fallback · AI unavailable"
              : hosted
                ? "Gemma connected · ask to begin"
                : "Authored mode · no AI key configured"}
        </span>
      </div>
      {hint && (
        <div className="hint" role="status">
          <span>Recovered hint · {hint.level}/3</span>
          <p>{hint.hint}</p>
        </div>
      )}
      {game.stage < 3 && (
        <form className="ghost-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="ghost-message">
            Ask the ghost for a hint
          </label>
          <div className="input-row">
            <input
              id="ghost-message"
              maxLength="500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask the ghost…"
              disabled={busy}
            />
            <button className="secondary" disabled={busy}>
              {busy ? "…" : "Send"}
            </button>
          </div>
          <button type="submit" className="text-button" disabled={busy}>
            I’m stuck. Give me a hint.
          </button>
        </form>
      )}
      <p className="privacy-note">
        Asking sends your message and this fictional clue to Google when Gemma
        is connected. Don’t enter personal information.
      </p>
    </aside>
  );
}
