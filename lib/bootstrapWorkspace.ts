import { supabaseClient } from "./supabaseClient";

export async function bootstrapWorkspace(userId: string, email: string | null) {
  if (!userId) {
    throw new Error("Missing Supabase user ID.");
  }

  const profileResult = await supabaseClient
    .from("profiles")
    .select("id, email")
    .eq("id", userId)
    .single();

  if (profileResult.error && profileResult.status !== 406) {
    throw profileResult.error;
  }

  if (!profileResult.data) {
    const insertResult = await supabaseClient
      .from("profiles")
      .insert({ id: userId, email: email ?? "" });

    if (insertResult.error) {
      throw insertResult.error;
    }
  } else if (email && profileResult.data.email !== email) {
    const updateResult = await supabaseClient
      .from("profiles")
      .update({ email })
      .eq("id", userId);

    if (updateResult.error) {
      throw updateResult.error;
    }
  }

  const businessResult = await supabaseClient
    .from("businesses")
    .select("id")
    .eq("owner_profile_id", userId)
    .single();

  let businessId = businessResult.data?.id;

  if (!businessId) {
    const membershipResult = await supabaseClient
      .from("business_members")
      .select("business_id")
      .eq("profile_id", userId)
      .single();

    businessId = membershipResult.data?.business_id ?? null;
  }

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
