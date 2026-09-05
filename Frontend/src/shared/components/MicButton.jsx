import { Mic, MicOff } from "lucide-react";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

/**
 * MicButton
 *
 * A reusable microphone toggle button that wires the Web Speech API to any
 * text state. Drop it next to any textarea/input that manages its own value.
 *
 * Props:
 *  - value      {string}           Current textarea value (used to append transcript)
 *  - onChange   {(v: string) => void}  Called with the full new string when transcript arrives
 *  - className  {string}           Optional extra classes for layout positioning
 *  - variant    {"default"|"slate"} "default" uses brand design tokens; "slate" uses
 *                                   the slate-* palette used in CreateAmendmentAiModal
 *
 * Returns null when the browser does not support the Web Speech API.
 */
export default function MicButton({ value = "", onChange, className = "", variant = "default" }) {
  const handleTranscript = (text) => {
    // Append the new speech chunk to whatever text is already in the field,
    // adding a space separator if the field isn't empty.
    const separator = value.trim().length > 0 ? " " : "";
    onChange(value + separator + text);
  };

  const { isListening, isSupported, startListening, stopListening, error } =
    useSpeechRecognition({ onTranscript: handleTranscript });

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Build class strings based on variant so the button blends into its context
  const isDefault = variant === "default";

  const buttonClass = isDefault
    ? [
        // Base shape & transition — mirrors the send button in ChatModal
        "flex-shrink-0 flex items-center justify-center rounded-2xl w-11 h-11 ui-transition",
        // Idle state
        !isListening && "bg-appMuted hover:bg-brand/10 hover:border-brand border border-appBorder text-appSubtext hover:text-brand",
        // Recording state — use danger color + pulse
        isListening && "bg-danger/10 border border-danger text-danger animate-pulse-soft",
      ]
        .filter(Boolean)
        .join(" ")
    : [
        // Slate variant — matches CreateAmendmentAiModal's style
        "flex-shrink-0 flex items-center justify-center rounded-xl w-10 h-10 transition-all duration-200",
        !isListening && "bg-white border border-slate-200 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700",
        isListening && "bg-red-50 border border-red-300 text-red-500",
      ]
        .filter(Boolean)
        .join(" ");

  const tooltip = !isSupported 
    ? "عذراً، متصفحك لا يدعم إدخال الصوت" 
    : isListening 
      ? "أوقف الإدخال الصوتي" 
      : "ابدأ الإدخال الصوتي";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isSupported}
      className={`${buttonClass} ${className} ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-label={tooltip}
      aria-pressed={isListening}
      title={tooltip}
    >
      {isListening ? (
        <MicOff size={18} aria-hidden="true" />
      ) : (
        <Mic size={18} aria-hidden="true" />
      )}

      {/* Screenreader-only status announcement */}
      <span className="sr-only">
        {isListening ? "التعرف على الصوت نشط" : "التعرف على الصوت متوقف"}
      </span>

      {/* Subtle error indicator — a small red dot on the icon */}
      {error && (
        <span
          className="absolute top-1 end-1 h-2 w-2 rounded-full bg-danger"
          aria-label={`خطأ: ${error}`}
          title={`خطأ: ${error}`}
        />
      )}
    </button>
  );
}
