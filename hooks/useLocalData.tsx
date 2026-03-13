"use client";

import { useEffect, useState, useCallback } from "react";
import type { Client, Invoice, InvoiceStatus, Quote, Rates, QuoteStatus } from "../lib/types";
import { DEFAULT_RATES } from "../lib/pricing/defaultRates";
import { RATES_KEY, normalizeRates } from "../lib/pricing/pricingStorage";
import { normalizeQuoteStatus } from "../lib/quoteStatus";

const QUOTES_KEY = "npp_quotes_v1";
const CLIENTS_KEY = "npp_clients_v1";
const INVOICES_KEY = "npp_invoices_v1";

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

function rebuildClients(prevClients: Client[], editedQuote: Quote): Client[] {
  const existingById = prevClients.find((c) => c.id === editedQuote.id);
  if (existingById) {
    return prevClients.map((c) =>
      c.id === editedQuote.id
        ? {
            ...c,
            name: editedQuote.clientName,
            suburb: editedQuote.suburb,
            phone: editedQuote.phone,
          }
        : c,
    );
  }
  const match = prevClients.find(
    (c) => c.phone === editedQuote.phone && c.name === editedQuote.clientName,
  );
  if (match) return prevClients;
  return prevClients;
}

function normalizeQuote(quote: Quote): Quote {
  return {
    ...quote,
    status: normalizeQuoteStatus(quote.status),
  };
}

export function useLocalData() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedQuotes = safeParse<Quote[]>(
      window.localStorage.getItem(QUOTES_KEY),
      [],
    ).map(normalizeQuote);
    const storedClients = safeParse<Client[]>(
      window.localStorage.getItem(CLIENTS_KEY),
      [],
    );
    const rawRates = safeParse<Partial<Rates> | null>(
      window.localStorage.getItem(RATES_KEY),
      null,
    );
    const storedRates = normalizeRates(rawRates ?? null);
    const storedInvoices = safeParse<Invoice[]>(
      window.localStorage.getItem(INVOICES_KEY),
      [],
    );

    setQuotes(storedQuotes);
    setClients(storedClients);
    setRates(storedRates);
    setInvoices(storedInvoices);
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

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    persist(INVOICES_KEY, invoices);
  }, [invoices, loaded]);

  const addQuote = useCallback(
    (quote: Quote) => {
      const normalized = normalizeQuote(quote);
      setQuotes((prev) => [normalized, ...prev]);
      setClients((prev) => upsertClientForQuote(prev, normalized));
    },
    [],
  );

  const updateQuote = useCallback((updated: Quote) => {
    const normalized = normalizeQuote(updated);
    setQuotes((prev) =>
      prev.map((q) => (q.id === normalized.id ? normalized : q)),
    );
    setClients((prev) => rebuildClients(prev, normalized));
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuoteStatus = useCallback(
    (id: string, status: QuoteStatus) => {
      const normalized = normalizeQuoteStatus(status);
      const now = new Date().toISOString();
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          const next: Quote = { ...q, status: normalized };
          if (normalized === "sent" && !q.sentAt) next.sentAt = now;
          if (normalized === "approved" && !q.approvedAt) next.approvedAt = now;
          return next;
        }),
      );
    },
    [],
  );

  const updateQuoteSchedule = useCallback(
    (id: string, scheduledDate: string, scheduledTime: string) => {
      const preBookingStatuses: QuoteStatus[] = ["draft", "sent", "approved", "follow_up"];
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          const status = preBookingStatuses.includes(q.status)
            ? ("booked" as QuoteStatus)
            : q.status;
          return { ...q, scheduledDate, scheduledTime, status };
        }),
      );
    },
    [],
  );

  const updateRates = useCallback((nextRates: Rates) => {
    setRates(nextRates);
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
  }, []);

  const updateInvoiceStatus = useCallback((id: string, status: InvoiceStatus) => {
    const now = new Date().toISOString();
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status, updatedAt: now } : inv,
      ),
    );
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const overwriteAll = useCallback(
    (payload: {
      quotes: Quote[];
      clients: Client[];
      rates: Partial<Rates>;
      invoices?: Invoice[];
    }) => {
      setQuotes((payload.quotes ?? []).map(normalizeQuote));
      setClients(payload.clients ?? []);
      setRates(normalizeRates(payload.rates));
      if (payload.invoices !== undefined) {
        setInvoices(payload.invoices);
      }
    },
    [],
  );

  return {
    loaded,
    quotes,
    clients,
    rates,
    invoices,
    addQuote,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
    updateQuoteSchedule,
    updateRates,
    addInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    overwriteAll,
  };
}

