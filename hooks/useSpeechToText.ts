"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

function appendTranscript(existing: string, nextChunk: string): string {
  const next = nextChunk.trim();
  if (!next) return existing;
  const trimmedExisting = existing.trimEnd();
  if (!trimmedExisting) return next;
  return `${trimmedExisting}\n${next}`;
}

export function useSpeechToText(
  setValue: Dispatch<SetStateAction<string>>,
) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [speechStatus, setSpeechStatus] = useState<
    "idle" | "listening" | "stopped"
  >("idle");
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function handleVoiceInput() {
    if (speechStatus === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechMessage("Voice input is not supported in this browser.");
      setSpeechStatus("stopped");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-AU";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        if (result?.isFinal) {
          transcript += result[0]?.transcript ?? "";
        }
      }
      if (transcript.trim()) {
        setValue((prev) => appendTranscript(prev, transcript));
        setSpeechMessage(null);
      }
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setSpeechMessage(
          "Microphone access was blocked. Allow mic access to dictate notes.",
        );
      } else {
        setSpeechMessage("Voice input could not capture speech. Try again.");
      }
      setSpeechStatus("stopped");
    };

    recognition.onend = () => {
      setSpeechStatus("stopped");
    };

    setSpeechMessage(null);
    setSpeechStatus("listening");
    recognition.start();
  }

  return {
    speechStatus,
    speechMessage,
    handleVoiceInput,
  };
}
