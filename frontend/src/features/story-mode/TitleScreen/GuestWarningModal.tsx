
type GuestWarningModalProps = {
  open?: boolean;
  onCancel?: () => void;
  onContinueGuest?: () => void;
  onSignIn?: () => void;
};

export function GuestWarningModal({
  open = true,
  onCancel,
  onContinueGuest,
  onSignIn,
}: GuestWarningModalProps) {
  if (!open) return null;

  return (
    <>
      <style>{`
        .abandon-overlay {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.58);
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        }

        .abandon-modal-shadow {
          filter: drop-shadow(0 18px 30px rgba(0,0,0,.55));
        }

        .abandon-modal-border {
          position: relative;
          width: min(683px, 92vw);
          aspect-ratio: 683 / 770;
          padding: 5px;
          background: #142934;
          clip-path: polygon(
            3% 1%, 15% 0%, 25% 1%, 38% 0%, 55% 1%, 70% 0%, 89% 2%,
            97% 7%, 99% 18%, 98% 31%, 100% 45%, 98% 57%, 100% 72%,
            98% 84%, 99% 94%, 91% 99%, 75% 98%, 64% 100%, 50% 98%,
            38% 100%, 27% 98%, 16% 100%, 5% 96%, 2% 87%, 3% 75%,
            1% 64%, 2% 51%, 0% 38%, 2% 25%, 1% 12%
          );
        }

        .abandon-modal {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          color: #f8f2e6;
          font-family: Georgia, "Times New Roman", serif;

          /* Stone/parchment-like dark fantasy surface */
          background:
            radial-gradient(circle at 20% 18%, rgba(105, 130, 145, .12), transparent 24%),
            radial-gradient(circle at 82% 72%, rgba(7, 25, 36, .32), transparent 28%),
            repeating-linear-gradient(
              8deg,
              rgba(255,255,255,.018) 0px,
              rgba(255,255,255,.018) 2px,
              transparent 2px,
              transparent 7px
            ),
            #263b47;

          clip-path: polygon(
            3% 1%, 15% 0%, 25% 1%, 38% 0%, 55% 1%, 70% 0%, 89% 2%,
            97% 7%, 99% 18%, 98% 31%, 100% 45%, 98% 57%, 100% 72%,
            98% 84%, 99% 94%, 91% 99%, 75% 98%, 64% 100%, 50% 98%,
            38% 100%, 27% 98%, 16% 100%, 5% 96%, 2% 87%, 3% 75%,
            1% 64%, 2% 51%, 0% 38%, 2% 25%, 1% 12%
          );
        }

        .abandon-modal::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          opacity: .18;
          background:
            radial-gradient(circle at 12% 12%, #9ab0b9 0 1px, transparent 2px),
            radial-gradient(circle at 71% 25%, #102630 0 1px, transparent 2px),
            radial-gradient(circle at 32% 80%, #8ca0aa 0 1px, transparent 2px);
          background-size: 43px 37px, 59px 53px, 67px 61px;
          mix-blend-mode: overlay;
        }

        .abandon-title {
          margin: 48px 20px 0;
          font-size: clamp(28px, 5vw, 47px);
          line-height: 1;
          font-weight: 700;
          text-align: center;
          color: #f1c33d;
          text-shadow:
            0 3px 0 #5b3f08,
            2px 2px 0 #5b3f08,
            -1px 1px 0 #5b3f08,
            0 0 8px rgba(0,0,0,.25);
          letter-spacing: -0.5px;
          position: relative;
          z-index: 10;
        }

        .abandon-text {
          width: 82%;
          margin: auto 0;
          transform: translateY(-8%);
          text-align: center;
          font-size: clamp(20px, 3.4vw, 28px);
          line-height: 1.25;
          font-weight: 700;
          color: #f5f0e5;
          text-shadow:
            2px 3px 0 rgba(8, 20, 27, .72),
            0 0 3px rgba(0,0,0,.45);
          position: relative;
          z-index: 10;
        }

        .abandon-actions {
          margin-bottom: 50px;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          position: relative;
          z-index: 10;
          width: 100%;
        }

        .abandon-button-shadow {
          filter: drop-shadow(0 6px 14px rgba(0,0,0,.5));
          transition: transform .2s ease;
        }
        
        .abandon-button-shadow:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .abandon-button-shadow:active {
          transform: translateY(1px) scale(.98);
        }

        .abandon-button-border {
          position: relative;
          width: min(220px, 40vw);
          aspect-ratio: 180 / 64;
          padding: 3px;
          background: #c9af92;
          cursor: pointer;
          border: none;
          outline: none;
          display: block;
          margin: 0;

          /* Subtle gold-ish base clip */
          clip-path: polygon(
            5% 1%, 94% 0%, 99% 15%, 100% 86%,
            96% 99%, 7% 100%, 1% 83%, 0% 12%
          );
        }

        .abandon-button-border-secondary {
          background: #4a5c68;
        }

        .abandon-button {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-family: inherit;
          font-size: min(18px, 3.8vw);
          letter-spacing: .05em;
          color: #fff;
          background: #112835;
          transition: background .2s ease;

          clip-path: polygon(
            5% 1%, 94% 0%, 99% 15%, 100% 86%,
            96% 99%, 7% 100%, 1% 83%, 0% 12%
          );
        }
        
        .abandon-button-primary {
          color: #142934;
          background: #c9af92;
          font-weight: bold;
        }

        .abandon-button-primary:hover {
          background: #e3cca6;
        }

        .abandon-button-secondary:hover {
          background: #1d3a4c;
        }

        @media (max-width: 480px) {
          .abandon-title { margin-top: 30px; }
          .abandon-text { margin-top: 20px; }
          .abandon-actions { flex-direction: column; gap: 15px; margin-bottom: 30px; }
        }
      `}</style>
      
      <div className="abandon-overlay" onClick={onCancel}>
        <div 
          className="abandon-modal-shadow"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="abandon-modal-border">
            <div className="abandon-modal">
              <h2 className="abandon-title">Sign In Required</h2>
              <p className="abandon-text">
                You are currently not signed in.
                <br /><br />
                Progress is only saved for signed-in users. If you continue as a guest, your journey will be lost when you leave the game.
              </p>
              
              <div className="abandon-actions">
                <div className="abandon-button-shadow" onClick={onSignIn}>
                  <button className="abandon-button-border abandon-button-border-primary" type="button">
                    <div className="abandon-button abandon-button-primary">Sign In</div>
                  </button>
                </div>
                
                <div className="abandon-button-shadow" onClick={onContinueGuest}>
                  <button className="abandon-button-border abandon-button-border-secondary" type="button">
                    <div className="abandon-button abandon-button-secondary">Continue as Guest</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
