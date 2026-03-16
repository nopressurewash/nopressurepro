"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  CalendarDayNotesMap,
  Client,
  Invoice,
  InvoiceStatus,
  Quote,
  Rates,
  QuoteStatus,
} from "../lib/types";
import { useAuth } from "../components/auth/AuthProvider";
import { DEFAULT_RATES } from "../lib/pricing/defaultRates";
import { RATES_KEY, normalizeRates } from "../lib/pricing/pricingStorage";
import { normalizeQuoteStatus } from "../lib/quoteStatus";
import {
  getRates,
  importLocalRatesIfMissing,
  saveRates,
} from "../lib/data/ratesRepo";
import {
  DAY_NOTES_KEY,
  deleteScheduleNote,
  getScheduleNotes,
  importLocalScheduleNotesIfMissing,
  saveScheduleNote,
} from "../lib/data/scheduleNotesRepo";

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
      email: quote.email || existing.email,
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
    email: quote.email,
    totalJobs: 1,
    totalValue: value,
    clientType: "Residential",
  };

  return [...prevClients, newClient];
}

function recalcClientAfterDelete(
  prevClients: Client[],
  deletedQuote: Quote,
  remainingQuotes: Quote[],
): Client[] {
  const match = prevClients.find(
    (c) => c.phone === deletedQuote.phone && c.name === deletedQuote.clientName,
  );
  if (!match) return prevClients;

  const clientQuotes = remainingQuotes.filter(
    (q) => q.phone === match.phone && q.clientName === match.name,
  );

  if (clientQuotes.length === 0) {
    return prevClients.filter((c) => c.id !== match.id);
  }

  const totalJobs = clientQuotes.length;
  const totalValue = clientQuotes.reduce((sum, q) => sum + q.recommended, 0);

  return prevClients.map((c) =>
    c.id === match.id ? { ...c, totalJobs, totalValue } : c,
  );
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
  const [dayNotes, setDayNotes] = useState<CalendarDayNotesMap>({});
  const [loaded, setLoaded] = useState(false);
  const [remoteRatesLoaded, setRemoteRatesLoaded] = useState(false);
  const { businessId } = useAuth();

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
    const storedDayNotes = safeParse<CalendarDayNotesMap>(
      window.localStorage.getItem(DAY_NOTES_KEY),
      {},
    );

    setQuotes(storedQuotes);
    setClients(storedClients);
    setRates(storedRates);
    setInvoices(storedInvoices);
    setDayNotes(storedDayNotes);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!businessId) return;

    let cancelled = false;

    const loadRemoteRates = async () => {
      try {
        const remote = await getRates(businessId);
        if (!cancelled && remote) {
          setRates(remote);
          setRemoteRatesLoaded(true);
          return;
        }

        await importLocalRatesIfMissing(businessId);

        if (cancelled) return;
        const fallback = await getRates(businessId);
        if (fallback) {
          setRates(fallback);
        }
        setRemoteRatesLoaded(true);
      } catch (error) {
        console.error("Failed to load Supabase rates", error);
      }
    };

    void loadRemoteRates();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;

    let cancelled = false;

    const loadRemoteDayNotes = async () => {
      try {
        const remote = await getScheduleNotes(businessId);
        if (!cancelled && remote) {
          setDayNotes(remote);
          return;
        }

        if (typeof window === "undefined") return;
        const storedNotes = safeParse<CalendarDayNotesMap>(
          window.localStorage.getItem(DAY_NOTES_KEY),
          {},
        );

        await importLocalScheduleNotesIfMissing(businessId, storedNotes);

        if (cancelled) return;
        const fallback = await getScheduleNotes(businessId);
        if (fallback) {
          setDayNotes(fallback);
        }
      } catch (error) {
        console.error("Failed to load Supabase schedule notes", error);
      }
    };

    void loadRemoteDayNotes();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

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

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    persist(DAY_NOTES_KEY, dayNotes);
  }, [dayNotes, loaded]);

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
    setQuotes((prev) => {
      const deleted = prev.find((q) => q.id === id);
      const remaining = prev.filter((q) => q.id !== id);
      if (deleted) {
        setClients((prevClients) =>
          recalcClientAfterDelete(prevClients, deleted, remaining),
        );
      }
      return remaining;
    });
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

  const updateRates = useCallback(
    (nextRates: Rates) => {
      setRates(nextRates);
      if (!businessId) return;
      void saveRates(businessId, nextRates).catch((error) => {
        console.error("Failed to persist Supabase rates", error);
      });
    },
    [businessId],
  );

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

  const updateClient = useCallback(
    (updated: Client) => {
      setClients((prev) => {
        const old = prev.find((c) => c.id === updated.id);
        if (!old) return prev;

        const nameChanged = old.name !== updated.name;
        const phoneChanged = old.phone !== updated.phone;

        if (nameChanged || phoneChanged) {
          setQuotes((prevQuotes) =>
            prevQuotes.map((q) =>
              q.clientName === old.name && q.phone === old.phone
                ? { ...q, clientName: updated.name, phone: updated.phone }
                : q,
            ),
          );
          setInvoices((prevInvoices) =>
            prevInvoices.map((inv) =>
              inv.clientName === old.name && inv.phone === old.phone
                ? { ...inv, clientName: updated.name, phone: updated.phone }
                : inv,
            ),
          );
        }

        return prev.map((c) => (c.id === updated.id ? updated : c));
      });
    },
    [],
  );

  const saveDayNote = useCallback(
    (dateKey: string, note: string) => {
      const trimmed = note.trim();
      const updatedAt = new Date().toISOString();

      setDayNotes((prev) => {
        if (!trimmed) {
          const next = { ...prev };
          delete next[dateKey];
          return next;
        }

        return {
          ...prev,
          [dateKey]: {
            note: trimmed,
            updatedAt,
          },
        };
      });

      if (!businessId) return;

      const persistNote = async () => {
        try {
          if (!trimmed) {
            await deleteScheduleNote(businessId, dateKey);
            return;
          }
          await saveScheduleNote(businessId, dateKey, trimmed, updatedAt);
        } catch (error) {
          console.error("Failed to persist Supabase schedule note", dateKey, error);
        }
      };

      void persistNote();
    },
    [businessId],
  );

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
    dayNotes,
    addQuote,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
    updateQuoteSchedule,
    updateRates,
    updateClient,
    saveDayNote,
    addInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    overwriteAll,
  };
}

