import React from "react";
import { Icon } from "./icons";

export default function FileExplorer({ game, selected, onSelect }) {
  return (
    <nav className="files" aria-label="Recovered files">
      <h2>Recovered files</h2>
      <div className="file-list">
        {game.files.map((file, index) => (
          <button
            key={file.name}
            className={`file-row ${selected === index ? "selected" : ""}`}
            disabled={!file.unlocked}
            aria-current={selected === index ? "page" : undefined}
            onClick={() => onSelect(index)}
          >
            <Icon name={file.unlocked ? "file" : "lock"} />
            <span>{file.name}</span>
            {index < game.stage && <Icon name="check" className="file-check" />}
          </button>
        ))}
        {game.stage === 3 && (
          <button
            className={`file-row ${selected === 3 ? "selected" : ""}`}
            onClick={() => onSelect(3)}
            aria-current={selected === 3 ? "page" : undefined}
          >
            <Icon name="file" />
            <span>goodbye.txt</span>
          </button>
        )}
      </div>
      <p className="explorer-note">
        Nothing here is quite
        <br />
        as you left it.
      </p>
      <div className="archive-progress">
        <span>Recovery {game.stage} / 3</span>
        <div
          className="progress"
          aria-label={`${game.stage} of 3 puzzles recovered`}
        >
          {[0, 1, 2].map((index) => (
            <span key={index} className={index < game.stage ? "done" : ""} />
          ))}
        </div>
      </div>
    </nav>
  );
}
