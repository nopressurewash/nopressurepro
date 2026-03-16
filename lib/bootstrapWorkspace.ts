import { supabaseClient } from "./supabaseClient";

export async function bootstrapWorkspace(userId: string) {
  if (!userId) {
    throw new Error("Missing Supabase user ID.");
  }

  const profileResult = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (profileResult.error && profileResult.status !== 406) {
    throw profileResult.error;
  }

  if (!profileResult.data) {
    const insertResult = await supabaseClient
      .from("profiles")
      .insert({ id: userId, email: "" });

    if (insertResult.error) {
      throw insertResult.error;
    }
  }

  const businessResult = await supabaseClient
    .from("businesses")
    .select("id")
    .eq("owner_profile_id", userId)
    .single();

  let businessId = businessResult.data?.id;

  if (!businessId) {
    const createBusiness = await supabaseClient
      .from("businesses")
      .insert({ name: "My Business", owner_profile_id: userId })
      .select("id")
      .single<{ id: string }>();

    if (createBusiness.error || !createBusiness.data) {
      throw createBusiness.error ?? new Error("Failed to create business.");
    }

    businessId = createBusiness.data.id;
  }

  const membershipResult = await supabaseClient
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("profile_id", userId)
    .single();

  if (!membershipResult.data) {
    const memberInsert = await supabaseClient.from("business_members").insert({
      business_id: businessId,
      profile_id: userId,
      role: "owner",
    });

    if (memberInsert.error) {
      throw memberInsert.error;
    }
  }

  return { businessId };
}
