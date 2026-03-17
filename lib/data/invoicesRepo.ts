"use client";

import { supabaseClient } from "../supabaseClient";
import type { Invoice } from "../types";
import { toRemoteUuid } from "./remoteId";

const INVOICES_COLUMNS = `
  id,
  payload
`;

function parsePayload(row: Record<string, unknown>): Invoice | null {
  const payload = row.payload;
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as Invoice;
    } catch {
      return null;
    }
  }
  return payload as Invoice;
}

export async function getInvoices(businessId: string): Promise<Invoice[] | null> {
  if (!businessId) return null;

  const { data, error } = await supabaseClient
    .from("invoices")
    .select(INVOICES_COLUMNS)
    .eq("business_id", businessId);

  if (error) {
    console.error("Supabase invoices fetch failed", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data
    .map(parsePayload)
    .filter((invoice): invoice is Invoice => invoice !== null);
}

export async function saveInvoice(
  businessId: string,
  invoice: Invoice,
): Promise<void> {
  if (!businessId) return;

  const payload = { ...invoice };
  const { error } = await supabaseClient.from("invoices").upsert(
    {
      id: toRemoteUuid(invoice.id),
      business_id: businessId,
      quote_id: invoice.quoteId ? toRemoteUuid(invoice.quoteId) : null,
      client_name: invoice.clientName,
      suburb: invoice.suburb,
      phone: invoice.phone,
      service_type: invoice.serviceType,
      amount: invoice.amount,
      status: invoice.status,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      notes: invoice.notes ?? null,
      created_at: invoice.createdAt,
      payload,
      updated_at: invoice.updatedAt ?? new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error(
      "Supabase invoice save failed",
      error.message,
      error.details,
      error.hint,
      error.code,
    );
    throw error;
  }
}

export async function deleteInvoice(
  businessId: string,
  invoiceId: string,
): Promise<boolean> {
  if (!businessId || !invoiceId) return false;

  const remoteId = toRemoteUuid(invoiceId);
  const { error } = await supabaseClient
    .from("invoices")
    .delete()
    .eq("business_id", businessId)
    .eq("id", remoteId);

  if (error) {
    console.error(
      "Supabase invoice delete failed",
      error.message,
      error.details,
      error.hint,
      error.code,
    );
    throw error;
  }

  return true;
}

export async function importLocalInvoicesIfMissing(
  businessId: string,
  localInvoices: Invoice[],
): Promise<void> {
  if (!businessId) return;
  if (!localInvoices || localInvoices.length === 0) return;

  const remote = await getInvoices(businessId);
  if (remote && remote.length > 0) return;

  await Promise.all(
    localInvoices.map(async (invoice) => {
      try {
        await saveInvoice(businessId, invoice);
      } catch (error) {
        console.error("Failed to import invoice", invoice.id, error);
      }
    }),
  );
}
