import styles from './PatchNotesButton.module.css';

interface PatchNotesButtonProps {
  onClick?: () => void;
}

export function PatchNotesButton({ onClick }: PatchNotesButtonProps) {
  return (
    <div className={styles.patchNotesComponent}>
      <button 
        className={styles.patchNotesButton} 
        type="button" 
        aria-label="Patch Notes" 
        aria-describedby="patch-notes-tooltip"
        onClick={onClick}
      >
        <img src="/scroll-icon.png" alt="Patch Notes" className={styles.scrollIcon} />
      </button>

      <div className={styles.tooltip} id="patch-notes-tooltip" role="tooltip">
        <h2>Patch Notes</h2>
        <p>Stay up to date.</p>
        <p>Read about the latest updates, bug fixes, and new features added to the game.</p>
      </div>
    </div>
  );
}
