import { useState, useRef } from "react";
import { X, Check, Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const ONBOARD_DISMISSED_KEY = "bycat-onboard-dismissed";

export const OnboardingCard = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(ONBOARD_DISMISSED_KEY) === "true";
  });

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(ONBOARD_DISMISSED_KEY, "true");
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-5 v2-fade-up relative"
        style={{ animationDelay: "0.05s" }}
      >
        <div
          className="onboard-card overflow-hidden rounded-[20px] border relative"
          style={{
            background: "var(--v2-panel)",
            borderColor: "var(--v2-line)",
            boxShadow: "var(--v2-shadow)",
          }}
        >
          {/* Dismiss button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-[30px] h-[30px] rounded-[10px] border-none flex items-center justify-center z-[2] cursor-pointer transition-colors"
            style={{
              background: "transparent",
              color: "var(--v2-mut)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--v2-panel2)";
              e.currentTarget.style.color = "var(--v2-ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--v2-mut)";
            }}
            title="Dismiss"
          >
            <X size={15} strokeWidth={2} />
          </button>

          {/* Left side - Video */}
          <div
            className="onboard-video relative"
            style={{
              background: "var(--v2-panel2)",
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              src="https://bycatassets.com/bycatdemoiosweb.mp4"
              muted
              playsInline
              loop
              preload="auto"
              onLoadedMetadata={(e) => {
                e.currentTarget.currentTime = 10;
              }}
              onSeeked={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Watch tour pill */}
            <div
              style={{
                position: "absolute",
                left: 14,
                bottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(15, 15, 18, 0.72)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                pointerEvents: "none",
                backdropFilter: "blur(4px)",
              }}
            >
              <Play size={12} fill="currentColor" strokeWidth={0} />
              {t("Watch the 1-min tour")}
            </div>
          </div>

          {/* Right side - Steps */}
          <div className="onboard-steps" style={{ padding: "22px 26px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--v2-mut)",
                }}
              >
                {t("Getting started")}
              </span>
              <span style={{ fontSize: 11, color: "var(--v2-mut)" }}>
                {t("· step 1 of 3 done")}
              </span>
            </div>
            <h2
              className="font-heading"
              style={{
                margin: "0 0 14px",
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--v2-ink)",
              }}
            >
              {t("Turn anything into a note that quizzes you back")}
            </h2>

            <div style={{ display: "grid", gap: 9 }}>
              {/* Step 1 - Done */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 13,
                  border: "1px solid var(--v2-line)",
                  background: "var(--v2-bg)",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: 9,
                    background: "var(--v2-ok)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 13.5 }}>
                    {t("Create a note")}
                  </strong>
                  <span style={{ color: "var(--v2-mut)", fontSize: 13 }}>
                    {" "}&mdash; {t("drop audio, PDFs or a YouTube link below.")}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--v2-ok)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t("Done")}
                </span>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 13,
                  border: "1px solid var(--v2-line)",
                  background: "var(--v2-panel)",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: 9,
                    background: "var(--v2-panel2)",
                    color: "var(--v2-ink)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  2
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 13.5 }}>
                    {t("Select any text")}
                  </strong>
                  <span style={{ color: "var(--v2-mut)", fontSize: 13 }}>
                    {" "}&mdash; {t("ask about it or turn it into a quiz.")}
                  </span>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11.5,
                    color: "var(--v2-mut)",
                    fontStyle: "italic",
                  }}
                >
                  {t("Open any note")}
                </span>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 13,
                  border: "1px solid var(--v2-line)",
                  background: "var(--v2-panel)",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: 9,
                    background: "var(--v2-panel2)",
                    color: "var(--v2-ink)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  3
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 13.5 }}>
                    {t("Schedule the quiz")}
                  </strong>
                  <span style={{ color: "var(--v2-mut)", fontSize: 13 }}>
                    {" "}&mdash; {t("get a push on your phone when it's time.")}
                  </span>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11.5,
                    color: "var(--v2-mut)",
                    fontStyle: "italic",
                  }}
                >
                  {t("In note settings")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .onboard-card {
            display: grid;
            grid-template-columns: minmax(280px, 38%) 1fr;
          }
          .onboard-video {
            min-height: 260px;
          }
          @media (max-width: 860px) {
            .onboard-card {
              grid-template-columns: 1fr !important;
            }
            .onboard-video {
              min-height: 200px;
              max-height: 260px;
            }
            .onboard-steps {
              padding: 18px 20px 16px !important;
            }
          }
          @media (max-width: 480px) {
            .onboard-video {
              min-height: 160px;
              max-height: 220px;
            }
            .onboard-steps {
              padding: 16px 16px 14px !important;
            }
            .onboard-steps h2 {
              font-size: 17px !important;
            }
          }
        `}</style>
      </motion.section>
    </AnimatePresence>
  );
};
