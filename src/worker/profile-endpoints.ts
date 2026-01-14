import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createLocalAuthMiddleware } from "../server/auth/localAuth";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

const authMiddleware = createLocalAuthMiddleware();

const app = new Hono<{ Bindings: Env }>();

// Profile schema
const UpdateProfileSchema = z.object({
  display_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  profile_photo_url: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
});

// Get user profile
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .all();

  if (results.length === 0) {
    // Create default profile
    await c.env.DB.prepare(
      `INSERT INTO user_profiles (user_id, display_name) VALUES (?, ?)`
    )
      .bind(user!.id, user!.google_user_data?.name || "")
      .run();

    const { results: newResults } = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    )
      .bind(user!.id)
      .all();

    return c.json(newResults[0]);
  }

  return c.json(results[0]);
});

// Update user profile
app.patch("/api/profile", authMiddleware, zValidator("json", UpdateProfileSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  // Check if profile exists
  const { results: existingResults } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .all();

  const updates: string[] = [];
  const values: any[] = [];

  if (data.display_name !== undefined) {
    updates.push("display_name = ?");
    values.push(data.display_name);
  }
  if (data.bio !== undefined) {
    updates.push("bio = ?");
    values.push(data.bio);
  }
  if (data.phone !== undefined) {
    updates.push("phone = ?");
    values.push(data.phone);
  }
  if (data.address_line1 !== undefined) {
    updates.push("address_line1 = ?");
    values.push(data.address_line1);
  }
  if (data.address_line2 !== undefined) {
    updates.push("address_line2 = ?");
    values.push(data.address_line2);
  }
  if (data.city !== undefined) {
    updates.push("city = ?");
    values.push(data.city);
  }
  if (data.state !== undefined) {
    updates.push("state = ?");
    values.push(data.state);
  }
  if (data.country !== undefined) {
    updates.push("country = ?");
    values.push(data.country);
  }
  if (data.postal_code !== undefined) {
    updates.push("postal_code = ?");
    values.push(data.postal_code);
  }
  if (data.profile_photo_url !== undefined) {
    updates.push("profile_photo_url = ?");
    values.push(data.profile_photo_url);
  }
  if (data.website_url !== undefined) {
    updates.push("website_url = ?");
    values.push(data.website_url);
  }
  if (data.timezone !== undefined) {
    updates.push("timezone = ?");
    values.push(data.timezone);
  }
  if (data.date_of_birth !== undefined) {
    updates.push("date_of_birth = ?");
    values.push(data.date_of_birth);
  }
  if (data.occupation !== undefined) {
    updates.push("occupation = ?");
    values.push(data.occupation);
  }
  if (data.company !== undefined) {
    updates.push("company = ?");
    values.push(data.company);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  if (existingResults.length === 0) {
    // Create new profile
    const createValues = [user!.id];
    const createFields = ["user_id"];
    
    // Add all fields for creation with default values
    createFields.push("display_name", "bio", "phone", "address_line1", "address_line2", 
                     "city", "state", "country", "postal_code", "profile_photo_url", 
                     "website_url", "timezone", "date_of_birth", "occupation", "company");
    createValues.push(
      data.display_name || "",
      data.bio || "",
      data.phone || "",
      data.address_line1 || "",
      data.address_line2 || "",
      data.city || "",
      data.state || "",
      data.country || "",
      data.postal_code || "",
      data.profile_photo_url || "",
      data.website_url || "",
      data.timezone || "",
      data.date_of_birth || "",
      data.occupation || "",
      data.company || ""
    );

    const placeholders = createFields.map(() => "?").join(", ");
    await c.env.DB.prepare(
      `INSERT INTO user_profiles (${createFields.join(", ")}) VALUES (${placeholders})`
    )
      .bind(...createValues)
      .run();
  } else {
    // Update existing profile
    values.push(user!.id);
    await c.env.DB.prepare(
      `UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = ?`
    )
      .bind(...values)
      .run();
  }

  // Return updated profile
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .all();

  return c.json(results[0]);
});

// Upload profile photo
app.post("/api/profile/photo", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const formData = await c.req.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "File size must be less than 5MB" }, 400);
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `profile-photos/${user!.id}/${Date.now()}.${fileExtension}`;

    // Upload to R2
    await c.env.R2_BUCKET.put(filename, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate public URL (using a simple pattern for demo)
    const publicUrl = `https://your-r2-domain.com/${filename}`;

    // Update user profile with new photo URL
    await c.env.DB.prepare(
      "UPDATE user_profiles SET profile_photo_url = ?, updated_at = ? WHERE user_id = ?"
    )
      .bind(publicUrl, new Date().toISOString(), user!.id)
      .run();

    return c.json({ 
      url: publicUrl,
      message: "Photo uploaded successfully" 
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return c.json({ error: "Failed to upload photo" }, 500);
  }
});

// Get profile photo
app.get("/api/profile/photo/:filename", async (c) => {
  const filename = c.req.param("filename");
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ error: "User ID required" }, 400);
  }

  try {
    const object = await c.env.R2_BUCKET.get(`profile-photos/${userId}/${filename}`);
    
    if (!object) {
      return c.json({ error: "Photo not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");

    return c.body(object.body, { headers });
  } catch (error) {
    console.error("Error serving photo:", error);
    return c.json({ error: "Failed to serve photo" }, 500);
  }
});

export default app;
