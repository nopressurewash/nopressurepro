"use client";

import { useEffect, useState, useCallback } from "react";
import type { Client, Quote, Rates, QuoteStatus } from "../lib/types";
import { DEFAULT_RATES } from "../lib/pricing/defaultRates";
import { RATES_KEY, normalizeRates } from "../lib/pricing/pricingStorage";

const QUOTES_KEY = "npp_quotes_v1";
const CLIENTS_KEY = "npp_clients_v1";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so the UI remains usable.
  }
}

function upsertClientForQuote(prevClients: Client[], quote: Quote): Client[] {
  const existing = prevClients.find(
    (c) => c.phone === quote.phone && c.name === quote.clientName,
  );

  const value = quote.recommended;

  if (existing) {
    const updated: Client = {
      ...existing,
      totalJobs: existing.totalJobs + 1,
      totalValue: existing.totalValue + value,
    };

    return prevClients.map((c) => (c.id === existing.id ? updated : c));
  }

  const newClient: Client = {
    id: quote.id,
    name: quote.clientName,
    suburb: quote.suburb,
    phone: quote.phone,
    totalJobs: 1,
    totalValue: value,
    clientType: "Residential",
  };

  return [...prevClients, newClient];
}

export function useLocalData() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedQuotes = safeParse<Quote[]>(
      window.localStorage.getItem(QUOTES_KEY),
      [],
    );
    const storedClients = safeParse<Client[]>(
      window.localStorage.getItem(CLIENTS_KEY),
      [],
    );
    const rawRates = safeParse<Partial<Rates> | null>(
      window.localStorage.getItem(RATES_KEY),
      null,
    );
    const storedRates = normalizeRates(rawRates ?? null);

    setQuotes(storedQuotes);
    setClients(storedClients);
    setRates(storedRates);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    persist(QUOTES_KEY, quotes);
  }, [quotes, loaded]);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    persist(CLIENTS_KEY, clients);
  }, [clients, loaded]);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    persist(RATES_KEY, rates);
  }, [rates, loaded]);

  const addQuote = useCallback(
    (quote: Quote) => {
      setQuotes((prev) => [quote, ...prev]);
      setClients((prev) => upsertClientForQuote(prev, quote));
    },
    [],
  );

  const deleteQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuoteStatus = useCallback(
    (id: string, status: QuoteStatus) => {
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q)),
      );
    },
    [],
  );

  const updateRates = useCallback((nextRates: Rates) => {
    setRates(nextRates);
  }, []);

  const overwriteAll = useCallback(
    (payload: { quotes: Quote[]; clients: Client[]; rates: Rates }) => {
      setQuotes(payload.quotes ?? []);
      setClients(payload.clients ?? []);
      setRates(payload.rates ?? DEFAULT_RATES);
    },
    [],
  );

  return {
    loaded,
    quotes,
    clients,
    rates,
    addQuote,
    deleteQuote,
    updateQuoteStatus,
    updateRates,
    overwriteAll,
  };
}

