"use client";

import { supabaseClient } from "../supabaseClient";
import type { Quote } from "../types";
import { toRemoteUuid } from "./remoteId";

const QUOTES_COLUMNS = `
  id,
  payload
`;

function parsePayload(row: Record<string, unknown>): Quote | null {
  const payload = row.payload;
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as Quote;
    } catch {
      return null;
    }
  }
  return payload as Quote;
}

export async function getQuotes(businessId: string): Promise<Quote[] | null> {
  if (!businessId) return null;

  const { data, error } = await supabaseClient
    .from("quotes")
    .select(QUOTES_COLUMNS)
    .eq("business_id", businessId);

  if (error) {
    console.error("Supabase quotes fetch failed", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data
    .map(parsePayload)
    .filter((quote): quote is Quote => quote !== null);
}

export async function saveQuote(businessId: string, quote: Quote): Promise<void> {
  if (!businessId) return;

  const payload = { ...quote };
  const { error } = await supabaseClient.from("quotes").upsert(
    {
      id: toRemoteUuid(quote.id),
      business_id: businessId,
      client_name: quote.clientName,
      suburb: quote.suburb,
      phone: quote.phone,
      email: quote.email ?? null,
      service_type: quote.serviceType,
      recommended: quote.recommended,
      status: quote.status,
      scheduled_date: quote.scheduledDate ?? null,
      scheduled_time: quote.scheduledTime ?? null,
      notes: quote.notes,
      created_at: quote.createdAt,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error(
      "Supabase quote save failed",
      error.message,
      error.details,
      error.hint,
      error.code,
    );
    throw error;
  }
}

export async function deleteQuote(
  businessId: string,
  quoteId: string,
) : Promise<boolean> {
  if (!businessId || !quoteId) return false;

  const remoteId = toRemoteUuid(quoteId);
  console.info("[quotes] delete request", { businessId, quoteId, remoteId });

  const { error } = await supabaseClient
    .from("quotes")
    .delete()
    .eq("business_id", businessId)
    .eq("id", remoteId);

  if (error) {
    console.error(
      "[quotes] Supabase quote delete failed",
      error.message,
      error.details,
      error.hint,
      error.code,
      { businessId, quoteId, remoteId },
    );
    throw error;
  }

  console.info("[quotes] delete success", { businessId, quoteId, remoteId });
  return true;
}

export async function importLocalQuotesIfMissing(
  businessId: string,
  localQuotes: Quote[],
): Promise<void> {
  if (!businessId) return;
  if (!localQuotes || localQuotes.length === 0) return;

  const remote = await getQuotes(businessId);
  if (remote && remote.length > 0) return;

  await Promise.all(
    localQuotes.map(async (quote) => {
      try {
        await saveQuote(businessId, quote);
      } catch (error) {
        console.error("Failed to import quote", quote.id, error);
      }
    }),
  );
}
