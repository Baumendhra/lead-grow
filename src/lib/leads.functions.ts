import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  minRating: z.number().min(0).max(5).optional(),
  minReviews: z.number().min(0).optional(),
  websiteFilter: z.enum(["any", "has", "missing"]).optional(),
});

export type LeadResult = {
  place_id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
};

export const searchPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    
    // Fallback: If no API keys are provided, return mock dummy leads
    if (!apiKey || !lovableKey) {
      console.warn("Google Maps connector not linked. Returning mock dummy leads.");
      const mockResults: LeadResult[] = [
        {
          place_id: `mock_place_1_${Date.now()}`,
          name: `${data.query || "Local"} Business Mock`,
          address: "123 Mock Street, Fake City, 12345",
          phone: "+1234567890",
          website: "https://example.com/mock",
          rating: 4.8,
          user_ratings_total: 120,
          category: "Mock Industry",
          latitude: 40.7128,
          longitude: -74.0060,
          google_maps_url: "https://maps.google.com/?cid=123",
        },
        {
          place_id: `mock_place_2_${Date.now()}`,
          name: `Sample ${data.query || "Agency"} Demo`,
          address: "456 Demo Ave, Test Town, 67890",
          phone: "+1987654321",
          rating: 3.9,
          user_ratings_total: 45,
          category: "Demo Service",
          latitude: 34.0522,
          longitude: -118.2437,
          google_maps_url: "https://maps.google.com/?cid=456",
        },
        {
          place_id: `mock_place_3_${Date.now()}`,
          name: `Testing ${data.query || "Store"} Location`,
          address: "789 Test Blvd, QA City, 99999",
          website: "https://test.com",
          rating: 4.2,
          user_ratings_total: 8,
          category: "Test Location",
          latitude: 41.8781,
          longitude: -87.6298,
          google_maps_url: "https://maps.google.com/?cid=789",
        }
      ];
      
      let filtered = mockResults;
      if (data.minRating != null) filtered = filtered.filter((r) => (r.rating ?? 0) >= data.minRating!);
      if (data.minReviews != null) filtered = filtered.filter((r) => (r.user_ratings_total ?? 0) >= data.minReviews!);
      if (data.websiteFilter === "has") filtered = filtered.filter((r) => !!r.website);
      if (data.websiteFilter === "missing") filtered = filtered.filter((r) => !r.website);
      return { results: filtered };
    }

    const textQuery = data.location ? `${data.query} in ${data.location}` : data.query;
    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": apiKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryType,places.location,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery, maxResultCount: 20 }),
    });
    if (!res.ok) throw new Error(`Maps API error ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { places?: any[] };
    let results: LeadResult[] = (json.places ?? []).map((p) => ({
      place_id: p.id,
      name: p.displayName?.text ?? "Unknown",
      address: p.formattedAddress ?? "",
      phone: p.internationalPhoneNumber,
      website: p.websiteUri,
      rating: p.rating,
      user_ratings_total: p.userRatingCount,
      category: p.primaryType,
      latitude: p.location?.latitude,
      longitude: p.location?.longitude,
      google_maps_url: p.googleMapsUri,
    }));
    if (data.minRating != null) results = results.filter((r) => (r.rating ?? 0) >= data.minRating!);
    if (data.minReviews != null) results = results.filter((r) => (r.user_ratings_total ?? 0) >= data.minReviews!);
    if (data.websiteFilter === "has") results = results.filter((r) => !!r.website);
    if (data.websiteFilter === "missing") results = results.filter((r) => !r.website);
    return { results };
  });
