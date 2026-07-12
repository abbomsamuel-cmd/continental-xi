"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { play } from "@/lib/sound";

/**
 * Formspree form ID that delivers bug reports to the maintainer's inbox.
 * The destination email is configured in the Formspree dashboard — it is NEVER
 * exposed here, so users can't see or scrape it. Paste your form ID (the part
 * after /f/ in your Formspree endpoint, e.g. "xldabcde") to go live.
 */
const FORMSPREE_ID = "";
const configured = FORMSPREE_ID.length > 0;

type Status = "idle" | "sending" | "sent" | "error";

/**
 * "Report a Bug" — opens an in-app modal that POSTs to Formspree. Page URL,
 * device and language are attached automatically. No backend, no exposed email.
 */
export function ReportBug({ className = "" }: { className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  const close = () => { setOpen(false); play("click"); };
  const reset = () => { setStatus("idle"); setMessage(""); setEmail(""); };

  const submit = async () => {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    let context: Record<string, string> = {};
    try {
      context = {
        page: window.location.href,
        device: navigator.userAgent,
        language: document.documentElement.lang,
      };
    } catch { /* ignore */ }
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message, email, _subject: "ContinentalXI — Bug report", ...context }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); reset(); play("click"); }}
        className={`inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-gold ${className}`}
      >
        🐛 {t("common.reportBug")}
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center overflow-y-auto p-4 sm:items-center"
            style={{ background: "rgba(3, 8, 20, 0.7)" }}
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-md rounded-2xl p-6 safe-bottom"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-extrabold text-white">🐛 {t("bug.title")}</h2>
                <button onClick={close} aria-label={t("bug.close")} className="text-white/50 hover:text-white">✕</button>
              </div>

              {!configured ? (
                <p className="mt-4 text-sm text-muted">{t("bug.notConfigured")}</p>
              ) : status === "sent" ? (
                <div className="mt-4 text-center">
                  <div className="text-4xl" aria-hidden>✅</div>
                  <h3 className="mt-2 font-display text-lg font-bold text-white">{t("bug.sentTitle")}</h3>
                  <p className="mt-1 text-sm text-muted">{t("bug.sentBody")}</p>
                  <button className="btn btn-gold mt-5" onClick={close}>{t("bug.close")}</button>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-xs text-muted">{t("bug.intro")}</p>
                  <label className="mt-4 block text-[0.7rem] font-bold uppercase tracking-widest text-muted">{t("bug.what")}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder={t("bug.placeholder")}
                    className="mt-1.5 w-full resize-none rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold"
                  />
                  <label className="mt-3 block text-[0.7rem] font-bold uppercase tracking-widest text-muted">{t("bug.emailLabel")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold"
                  />
                  {status === "error" && (
                    <p className="mt-3 text-xs text-danger">{t("bug.errorTitle")} — {t("bug.errorBody")}</p>
                  )}
                  <div className="mt-5 flex justify-end gap-2.5">
                    <button className="btn btn-secondary btn-sm" onClick={close}>{t("bug.cancel")}</button>
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={submit}
                      disabled={!message.trim() || status === "sending"}
                    >
                      {status === "sending" ? t("bug.sending") : t("bug.send")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
