import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSpeechRecognition
 *
 * Wraps the browser Web Speech API for Arabic (ar-EG) voice input.
 * Calls `onTranscript(text)` with each finalized speech segment so the
 * consumer can append it to whatever state variable it owns.
 *
 * @param {{ onTranscript: (text: string) => void, lang?: string }} options
 * @returns {{ isListening: boolean, isSupported: boolean, startListening: () => void, stopListening: () => void, error: string | null }}
 */
function useSpeechRecognition({ onTranscript, lang = "ar-EG" } = {}) {
  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  // Keep a stable ref to the recognition instance so we can stop it from
  // outside without stale-closure issues.
  const recognitionRef = useRef(null);

  // Keep a stable ref to the latest callback so the event handlers never
  // capture a stale closure.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (recognitionRef.current) return; // already running — prevent duplicate sessions

    setError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;       // keep listening until manually stopped
    recognition.interimResults = true;   // fire events for in-progress words too

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        }
      }
      // Append only finalized segments — avoids flickering interim text
      if (finalChunk && onTranscriptRef.current) {
        onTranscriptRef.current(finalChunk);
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" is benign (timeout) — don't surface it as an error
      if (event.error !== "no-speech") {
        setError(event.error);
      }
      // Always clean up on error
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, SpeechRecognition]);

  // Stop and clean up when the component that owns this hook unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // prevent setState on unmounted component
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, isSupported, startListening, stopListening, error };
}

export default useSpeechRecognition;
