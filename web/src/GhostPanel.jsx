import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

function ChatMessage({ role, text, source, opening = false }) {
  const player = role === "player";
  return (
    <div
      className={`chat-message ${player ? "player-message" : "resident-message"}`}
    >
      {!player && (
        <img className="chat-avatar" src="/assets/resident.png" alt="" />
      )}
      <div className="message-content">
        <span className="speaker">
          {player ? "You" : "The resident"}
          {!player && (
            <small>
              {opening
                ? "Opening message"
                : source?.startsWith("gemma")
                  ? "Gemma · live dialogue"
                  : "Authored fallback · AI unavailable"}
            </small>
          )}
        </span>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function GhostPanel({
  game,
  hosted,
  busy,
  onSpeak,
  pendingMessage,
  hint,
}) {
  const [message, setMessage] = useState("");
  const thread = useRef(null);
  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [game.messages.length, pendingMessage]);
  async function send(event, directHint = false) {
    event.preventDefault();
    const value = directHint ? "Please give me a hint." : message.trim();
    if (!value || busy) return;
    if (await onSpeak(value)) setMessage("");
  }
  return (
    <aside className="resident" aria-label="Talk to the resident">
      <header className="chat-header">
        <h2>Game Chat</h2>
        <span
          className={`connection-dot ${hosted ? "connected" : ""}`}
          title={hosted ? "Hosted Gemma configured" : "Authored mode"}
        />
      </header>
      <div
        className="chat-thread"
        ref={thread}
        role="log"
        aria-label="Conversation with the resident"
        aria-live="polite"
        aria-relevant="additions"
      >
        <ChatMessage
          role="ghost"
          text="You weren’t supposed to reopen this."
          opening
        />
        {game.messages.map((item, index) => (
          <ChatMessage key={index} {...item} />
        ))}
        {pendingMessage && (
          <>
            <ChatMessage role="player" text={pendingMessage} />
            <p className="listening" role="status">
              The resident is listening<span className="listening-dots">…</span>
            </p>
          </>
        )}
        {game.stage === 3 && (
          <p className="archive-complete">
            The last letter is recovered. Choose how to close the archive.
          </p>
        )}
      </div>
      {hint && (
        <div className="hint" role="status">
          <Icon name="file" />
          <div>
            <span>Recovered hint · {hint.level}/3</span>
            <p>{hint.hint}</p>
          </div>
        </div>
      )}
      {game.stage < 3 && (
        <form className="ghost-form" onSubmit={send}>
          <label className="sr-only" htmlFor="ghost-message">
            Speak to the resident
          </label>
          <div className="input-row">
            <input
              id="ghost-message"
              value={message}
              maxLength="500"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Speak to the resident…"
              disabled={busy}
              autoComplete="off"
            />
            <button className="send-button" disabled={busy || !message.trim()}>
              Send
            </button>
          </div>
          <div className="chat-utilities">
            <span>
              {hosted
                ? "Messages and fictional clues are sent to Google."
                : "Authored mode · no AI key configured"}
            </span>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={(event) => send(event, true)}
            >
              Reveal a hint
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
