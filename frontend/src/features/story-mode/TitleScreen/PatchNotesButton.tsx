interface PatchNotesButtonProps {
  onClick?: () => void;
}

export function PatchNotesButton({ onClick }: PatchNotesButtonProps) {
  return (
    <div className="group relative inline-flex items-center justify-center">
      <button 
        className="w-[72px] h-[72px] max-[600px]:w-[60px] max-[600px]:h-[60px] border-0 p-0 bg-transparent cursor-pointer text-[#b9ded7] transition-transform duration-200 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(231,182,75,0.1)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f0c84e] focus-visible:outline-offset-[4px] group-hover:bg-[rgba(0,0,0,0.4)] group-hover:border group-hover:border-[rgba(231,182,75,0.6)] group-focus-within:bg-[rgba(0,0,0,0.4)] group-focus-within:border group-focus-within:border-[rgba(231,182,75,0.6)]" 
        type="button" 
        aria-label="Patch Notes" 
        aria-describedby="patch-notes-tooltip"
        onClick={onClick}
      >
        <img src="/scroll-icon.png" alt="Patch Notes" className="w-full h-full object-contain drop-shadow-[0_4px_0_#0b151b] origin-center transition-transform duration-200 ease group-hover:scale-110 group-focus-within:scale-110" />
      </button>

      <div className="absolute bottom-[90px] right-0 max-[600px]:bottom-[75px] max-[600px]:right-[-76px] w-max max-w-[min(455px,calc(100vw-48px))] transform translate-y-[6px] scale-[0.985] p-[18px_22px_20px] max-[600px]:p-[15px_17px_18px] border-[6px] max-[600px]:border-[5px] border-[#385866] rounded-[8px] bg-[#1f3038] shadow-[0_5px_0_#14262d,inset_0_0_0_2px_rgba(8,18,23,0.55)] opacity-0 invisible pointer-events-none transition-[opacity,transform,visibility] duration-150 delay-[0s,0s,150ms] ease group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:delay-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:delay-0 z-[100] text-left after:content-[''] after:absolute after:-bottom-[17px] after:right-[26px] max-[600px]:after:right-[96px] after:w-[20px] after:h-[20px] after:bg-[#1f3038] after:border-r-[6px] after:border-b-[6px] after:border-[#385866] after:rotate-45" id="patch-notes-tooltip" role="tooltip">
        <h2 className="relative m-[0_0_4px] text-[#f0c84e] text-[29px] max-[600px]:text-[24px] leading-[1.08] [text-shadow:0_2px_0_#1a1406] font-['Georgia','Times_New_Roman',serif] font-normal">Patch Notes</h2>
        <p className="relative m-0 text-[26px] max-[600px]:text-[21px] leading-[1.15] text-[#fff6df] [text-shadow:0_2px_0_#131313] font-['Georgia','Times_New_Roman',serif]">Stay up to date.</p>
        <p className="relative mt-[14px] max-[600px]:mt-[26px] m-0 text-[22px] max-[600px]:text-[19px] leading-[1.15] text-[#cdd6da] [text-shadow:0_2px_0_#131313] font-['Georgia','Times_New_Roman',serif]">Read about the latest updates, bug fixes, and new features added to the game.</p>
      </div>
    </div>
  );
}
