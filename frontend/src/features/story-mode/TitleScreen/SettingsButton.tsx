import styles from './SettingsButton.module.css';

interface SettingsButtonProps {
  onClick?: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <div className={styles.settingsComponent}>
      <button
        className={styles.settingsButton}
        type="button"
        aria-label="Settings"
        aria-describedby="settings-tooltip"
        onClick={onClick}
      >
        <svg className={styles.gear} viewBox="0 0 100 100" aria-hidden="true">
          <g fill="currentColor" stroke="#122630" strokeWidth="5" strokeLinejoin="round">
            <path d="
              M43 5
              H57
              L60 18
              A34 34 0 0 1 68 21
              L79 13
              L89 23
              L81 34
              A34 34 0 0 1 84 42
              L97 45
              V59
              L84 62
              A34 34 0 0 1 81 70
              L89 81
              L79 91
              L68 83
              A34 34 0 0 1 60 86
              L57 99
              H43
              L40 86
              A34 34 0 0 1 32 83
              L21 91
              L11 81
              L19 70
              A34 34 0 0 1 16 62
              L3 59
              V45
              L16 42
              A34 34 0 0 1 19 34
              L11 23
              L21 13
              L32 21
              A34 34 0 0 1 40 18
              Z
            "/>
          </g>
          <circle cx="50" cy="52" r="13" fill="#17303d" stroke="#122630" strokeWidth="5" />
        </svg>
      </button>

      <div className={styles.tooltip} id="settings-tooltip" role="tooltip">
        <h2>Settings</h2>
        <p>Opens the game menu.</p>
        <p>Change or update your graphics, audio, and gameplay preferences here.</p>
      </div>
    </div>
  );
}
