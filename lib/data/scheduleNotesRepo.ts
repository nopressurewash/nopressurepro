"use client";

import { supabaseClient } from "../supabaseClient";
import type { CalendarDayNotesMap } from "../types";

export const DAY_NOTES_KEY = "npp_day_notes_v1";

const SCHEDULE_NOTES_COLUMNS = `
  date_key,
  note,
  updated_at
`;

function mapRowsToNotes(rows: Record<string, unknown>[]): CalendarDayNotesMap {
  return rows.reduce<CalendarDayNotesMap>((acc, row) => {
    const dateKey = String(row.date_key ?? "");
    if (!dateKey) return acc;
    acc[dateKey] = {
      note: String(row.note ?? ""),
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
    return acc;
  }, {});
}

export async function getScheduleNotes(
  businessId: string,
): Promise<CalendarDayNotesMap | null> {
  if (!businessId) return null;

  const { data, error } = await supabaseClient
    .from("schedule_notes")
    .select(SCHEDULE_NOTES_COLUMNS)
    .eq("business_id", businessId);

  if (error) {
    console.error("Supabase schedule notes fetch failed", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return mapRowsToNotes(data);
}

export async function saveScheduleNote(
  businessId: string,
  dateKey: string,
  note: string,
  updatedAt: string,
): Promise<void> {
  if (!businessId || !dateKey) return;

  const payload = {
    business_id: businessId,
    date_key: dateKey,
    note,
    updated_at: updatedAt,
  };

  const { error } = await supabaseClient
    .from("schedule_notes")
    .upsert(payload, { onConflict: "business_id,date_key" });

  if (error) {
    console.error("Supabase schedule note save failed", error);
    throw error;
  }
}

export async function deleteScheduleNote(
  businessId: string,
  dateKey: string,
): Promise<void> {
  if (!businessId || !dateKey) return;

  const { error } = await supabaseClient
    .from("schedule_notes")
    .delete()
    .eq("business_id", businessId)
    .eq("date_key", dateKey);

  if (error) {
    console.error("Supabase schedule note delete failed", error);
    throw error;
  }
}

export async function importLocalScheduleNotesIfMissing(
  businessId: string,
  localNotes: CalendarDayNotesMap,
): Promise<void> {
  if (!businessId) return;
  if (!localNotes || Object.keys(localNotes).length === 0) return;

  const existing = await getScheduleNotes(businessId);
  if (existing && Object.keys(existing).length > 0) return;

  await Promise.all(
    Object.entries(localNotes).map(async ([dateKey, noteRecord]) => {
      if (!noteRecord?.note) return;
      try {
        await saveScheduleNote(
          businessId,
          dateKey,
          noteRecord.note,
          noteRecord.updatedAt ?? new Date().toISOString(),
        );
      } catch (error) {
        console.error("Failed to import schedule note", dateKey, error);
      }
    }),
  );
}
