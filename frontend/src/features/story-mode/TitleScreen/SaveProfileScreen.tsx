import React, { useState } from 'react';
import styles from './SaveProfileScreen.module.css';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export interface ProfileState {
  id: number;
  playtime: string | null;
  updated: string | null;
  progress: number;
  icon: 'red' | 'green' | 'blue';
  title: string;
}

interface SaveProfileScreenProps {
  profiles: ProfileState[];
  activeSlot: number;
  onBack: () => void;
  onSelectProfile: (profileId: number) => void;
  onDeleteProfile: (profileId: number) => void;
}

export function SaveProfileScreen({ profiles, activeSlot, onBack, onSelectProfile, onDeleteProfile }: SaveProfileScreenProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(activeSlot);
  const [profileToDelete, setProfileToDelete] = useState<number | null>(null);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileToDelete(id);
  };

  const confirmDelete = () => {
    if (profileToDelete !== null) {
      onDeleteProfile(profileToDelete);
      if (selectedSlot === profileToDelete) {
        setSelectedSlot(null);
      }
      setProfileToDelete(null);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedSlot(id);
    onSelectProfile(id);
  };

  return (
    <div className={styles.screenContainer}>
      <main className={styles.screen}>
        <h1 className={styles.title}>Choose a save profile to play!</h1>

        <section className={styles.profiles} aria-label="Save profiles">
          {profiles.map((profile) => {
            const isEmpty = profile.playtime === null;
            const isSelected = selectedSlot === profile.id;

            return (
              <div className={styles.slot} key={profile.id}>
                {isSelected && <div className={styles.pointer} aria-hidden="true"></div>}

                <article
                  className={styles.card}
                  tabIndex={0}
                  onClick={() => handleSelect(profile.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(profile.id);
                    }
                  }}
                >
                  <i className={`${styles.edgeChip} ${styles.edgeChipA}`}></i>
                  <i className={`${styles.edgeChip} ${styles.edgeChipB}`}></i>
                  <i className={`${styles.edgeChip} ${styles.edgeChipC}`}></i>
                  <i className={`${styles.edgeChip} ${styles.edgeChipD}`}></i>

                  <div className={styles.header}>
                    <div
                      className={`${styles.profileIcon} ${
                        profile.icon === 'red'
                          ? styles.profileIconRed
                          : profile.icon === 'green'
                          ? styles.profileIconGreen
                          : styles.profileIconBlue
                      }`}
                      aria-hidden="true"
                    >
                      {/* Profile Icon Image */}
                      {profile.icon === 'red' && (
                        <img src="/save-red.jpg" alt="Red Knight" className="w-full h-full object-cover" />
                      )}
                      {profile.icon === 'green' && (
                        <img src="/save-green.jpg" alt="Green Pawn" className="w-full h-full object-cover" style={{ transform: 'scale(1.18)' }} />
                      )}
                      {profile.icon === 'blue' && (
                        <img src="/save-blue.jpg" alt="Blue Rook" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className={styles.profileTitle}>{profile.title}</div>
                  </div>

                  <div className={styles.content}>
                    {!isEmpty ? (
                      <div className={styles.profileText}>
                        <div className={styles.stat}>
                          <span className={styles.label}>Progress</span>
                          <span className={styles.value}>{profile.progress}%</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.label}>Playtime</span>
                          <span className={styles.value}>{profile.playtime || '00:00'}</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.label}>Updated</span>
                          <span className={styles.value}>{profile.updated || 'Never'}</span>
                        </div>
                      </div>
                    ) : (
                      <span className={styles.empty}>Empty</span>
                    )}
                  </div>
                </article>

                {!isEmpty && (
                  <button
                    className={styles.delete}
                    aria-label={`Delete ${profile.title}`}
                    onClick={(e) => handleDelete(profile.id, e)}
                  >
                    <svg viewBox="0 0 32 32">
                      <path d="M7 9h18M12 9V6h8v3M10 12l1 15h10l1-15M14 14v9M18 14v9" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </section>

        <button className={styles.back} aria-label="Back" onClick={onBack}>
          <span className={styles.backShape}></span>
          <svg className={styles.backIcon} viewBox="0 0 80 80" aria-hidden="true">
            <path d="M10 39 39 14v15c20 1 30 12 32 34-8-10-18-15-32-14v16L10 39z" />
          </svg>
        </button>
      </main>

      <ConfirmDeleteModal 
        open={profileToDelete !== null} 
        onCancel={() => setProfileToDelete(null)} 
        onConfirm={confirmDelete} 
      />
    </div>
  );
}
