import React, { useState } from "react";
import { Icon } from "./icons";

export default function FileReader({
  game,
  selected,
  busy,
  onAnswer,
  onFinish,
  notice,
}) {
  const [answer, setAnswer] = useState("");
  const file = game.files[selected];
  const isCurrent = selected === game.stage && game.stage < 3;
  const farewell = selected === 3;
  async function submit(event) {
    event.preventDefault();
    if (await onAnswer(answer)) setAnswer("");
  }
  return (
    <section className="reader" aria-label="File contents">
      <header className="window-bar">
        <Icon name="file" />
        <span>{farewell ? "goodbye.txt" : file.name}</span>
        <span className="read-only">read only</span>
      </header>
      <div className={`document ${farewell ? "farewell" : ""}`}>
        {farewell ? (
          <>
            <span className="document-label">The last recovered file</span>
            <h2>{game.ending?.title || "You can stop waiting now."}</h2>
            <p>
              {game.ending?.text ||
                "If you find this, do not mistake a running process for a living person. Keep the story, if you want. But let the waiting end."}
            </p>
            {!game.ending && (
              <>
                <p className="signature">— Mara</p>
                <p className="ending-note">
                  Both choices close the listener. You decide what to keep.
                </p>
                <div className="ending-actions">
                  <button
                    disabled={busy}
                    onClick={() => onFinish("release")}
                    className="primary"
                  >
                    Let the process rest <Icon name="arrow" />
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onFinish("preserve")}
                    className="secondary"
                  >
                    Save her story
                  </button>
                </div>
              </>
            )}
            {game.ending && (
              <p className="completed">
                <Icon name="check" /> Recovery complete. Thank you for
                listening.
              </p>
            )}
          </>
        ) : (
          <div className="log-lines">
            {file.body.split("\n").map((line, index) => (
              <div className="log-line" key={index}>
                <span className="line-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{line || "\u00a0"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {!farewell && selected < game.stage && (
        <div className="recovered-fragment">
          <span>
            Recovered diary ·{" "}
            {game.story_source === "ultramarine-1-flash"
              ? "Ultramarine"
              : "authored"}
          </span>
          <p>{game.recovered[selected]}</p>
        </div>
      )}
      {notice && (
        <p
          className={`notice ${notice.correct ? "success" : ""}`}
          role="status"
        >
          {notice.message}
        </p>
      )}
      {isCurrent && (
        <form className="answer-form" onSubmit={submit}>
          <label htmlFor="answer">{game.puzzle.question}</label>
          <div className="input-row">
            <input
              id="answer"
              maxLength="100"
              autoComplete="off"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              required
              disabled={busy}
            />
            <button className="primary" disabled={busy || !answer.trim()}>
              {busy ? "Reading…" : "Submit"}
            </button>
          </div>
        </form>
      )}
      {!isCurrent && !farewell && (
        <p className="solved-note">
          <Icon name="check" /> File recovered. Open the next file to continue.
        </p>
      )}
    </section>
  );
}
