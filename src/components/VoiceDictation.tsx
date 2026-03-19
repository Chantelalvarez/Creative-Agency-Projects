"use client";

import { useState, useRef, useEffect } from "react";

interface VoiceDictationProps {
  onComplete: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceDictation({ onComplete, disabled = false }: VoiceDictationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [duration, setDuration] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          setTranscript(finalTranscript);
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        setTranscript(finalTranscript + interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions.");
      } else if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <div className="w-full border border-dark-border bg-dark-surface p-6 text-center">
        <p className="font-mono text-sm text-cream-muted/60 mb-2">
          Speech recognition is not supported in this browser.
        </p>
        <p className="font-mono text-[10px] text-cream-muted/40">
          Please use Chrome, Edge, or Safari for voice dictation.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Recorder control */}
      <div className="flex items-center gap-4 border border-dark-border bg-dark-surface p-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
            isRecording
              ? "bg-red-500/20 border-2 border-red-500 text-red-400"
              : "bg-dark border-2 border-cream-muted/30 text-cream-muted hover:border-cream hover:text-cream"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C6.89543 1 6 1.89543 6 3V8C6 9.10457 6.89543 10 8 10C9.10457 10 10 9.10457 10 8V3C10 1.89543 9.10457 1 8 1Z" fill="currentColor" />
              <path d="M4 7V8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 12V15M6 15H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <p className="font-mono text-sm text-cream">
            {isRecording ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Recording... {formatDuration(duration)}
              </span>
            ) : transcript ? (
              "Recording complete"
            ) : (
              "Tap to start recording"
            )}
          </p>
          <p className="font-mono text-[10px] text-cream-muted/40 mt-0.5">
            {isRecording
              ? "Speak clearly. Tap the stop button when done."
              : "Describe your creative vision, brand details, and project goals."}
          </p>
        </div>
      </div>

      {/* Transcript display */}
      {transcript && (
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="w-full resize-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream placeholder:text-cream-muted/40 focus:border-cream-muted focus:outline-none transition-colors"
          disabled={disabled || isRecording}
        />
      )}

      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}

      {transcript && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setTranscript("");
              setDuration(0);
            }}
            disabled={disabled || isRecording}
            className="font-mono text-xs text-cream-muted/50 hover:text-cream transition-colors disabled:opacity-30"
          >
            Clear & re-record
          </button>
          <button
            type="button"
            onClick={() => onComplete(transcript)}
            disabled={!transcript.trim() || disabled || isRecording}
            className="border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-cream"
          >
            Extract Brief →
          </button>
        </div>
      )}

      <p className="font-mono text-[10px] text-cream-muted/30 leading-relaxed">
        You can edit the transcribed text before submitting. Claude will extract the key project details.
      </p>
    </div>
  );
}
