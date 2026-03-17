"use client";

import { supabaseClient } from "../supabaseClient";
import type { Client } from "../types";
import { toRemoteUuid } from "./remoteId";

const CLIENTS_COLUMNS = `
  id,
  name,
  suburb,
  phone,
  email,
  address,
  total_jobs,
  total_value,
  client_type
`;

function mapRowToClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    suburb: String(row.suburb ?? ""),
    phone: String(row.phone ?? ""),
    email: row.email ? String(row.email) : undefined,
    address: row.address ? String(row.address) : undefined,
    totalJobs: Number(row.total_jobs ?? 0),
    totalValue: Number(row.total_value ?? 0),
    clientType: (String(row.client_type ?? "Residential") as Client["clientType"]),
  };
}

export async function getClients(businessId: string): Promise<Client[] | null> {
  if (!businessId) return null;

  const { data, error } = await supabaseClient
    .from("clients")
    .select(CLIENTS_COLUMNS)
    .eq("business_id", businessId);

  if (error) {
    console.error("Supabase clients fetch failed", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data.map(mapRowToClient);
}

export async function saveClient(
  businessId: string,
  client: Client,
): Promise<void> {
  if (!businessId) return;

  const payload = {
    id: toRemoteUuid(client.id),
    business_id: businessId,
    name: client.name,
    suburb: client.suburb,
    phone: client.phone,
    email: client.email ?? null,
    address: client.address ?? null,
    total_jobs: client.totalJobs,
    total_value: client.totalValue,
    client_type: client.clientType ?? "Residential",
  };

  const { error } = await supabaseClient
    .from("clients")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error(
      "Supabase client save failed",
      error.message,
      error.details,
      error.hint,
      error.code,
    );
    throw error;
  }
}

export async function deleteClient(
  businessId: string,
  clientId: string,
): Promise<void> {
  if (!businessId || !clientId) return;

  const { error } = await supabaseClient
    .from("clients")
    .delete()
    .eq("business_id", businessId)
    .eq("id", toRemoteUuid(clientId));

  if (error) {
    console.error("Supabase client delete failed", error);
    throw error;
  }
}

export async function importLocalClientsIfMissing(
  businessId: string,
  localClients: Client[],
): Promise<void> {
  if (!businessId) return;
  if (!localClients || localClients.length === 0) return;

  const remote = await getClients(businessId);
  if (remote && remote.length > 0) return;

  await Promise.all(
    localClients.map(async (client) => {
      try {
        await saveClient(businessId, client);
      } catch (error) {
        console.error("Failed to import client", client.id, error);
      }
    }),
  );
}
