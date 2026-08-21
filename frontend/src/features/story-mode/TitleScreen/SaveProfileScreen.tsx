import React, { useState } from 'react';
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
    <>
      <style>
        {`
          .screen-container {
            background: radial-gradient(circle at 83% 5%, rgba(136, 67, 13, 0.58), transparent 28%),
                        radial-gradient(circle at 49% 74%, rgba(39, 67, 78, 0.58), transparent 37%),
                        radial-gradient(circle at 18% 10%, rgba(27, 18, 25, 0.45), transparent 31%),
                        linear-gradient(118deg, #0b0d12 0%, #11161a 52%, #0c0e13 100%);
          }
          .screen-container::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.16) 70%, rgba(0,0,0,0.42) 100%),
                        linear-gradient(rgba(255,255,255,0.008), rgba(255,255,255,0.008));
          }
          .profile-pointer::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, #a90d15, #ff252d 47%, #a70912);
            clip-path: polygon(6% 7%, 94% 7%, 50% 100%);
          }
          .profile-pointer::after {
            content: "";
            position: absolute;
            width: 2px;
            height: 35px;
            left: 50%;
            top: 5px;
            background: rgba(255,255,255,0.17);
            transform: rotate(-14deg);
          }
          .profile-card {
            background: linear-gradient(145deg, rgba(88, 125, 139, 0.22), transparent 30%),
                        linear-gradient(35deg, rgba(9, 22, 29, 0.18), transparent 60%),
                        #294856;
          }
          .profile-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.58;
            background: linear-gradient(137deg, transparent 0 14%, rgba(6,18,24,0.65) 14.1% 14.45%, transparent 14.6%),
                        linear-gradient(48deg, transparent 0 66%, rgba(7,17,22,0.56) 66.1% 66.5%, transparent 66.7%),
                        linear-gradient(171deg, transparent 0 80%, rgba(110,143,153,0.16) 80.1% 80.5%, transparent 80.8%),
                        linear-gradient(23deg, transparent 0 88%, rgba(7,17,22,0.4) 88.1% 88.4%, transparent 88.6%),
                        radial-gradient(circle at 2% 3%, rgba(6,16,21,0.95) 0 13px, transparent 14px),
                        radial-gradient(circle at 99% 3%, rgba(6,16,21,0.95) 0 13px, transparent 14px),
                        radial-gradient(circle at 1% 99%, rgba(6,16,21,0.95) 0 14px, transparent 15px),
                        radial-gradient(circle at 99% 99%, rgba(6,16,21,0.95) 0 13px, transparent 14px);
          }
          .back-shape {
            background: linear-gradient(#d94020, #8e2116);
            clip-path: polygon(0 0, 84% 0, 72% 50%, 84% 100%, 0 100%);
            filter: drop-shadow(0 5px 0 #29100d) drop-shadow(5px 3px 4px rgba(0,0,0,0.4));
          }
        `}
      </style>
      <div className="absolute inset-0 w-full min-h-full overflow-x-hidden font-['Georgia','Times_New_Roman',serif] text-white screen-container max-[820px]:overflow-y-auto z-[60]">
        <main className="relative min-h-full p-[clamp(55px,8vh,92px)_4vw_80px] max-[820px]:pb-[130px] z-[2]">
          <h1 className="m-[0_0_clamp(68px,8vh,94px)] text-center text-[#f4ca4d] text-[clamp(28px,2.15vw,44px)] leading-none font-bold [text-shadow:0_3px_0_#181006,0_0_9px_rgba(255,190,48,0.18)]">Choose a save profile to play!</h1>

          <section className="w-[min(1280px,75vw)] max-[1100px]:w-[88vw] max-[820px]:w-[min(560px,92vw)] mx-auto grid grid-cols-3 max-[820px]:grid-cols-1 gap-[clamp(35px,3.4vw,64px)] max-[1100px]:gap-[30px] max-[820px]:gap-[58px]" aria-label="Save profiles">
            {profiles.map((profile) => {
              const isEmpty = profile.playtime === null;
              const isSelected = selectedSlot === profile.id;

              return (
                <div className="relative min-w-0" key={profile.id}>
                  {isSelected && <div className="absolute z-[5] top-[-35px] left-1/2 w-[48px] h-[52px] -translate-x-1/2 drop-shadow-[2px_4px_1px_rgba(0,0,0,0.85)] profile-pointer" aria-hidden="true"></div>}

                  <article
                    className="relative h-[clamp(435px,49vh,560px)] min-h-[435px] max-[820px]:h-[430px] border-[4px] border-[#101b21] rounded-[11px] profile-card shadow-[0_5px_0_#070c0f,0_10px_21px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(129,161,170,0.13),inset_0_0_35px_rgba(5,13,18,0.15)] overflow-hidden cursor-pointer transition-[transform,filter] duration-150 ease outline-none hover:brightness-[1.08] hover:-translate-y-[2px] focus-visible:brightness-[1.08] focus-visible:-translate-y-[2px]"
                    tabIndex={0}
                    onClick={() => handleSelect(profile.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(profile.id);
                      }
                    }}
                  >
                    <i className="absolute bg-[#1b3039] opacity-72 pointer-events-none w-[22px] h-[34px] left-[-7px] top-[75px] rotate-[16deg] z-[1]"></i>
                    <i className="absolute bg-[#1b3039] opacity-72 pointer-events-none w-[24px] h-[31px] right-[-8px] top-[115px] -rotate-[15deg] z-[1]"></i>
                    <i className="absolute bg-[#1b3039] opacity-72 pointer-events-none w-[22px] h-[30px] left-[-8px] bottom-[90px] -rotate-[18deg] z-[1]"></i>
                    <i className="absolute bg-[#1b3039] opacity-72 pointer-events-none w-[23px] h-[33px] right-[-8px] bottom-[34px] rotate-[19deg] z-[1]"></i>

                    <div className="relative h-[82px] p-[0_29px] max-[1100px]:p-[0_21px] flex items-center gap-[25px] max-[1100px]:gap-[16px] z-[2]">
                      <div
                        className="w-[44px] h-[44px] shrink-0 flex items-center justify-center [clip-path:polygon(15%_0,85%_0,100%_15%,100%_85%,85%_100%,15%_100%,0_85%,0_15%)]"
                        aria-hidden="true"
                      >
                        {profile.icon === 'red' && (
                          <img src="/save-red.jpg" alt="Red Knight" className="w-full h-full object-cover" />
                        )}
                        {profile.icon === 'green' && (
                          <img src="/save-green.jpg" alt="Green Pawn" className="w-full h-full object-cover scale-[1.18]" />
                        )}
                        {profile.icon === 'blue' && (
                          <img src="/save-blue.jpg" alt="Blue Rook" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-[#f4ca4d] text-[clamp(23px,1.55vw,32px)] font-bold whitespace-nowrap [text-shadow:0_2px_0_#14100b,0_0_5px_rgba(0,0,0,0.45)]">{profile.title}</div>
                    </div>

                    <div className="relative min-h-[calc(100%-82px)] p-[25px_22px_82px] flex flex-col items-center justify-center text-center z-[2]">
                      {!isEmpty ? (
                        <div>
                          <div className="mb-[16px]">
                            <span className="block mb-[4px] text-[#91d9ee] text-[clamp(16px,1.1vw,20px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)] font-bold">Progress</span>
                            <span className="block text-[#fff8e9] text-[clamp(15px,1.0vw,18px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)]">{profile.progress}%</span>
                          </div>
                          <div className="mb-[16px]">
                            <span className="block mb-[4px] text-[#91d9ee] text-[clamp(16px,1.1vw,20px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)] font-bold">Playtime</span>
                            <span className="block text-[#fff8e9] text-[clamp(15px,1.0vw,18px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)]">{profile.playtime || '00:00'}</span>
                          </div>
                          <div className="mb-0">
                            <span className="block mb-[4px] text-[#91d9ee] text-[clamp(16px,1.1vw,20px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)] font-bold">Updated</span>
                            <span className="block text-[#fff8e9] text-[clamp(15px,1.0vw,18px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)]">{profile.updated || 'Never'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="block text-[#fff8e9] text-[clamp(15px,1.0vw,18px)] [text-shadow:0_2px_2px_rgba(0,0,0,0.8)]">Empty</span>
                      )}
                    </div>
                  </article>

                  {!isEmpty && (
                    <button
                      className="w-[67px] h-[67px] mt-[28px] mx-auto grid place-items-center border-[3px] border-[#11171b] rounded-[11px] bg-[linear-gradient(#e8665c,#ad312d)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.15),0_5px_0_#070b0d,0_8px_10px_rgba(0,0,0,0.38)] cursor-pointer hover:brightness-110 active:translate-y-[3px] active:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.13),0_2px_0_#070b0d]"
                      aria-label={`Delete ${profile.title}`}
                      onClick={(e) => handleDelete(profile.id, e)}
                    >
                      <svg viewBox="0 0 32 32" className="w-[35px] h-[35px] fill-none stroke-[#73322e] stroke-[3.1] [stroke-linecap:round] [stroke-linejoin:round]">
                        <path d="M7 9h18M12 9V6h8v3M10 12l1 15h10l1-15M14 14v9M18 14v9" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </section>

          <button className="absolute left-[-5px] bottom-[30px] w-[127px] h-[92px] p-0 border-0 bg-transparent cursor-pointer z-[8]" aria-label="Back" onClick={onBack}>
            <span className="absolute inset-0 back-shape"></span>
            <svg className="absolute left-[3px] top-[7px] w-[76px] h-[76px] drop-shadow-[0_3px_0_#5b180e]" viewBox="0 0 80 80" aria-hidden="true">
              <path d="M10 39 39 14v15c20 1 30 12 32 34-8-10-18-15-32-14v16L10 39z" className="fill-[#fff6df] stroke-[#6e2419] stroke-[1.2]" />
            </svg>
          </button>
        </main>

        <ConfirmDeleteModal 
          open={profileToDelete !== null} 
          onCancel={() => setProfileToDelete(null)} 
          onConfirm={confirmDelete} 
        />
      </div>
    </>
  );
}
