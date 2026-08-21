interface SettingsButtonProps {
  onClick?: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <>
      <style>
        {`
          @keyframes weightedGearSpin {
            0% { transform: rotate(0deg); animation-timing-function: cubic-bezier(0.55, 0.02, 0.78, 0.3); }
            18% { transform: rotate(16deg); animation-timing-function: cubic-bezier(0.18, 0.72, 0.28, 1); }
            72% { transform: rotate(354deg); animation-timing-function: cubic-bezier(0.2, 0.75, 0.32, 1); }
            89% { transform: rotate(372deg); animation-timing-function: cubic-bezier(0.34, 0.02, 0.46, 1); }
            100% { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .group:hover .gear-anim, .group:focus-within .gear-anim { animation: none !important; }
            .tooltip-anim { transition: none !important; }
          }
        `}
      </style>
      <div className="group relative inline-flex items-center justify-center">
        <button
          className="w-[72px] h-[72px] max-[600px]:w-[60px] max-[600px]:h-[60px] border-0 p-0 bg-transparent cursor-pointer text-[#b9ded7] transition-transform duration-200 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f0c84e] focus-visible:outline-offset-[4px] focus-visible:rounded-full"
          type="button"
          aria-label="Settings"
          aria-describedby="settings-tooltip"
          onClick={onClick}
        >
          <svg className="w-full h-full drop-shadow-[0_4px_0_#0b151b] origin-center group-hover:animate-[weightedGearSpin_1.08s_both] group-focus-within:animate-[weightedGearSpin_1.08s_both] gear-anim" viewBox="0 0 100 100" aria-hidden="true">
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

        <div className="absolute bottom-[90px] right-0 max-[600px]:bottom-[75px] w-max max-w-[min(455px,calc(100vw-48px))] transform translate-y-[6px] scale-[0.985] p-[18px_22px_20px] max-[600px]:p-[15px_17px_18px] border-[6px] max-[600px]:border-[5px] border-[#385866] rounded-[8px] bg-[#1f3038] shadow-[0_5px_0_#14262d,inset_0_0_0_2px_rgba(8,18,23,0.55)] opacity-0 invisible pointer-events-none transition-[opacity,transform,visibility] duration-150 delay-[0s,0s,150ms] ease group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:delay-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:delay-0 z-[100] text-left after:content-[''] after:absolute after:-bottom-[17px] after:right-[26px] max-[600px]:after:right-[20px] after:w-[20px] after:h-[20px] after:bg-[#1f3038] after:border-r-[6px] after:border-b-[6px] after:border-[#385866] after:rotate-45 tooltip-anim" id="settings-tooltip" role="tooltip">
          <h2 className="relative m-[0_0_4px] text-[#f0c84e] text-[29px] max-[600px]:text-[24px] leading-[1.08] [text-shadow:0_2px_0_#1a1406] font-['Georgia','Times_New_Roman',serif] font-normal">Settings</h2>
          <p className="relative m-0 text-[26px] max-[600px]:text-[21px] leading-[1.15] text-[#fff6df] [text-shadow:0_2px_0_#131313] font-['Georgia','Times_New_Roman',serif]">Opens the game menu.</p>
          <p className="relative mt-[34px] max-[600px]:mt-[26px] m-0 text-[26px] max-[600px]:text-[21px] leading-[1.15] text-[#fff6df] [text-shadow:0_2px_0_#131313] font-['Georgia','Times_New_Roman',serif]">Change or update your graphics, audio, and gameplay preferences here.</p>
        </div>
      </div>
    </>
  );
}
