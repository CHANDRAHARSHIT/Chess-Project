

type ConfirmAbandonModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmAbandonModal({
  onCancel,
  onConfirm,
}: ConfirmAbandonModalProps) {
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
        }

        .abandon-message {
          width: 82%;
          margin: auto 0;
          transform: translateY(-8%);
          text-align: center;
          font-size: clamp(20px, 3.4vw, 37px);
          line-height: 1.18;
          font-weight: 700;
          color: #f5f0e5;
          text-shadow:
            2px 3px 0 rgba(8, 20, 27, .72),
            0 0 3px rgba(0,0,0,.45);
        }

        .abandon-actions {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 82px;
          padding: 0 40px;
          box-sizing: border-box;
        }

        .abandon-button-shadow {
          width: 36%;
          min-width: 150px;
          aspect-ratio: 16 / 7;
          filter: drop-shadow(0 6px 14px rgba(0,0,0,.5));
          transition: transform .2s ease;
        }
        
        .abandon-button-shadow:hover {
          transform: translateY(-2px) scale(1.02);
        }

        .abandon-button-shadow:active {
          transform: translateY(2px) scale(0.98);
        }

        .abandon-button-border {
          width: 100%;
          height: 100%;
          padding: 4px;
          background: #112835;
          clip-path: polygon(
            5% 2%, 94% 0%, 100% 16%, 98% 88%,
            93% 100%, 7% 98%, 0% 86%, 2% 14%
          );
        }

        .abandon-button-border.no {
          background: #8b2b2b;
        }

        .abandon-button-border.yes {
          background: #3c7d14;
        }

        .abandon-button {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-family: inherit;
          font-size: clamp(20px, 4vw, 35px);
          font-weight: 700;
          letter-spacing: .02em;
          color: #fff;
          text-shadow: 1px 2px 2px rgba(0,0,0,.7);
          cursor: pointer;
          border: none;
          clip-path: polygon(
            5% 2%, 94% 0%, 100% 16%, 98% 88%,
            93% 100%, 7% 98%, 0% 86%, 2% 14%
          );
        }

        .abandon-button.no {
          background:
            repeating-linear-gradient(
              -12deg,
              rgba(255,255,255,.05) 0 3px,
              transparent 3px 8px
            ),
            linear-gradient(#c84d46, #ad3937);
        }

        .abandon-button.yes {
          background:
            repeating-linear-gradient(
              7deg,
              rgba(255,255,255,.06) 0 3px,
              transparent 3px 8px
            ),
            linear-gradient(#4b9d19, #37820e);
        }

        @media (max-width: 520px) {
          .abandon-title {
            margin-top: 38px;
          }

          .abandon-message {
            width: 88%;
          }

          .abandon-actions {
            margin-bottom: 55px;
            padding: 0 20px;
          }

          .abandon-button-shadow {
            min-width: 120px;
            height: 64px;
          }
        }
      `}</style>

      <div className="abandon-overlay" role="presentation">
        <div className="abandon-modal-shadow">
          <div className="abandon-modal-border">
            <div
              className="abandon-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="abandon-title"
            >
              <h2 id="abandon-title" className="abandon-title">
                Are you sure?
              </h2>

              <p className="abandon-message">
                Abandoning the game will result in<br />a loss.
              </p>

              <div className="abandon-actions">
                <div className="abandon-button-shadow">
                  <div className="abandon-button-border no">
                    <button
                      type="button"
                      className="abandon-button no"
                      onClick={onCancel}
                      aria-label="Cancel"
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="abandon-button-shadow">
                  <div className="abandon-button-border yes">
                    <button
                      type="button"
                      className="abandon-button yes"
                      onClick={onConfirm}
                      aria-label="Confirm abandon"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
