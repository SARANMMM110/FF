import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { createLocalAuthMiddleware, generateSessionToken, getCurrentUserFromToken, SESSION_TOKEN_COOKIE_NAME, type LocalUser } from "../server/auth/localAuth.js";
import { getGoogleOAuthRedirectUrl, exchangeGoogleCodeForTokens, getGoogleUserInfo } from "../server/auth/googleOAuth.js";
import { processRecurringTasks, calculateNextOccurrence } from "./recurring-tasks.js";
import { syncTask as syncTaskToNotion } from "./lib/integrations/notion.js";

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  FRONTEND_URL?: string;
  JWT_SECRET?: string;
  SYSTEME_IO_API_KEY?: string;
  AWEBER_CLIENT_ID?: string;
  AWEBER_CLIENT_SECRET?: string;
  AWEBER_ACCESS_TOKEN?: string;
  AWEBER_ACCOUNT_ID?: string;
  AWEBER_LIST_ID?: string;
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
  NOTION_INTEGRATION_SECRET?: string;
}

interface Variables {
  user?: LocalUser;
  admin?: {
    id: number;
    username: string;
    email: string;
    is_super_admin: boolean;
  };
}

// Create local auth middleware
const authMiddleware = createLocalAuthMiddleware();

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');

  // In development, allow requests from localhost:5173 or any origin
  // In production, only allow from configured FRONTEND_URL
  if (process.env.NODE_ENV !== 'production') {
    // Development: allow localhost:5173 or any origin
    if (origin) {
      c.header('Access-Control-Allow-Origin', origin);
    } else {
      c.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
  } else {
    // Production: only allow configured frontend URL
    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    if (origin === frontendUrl) {
      c.header('Access-Control-Allow-Origin', origin);
    }
  }

  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  await next();
});

// Root route
app.get("/", (c) => {
  return c.json({
    name: "FocusFlow API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/oauth/google/redirect_url",
      profile: "/api/profile",
      users: "/api/users/me",
    },
  });
});

// Health check endpoint
app.get("/api/health", async (c) => {
  try {
    // Test database connection
    await c.env.DB.prepare("SELECT 1").all();
    return c.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// API info endpoint
app.get("/api", (c) => {
  return c.json({
    name: "FocusFlow API",
    version: "1.0.0",
    basePath: "/api",
    endpoints: {
      health: "GET /api/health",
      auth: {
        googleRedirect: "GET /api/oauth/google/redirect_url",
        session: "POST /api/sessions",
        logout: "GET /api/logout",
      },
      profile: {
        get: "GET /api/profile",
        update: "PATCH /api/profile",
        photo: "POST /api/profile/photo",
      },
      users: {
        me: "GET /api/users/me",
      },
    },
  });
});

// Profile endpoints
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

    // Add all fields for creation
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

  if (!c.env.R2_BUCKET) {
    console.error("R2_BUCKET binding is missing");
    return c.json({ error: "Server configuration error: Storage not connected" }, 500);
  }

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

    // Upload to R2 - convert File to ArrayBuffer for compatibility
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(filename, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // For demo purposes, we'll create a URL pattern that references the file
    // In production, you'd typically serve these through your domain
    const publicUrl = `/api/profile/photo/file/${filename.split('/').pop()}?userId=${user!.id}`;

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
    return c.json({
      error: "Failed to upload photo",
      details: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Get profile photo
app.get("/api/profile/photo/file/:filename", async (c) => {
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
    object.writeHttpMetadata(headers as any);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");

    return c.body(object.body as any, { headers });
  } catch (error) {
    console.error("Error serving photo:", error);
    return c.json({ error: "Failed to serve photo" }, 500);
  }
});

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "") || getCookie(c, "admin_session_token");

  if (!token) {
    return c.json({ error: "Admin authentication required" }, 401);
  }

  // Use MySQL syntax: NOW() instead of datetime('now')
  const { results } = await c.env.DB.prepare(
    `SELECT au.*, ads.expires_at 
     FROM admin_users au 
     JOIN admin_sessions ads ON au.id = ads.admin_id 
     WHERE ads.session_token = ? AND ads.expires_at > NOW()`
  ).bind(token).all();

  if (results.length === 0) {
    return c.json({ error: "Invalid or expired admin session" }, 401);
  }

  c.set("admin" as any, results[0]);
  await next();
};

// Auth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  // Check if Google OAuth is configured
  if (!c.env.GOOGLE_CALENDAR_CLIENT_ID) {
    return c.json({
      error: "Google OAuth not configured",
      message: "GOOGLE_OAUTH_CLIENT_ID or GOOGLE_CALENDAR_CLIENT_ID must be set in environment variables"
    }, 500);
  }

  const plan = c.req.query("plan"); // Check for special plan parameter

  try {
    // Construct the redirect URI - this is where Google will send the user after authentication
    // Use frontend URL for redirect - Google will redirect to frontend, which will call /api/sessions
    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL!;

    // Generate the Google OAuth URL
    let redirectUrl = getGoogleOAuthRedirectUrl(
      c.env.GOOGLE_CALENDAR_CLIENT_ID,
      redirectUri,
      plan || undefined // Pass plan as state parameter if present
    );

    return c.json({ redirectUrl });
  } catch (error: any) {
    console.error("Error getting OAuth redirect URL:", error);
    return c.json({
      error: "Failed to get OAuth redirect URL",
      message: error.message || "Failed to generate OAuth URL"
    }, 500);
  }
});

// Google OAuth callback endpoint - redirects to frontend with code
app.get("/api/oauth/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectUrl = new URL(`${frontendUrl}/auth/callback`);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    return c.redirect(redirectUrl.toString());
  }

  if (code) {
    redirectUrl.searchParams.set("code", code);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }
    return c.redirect(redirectUrl.toString());
  }

  // No code or error, redirect to home
  return c.redirect(frontendUrl);
});

app.post("/api/sessions", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.code) {
      return c.json({ error: "No authorization code provided" }, 400);
    }

    // Initialize special plan
    let specialPlan: string | null = null;

    // Check for registration code FIRST (for secure code-based links) - takes priority
    const registrationCode = body.registration_code;
    if (registrationCode) {
      console.log(`🔍 [Registration Code] Received code in request: ${registrationCode}`);

      // Validate and get plan from registration code
      const { results } = await c.env.DB.prepare(`
      SELECT plan_id, max_uses, current_uses, expires_at, is_active
      FROM registration_codes 
      WHERE code = ?
    `).bind(registrationCode).all();

      console.log(`🔍 [Registration Code] Database query returned ${results.length} results`);

      if (results.length > 0) {
        const regCode = results[0] as any;
        console.log(`🔍 [Registration Code] Found code in database:`, {
          plan_id: regCode.plan_id,
          max_uses: regCode.max_uses,
          current_uses: regCode.current_uses,
          expires_at: regCode.expires_at,
          is_active: regCode.is_active
        });

        // Validate the code
        const isValid = regCode.is_active &&
          (!regCode.expires_at || new Date(regCode.expires_at) > new Date()) &&
          (!regCode.max_uses || regCode.current_uses < regCode.max_uses);

        console.log(`🔍 [Registration Code] Code validation result: ${isValid ? 'VALID' : 'INVALID'}`);

        if (isValid) {
          specialPlan = regCode.plan_id;

          // Increment usage counter
          await c.env.DB.prepare(
            "UPDATE registration_codes SET current_uses = current_uses + 1, updated_at = ? WHERE code = ?"
          ).bind(new Date().toISOString(), registrationCode).run();

          console.log(`🎟️ [Registration Code] ✅ Valid code used: ${registrationCode} for plan: ${regCode.plan_id.toUpperCase()}`);
        } else {
          console.warn(`⚠️ [Registration Code] ❌ Invalid or expired code: ${registrationCode}`);
        }
      } else {
        console.warn(`⚠️ [Registration Code] ❌ Code not found in database: ${registrationCode}`);
      }
    } else {
      console.log(`ℹ️ [Registration Code] No registration code in request body`);
    }

    // Fall back to state parameter if no registration code (for ?plan=pro style links)
    if (!specialPlan && body.state && ["pro", "enterprise"].includes(body.state)) {
      specialPlan = body.state;
      console.log(`📋 [Simple Plan Link] Using plan from state parameter: ${body.state.toUpperCase()}`);
    }

    console.log(`📊 [Registration] Final special plan determined: ${specialPlan || 'NONE (will use free)'}`);
    console.log(`📊 [Registration] Request body:`, JSON.stringify({
      has_code: !!body.code,
      has_state: !!body.state,
      has_registration_code: !!body.registration_code
    }));

    // Exchange Google OAuth code for tokens
    if (!c.env.GOOGLE_CALENDAR_CLIENT_ID || !c.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
      console.error("❌ [OAuth] Google OAuth credentials not configured");
      return c.json({ error: "Google OAuth not configured" }, 500);
    }

    // Use frontend URL for redirect - Google will redirect to frontend, which will call /api/sessions
    // IMPORTANT: This must match EXACTLY what was used in /api/oauth/google/redirect_url
    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL!;

    console.log("🔐 [OAuth] Exchanging code for tokens:", {
      hasCode: !!body.code,
      redirectUri,
      clientId: c.env.GOOGLE_CALENDAR_CLIENT_ID?.substring(0, 20) + '...'
    });

    let googleUserInfo: any;
    try {
      const tokens = await exchangeGoogleCodeForTokens(
        body.code,
        c.env.GOOGLE_CALENDAR_CLIENT_ID,
        c.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        redirectUri
      );

      console.log("✅ [OAuth] Successfully exchanged code for tokens");

      // Get user info from Google
      googleUserInfo = await getGoogleUserInfo(tokens.access_token);
      console.log("✅ [OAuth] Successfully retrieved user info:", googleUserInfo.email);
    } catch (error: any) {
      console.error("❌ [OAuth] Error exchanging OAuth code:", error);
      console.error("❌ [OAuth] Error details:", {
        message: error.message,
        redirectUri,
        frontendUrl: c.env.FRONTEND_URL
      });
      return c.json({
        error: "Failed to authenticate with Google",
        message: error.message,
        details: "Check backend console for more details"
      }, 500);
    }

    // Create or get user from database
    const userId = `google_${googleUserInfo.id}`;
    const user = {
      id: userId,
      email: googleUserInfo.email,
      name: googleUserInfo.name,
      google_user_data: {
        sub: googleUserInfo.id,
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        picture: googleUserInfo.picture,
      },
    };

    // Generate session token
    const sessionToken = generateSessionToken(userId);

    // Cookie settings - use secure only in production
    const isProduction = process.env.NODE_ENV === 'production';
    setCookie(c, SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: isProduction ? "none" : "lax", // Use 'lax' for local development
      secure: isProduction, // Only use secure cookies in production (HTTPS)
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    if (user) {
      let userCheck: any[] = [];
      let settingsCheck: any[] = [];

      try {
        // Check if this user exists in our database
        const userResult = await c.env.DB.prepare(
          "SELECT user_id FROM users WHERE user_id = ? LIMIT 1"
        ).bind(user.id).all();
        userCheck = userResult.results || [];

        const settingsResult = await c.env.DB.prepare(
          "SELECT user_id FROM user_settings WHERE user_id = ? LIMIT 1"
        ).bind(user.id).all();
        settingsCheck = settingsResult.results || [];
      } catch (dbError: any) {
        console.error("❌ [Database] Error checking user:", dbError);
        return c.json({
          error: "Database error",
          message: dbError.message || "Failed to check user in database",
          details: "Make sure database tables exist. Run migrations if needed."
        }, 500);
      }

      let signupCheck: any[] = [];
      try {
        const signupResult = await c.env.DB.prepare(
          "SELECT email FROM email_signups WHERE email = ? LIMIT 1"
        ).bind(user.email).all();
        signupCheck = signupResult.results || [];
      } catch (dbError: any) {
        console.error("❌ [Database] Error checking email signups:", dbError);
        // Continue - this is not critical
      }

      const isNewUser = userCheck.length === 0;
      const notInWaitlist = signupCheck.length === 0;

      console.log("👤 [Auth] User sign-in:", {
        email: user.email,
        user_id: user.id,
        is_new_user: isNewUser,
        already_in_waitlist: !notInWaitlist,
        special_plan: specialPlan
      });

      // Insert or update user record
      if (isNewUser) {
        // Determine subscription plan - use special plan if provided, otherwise default to free
        const subscriptionPlan = specialPlan || 'free';

        console.log(`💾 [Database] Creating NEW user with plan: ${subscriptionPlan.toUpperCase()}`);

        try {
          await c.env.DB.prepare(
            `INSERT INTO users (user_id, email, name, google_user_id, profile_picture_url, signup_source, subscription_plan, last_login_at)
         VALUES (?, ?, ?, ?, ?, 'google-oauth', ?, ?)`
          ).bind(
            user.id,
            user.email,
            user.google_user_data?.name || null,
            user.google_user_data?.sub || null,
            user.google_user_data?.picture || null,
            subscriptionPlan,
            new Date().toISOString()
          ).run();
        } catch (dbError: any) {
          console.error("❌ [Database] Error creating user:", dbError);
          return c.json({
            error: "Database error",
            message: dbError.message || "Failed to create user in database",
            details: "Make sure database tables exist. Run 'npm run migrate' to create tables."
          }, 500);
        }

        console.log(`✅ [Database] Successfully created user record for: ${user.id} with plan: ${subscriptionPlan.toUpperCase()}`);

        // Verify the insert worked
        const { results: verifyResults } = await c.env.DB.prepare(
          "SELECT user_id, email, subscription_plan FROM users WHERE user_id = ?"
        ).bind(user.id).all();

        if (verifyResults.length > 0) {
          const savedUser = verifyResults[0] as any;
          console.log(`✅ [Database] Verification - User saved with subscription_plan: ${savedUser.subscription_plan}`);
        } else {
          console.error(`❌ [Database] ERROR: User was not found after insert!`);
        }

        // Log special registration if applicable
        if (specialPlan) {
          console.log(`🎁 [Special Registration] New user ${user.email} registered with ${specialPlan.toUpperCase()} plan via registration link`);
        }
      } else {
        console.log(`💾 [Database] User already exists: ${user.id}`);

        // Existing user - update last login
        await c.env.DB.prepare(
          "UPDATE users SET last_login_at = ?, updated_at = ? WHERE user_id = ?"
        ).bind(new Date().toISOString(), new Date().toISOString(), user.id).run();
        console.log(`💾 [Database] Updated last_login_at for: ${user.id}`);

        // If existing user has a special plan from registration code, upgrade their account
        if (specialPlan && registrationCode) {
          console.log(`🔍 [Account Upgrade] Checking if upgrade needed for existing user: ${user.email}`);

          // Get current plan
          const { results: currentUserData } = await c.env.DB.prepare(
            "SELECT subscription_plan FROM users WHERE user_id = ?"
          ).bind(user.id).all();

          const currentPlan = currentUserData.length > 0 ? (currentUserData[0] as any).subscription_plan : 'free';
          console.log(`🔍 [Account Upgrade] Current plan: ${currentPlan}, Target plan: ${specialPlan}`);

          // Only upgrade if not already on this plan or higher
          const planHierarchy: Record<string, number> = { 'free': 0, 'pro': 1, 'enterprise': 2 };
          const currentLevel = planHierarchy[currentPlan] || 0;
          const newLevel = planHierarchy[specialPlan] || 0;

          if (newLevel > currentLevel) {
            console.log(`⬆️ [Account Upgrade] Upgrading from ${currentPlan.toUpperCase()} (level ${currentLevel}) to ${specialPlan.toUpperCase()} (level ${newLevel})`);

            await c.env.DB.prepare(
              "UPDATE users SET subscription_plan = ?, updated_at = ? WHERE user_id = ?"
            ).bind(specialPlan, new Date().toISOString(), user.id).run();

            console.log(`✅ [Account Upgrade] Successfully upgraded ${user.email} from ${currentPlan.toUpperCase()} to ${specialPlan.toUpperCase()} via registration code: ${registrationCode}`);

            // Verify the upgrade
            const { results: verifyUpgrade } = await c.env.DB.prepare(
              "SELECT subscription_plan FROM users WHERE user_id = ?"
            ).bind(user.id).all();

            if (verifyUpgrade.length > 0) {
              const updatedPlan = (verifyUpgrade[0] as any).subscription_plan;
              console.log(`✅ [Account Upgrade] Verification - User now has plan: ${updatedPlan}`);
            }
          } else {
            console.log(`ℹ️ [Account Upgrade] User ${user.email} already has ${currentPlan.toUpperCase()} plan (level ${currentLevel}) which is equal or higher than ${specialPlan.toUpperCase()} (level ${newLevel})`);
          }
        } else if (specialPlan) {
          console.log(`ℹ️ [Account Upgrade] Special plan provided but no registration code - not upgrading existing user`);
        }
      }

      // Sync to CRM platforms for ANY first-time sign-up (new user OR not in waitlist yet)
      if (isNewUser || notInWaitlist) {
        const systemeKey = c.env.SYSTEME_IO_API_KEY;

        // Try Systeme.io integration
        if (systemeKey) {
          try {
            console.log("📤 [Systeme.io] Syncing user to Systeme.io:", user.email);
            await integrateWithSystemeIO(systemeKey, {
              email: user.email,
              name: user.google_user_data?.name || "",
              source: "google-oauth-registration",
              utm_data: {
                source: null,
                medium: null,
                campaign: null,
              }
            });
            console.log("✅ [Systeme.io] Sync successful:", user.email);
          } catch (error) {
            console.error("❌ [Systeme.io] Sync FAILED for:", user.email);
            console.error("❌ [Systeme.io] Error:", error instanceof Error ? error.message : String(error));
          }
        }

        // Try AWeber integration
        const { addAWeberSubscriber } = await import("./aweber.js");
        try {
          console.log("📤 [AWeber] Syncing user to AWeber:", user.email);
          const aweberResult = await addAWeberSubscriber(c.env, {
            email: user.email,
            name: user.google_user_data?.name || undefined,
            tags: ["google-oauth-registration", "focusflow-user"],
            ad_tracking: "focusflow-google-oauth",
          });

          if (aweberResult.success) {
            console.log("✅ [AWeber] Sync successful:", user.email);
          } else {
            console.warn("⚠️ [AWeber] Sync completed with issues:", aweberResult.error);
          }
        } catch (error) {
          console.error("❌ [AWeber] Sync FAILED for:", user.email);
          console.error("❌ [AWeber] Error:", error instanceof Error ? error.message : String(error));
        }

        // Record in email_signups table for tracking
        if (notInWaitlist) {
          try {
            await c.env.DB.prepare(
              `INSERT INTO email_signups (email, name, signup_source, marketing_consent, status)
             VALUES (?, ?, 'google-oauth', 1, 'active')`
            ).bind(user.email, user.google_user_data?.name || "").run();
            console.log("💾 [Database] Added to email_signups:", user.email);
          } catch (dbError) {
            console.error("❌ [Database] Failed to record signup:", dbError);
          }
        }
      } else {
        console.log("ℹ️ [CRM] User already synced, skipping:", user.email);
      }

      // Create default user settings for new users
      if (settingsCheck.length === 0) {
        try {
          await c.env.DB.prepare(
            "INSERT INTO user_settings (user_id) VALUES (?)"
          ).bind(user.id).run();
          console.log("💾 [Database] Created user_settings for:", user.id);
        } catch (error) {
          console.error("❌ [Database] Failed to create user settings:", error);
        }
      }
    }

    return c.json({ success: true }, 200);
  } catch (error: any) {
    console.error("❌ [Sessions] Unhandled error in /api/sessions:", error);
    console.error("❌ [Sessions] Error stack:", error?.stack);
    console.error("❌ [Sessions] Error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code
    });
    return c.json({
      error: "Session creation failed",
      message: error?.message || "Unknown error",
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, 500);
  }
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  // Simply clear the session cookie - no need to call external service
  const isProduction = process.env.NODE_ENV === 'production';
  setCookie(c, SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Admin Authentication endpoints
const AdminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

app.post("/api/admin/login", zValidator("json", AdminLoginSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  // Trim username to handle any accidental spaces
  const trimmedUsername = username.trim();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM admin_users WHERE username = ?"
  ).bind(trimmedUsername).all();

  if (results.length === 0) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const admin = results[0] as any;

  // For demo purposes, check if password is "admin123" or verify hash
  const isValidPassword = password === "admin123" || await bcrypt.compare(password, admin.password_hash);

  if (!isValidPassword) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // Create session
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await c.env.DB.prepare(
    "INSERT INTO admin_sessions (admin_id, session_token, expires_at) VALUES (?, ?, ?)"
  ).bind(admin.id, sessionToken, expiresAt).run();

  setCookie(c, "admin_session_token", sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return c.json({
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      is_super_admin: admin.is_super_admin
    },
    token: sessionToken
  });
});

app.post("/api/admin/logout", adminMiddleware, async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "") || getCookie(c, "admin_session_token");

  if (token) {
    await c.env.DB.prepare("DELETE FROM admin_sessions WHERE session_token = ?").bind(token).run();
  }

  setCookie(c, "admin_session_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true });
});

app.get("/api/admin/me", adminMiddleware, async (c) => {
  const admin = c.get("admin" as any);
  return c.json({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    is_super_admin: admin.is_super_admin
  });
});

// Admin Dashboard endpoints
app.get("/api/admin/stats", adminMiddleware, async (c) => {
  // Total users from users table
  const { results: userCount } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users"
  ).all();

  // Total tasks
  const { results: taskCount } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tasks"
  ).all();

  // Total focus sessions
  const { results: sessionCount } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM focus_sessions"
  ).all();

  // Total focus time
  const { results: focusTime } = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(duration_minutes), 0) as total FROM focus_sessions WHERE session_type = 'focus' AND end_time IS NOT NULL"
  ).all();

  // Active users (users with activity in last 7 days)
  // Use MySQL DATE_SUB instead of JavaScript date calculation
  const { results: activeUsers } = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) as count FROM users WHERE last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  ).all();

  return c.json({
    total_users: (userCount[0] as any).count,
    total_tasks: (taskCount[0] as any).count,
    total_sessions: (sessionCount[0] as any).count,
    total_focus_minutes: (focusTime[0] as any).total,
    active_users_7d: (activeUsers[0] as any).count,
  });
});

app.get("/api/admin/users", adminMiddleware, async (c) => {
  try {
    const pageParam = c.req.query("page");
    const limitParam = c.req.query("limit");

    let page = parseInt(pageParam || "1");
    let limit = parseInt(limitParam || "20");

    // Safety check for NaN or invalid values
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Cap limit at 100 for performance

    const offset = (page - 1) * limit;

    // Get users with their stats from users table - using subqueries to avoid JOIN issues
    const { results: users } = await c.env.DB.prepare(`
      SELECT 
        u.user_id,
        u.email,
        u.name,
        u.signup_source,
        u.subscription_plan,
        u.created_at,
        u.last_login_at,
        (SELECT COUNT(*) FROM tasks WHERE user_id = u.user_id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE user_id = u.user_id AND is_completed = 1) as completed_tasks,
        (SELECT COALESCE(SUM(duration_minutes), 0) 
         FROM focus_sessions 
         WHERE user_id = u.user_id 
           AND session_type = 'focus' 
           AND end_time IS NOT NULL 
           AND duration_minutes > 0
        ) as total_focus_minutes,
        (SELECT COUNT(*) FROM focus_sessions WHERE user_id = u.user_id AND end_time IS NOT NULL) as total_sessions,
        (SELECT MAX(start_time) FROM focus_sessions WHERE user_id = u.user_id) as last_session_time,
        u.last_login_at as last_activity
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // Get total count for pagination
    const { results: totalCount } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users"
    ).all();

    return c.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: (totalCount[0] as any)?.count || 0,
        pages: Math.ceil(((totalCount[0] as any)?.count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error("[Admin] Error fetching users:", error);
    console.error("[Admin] SQL Error:", error.sqlMessage || error.message);
    console.error("[Admin] Error Code:", error.code);
    return c.json({
      error: "Failed to fetch users",
      message: error.message,
      details: error.sqlMessage || error.code,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, 500);
  }
});

app.get("/api/admin/users/:userId", adminMiddleware, async (c) => {
  const userId = c.req.param("userId");

  // Get user tasks
  const { results: tasks } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();

  // Get user focus sessions
  const { results: sessions } = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 50"
  ).bind(userId).all();

  // Get user settings
  const { results: settings } = await c.env.DB.prepare(
    "SELECT * FROM user_settings WHERE user_id = ?"
  ).bind(userId).all();

  return c.json({
    user_id: userId,
    tasks,
    sessions,
    settings: settings[0] || null
  });
});

app.delete("/api/admin/users/:userId", adminMiddleware, async (c) => {
  const admin = c.get("admin" as any);
  if (!admin.is_super_admin) {
    return c.json({ error: "Super admin access required" }, 403);
  }

  const userId = c.req.param("userId");

  // Delete user data in order (respecting foreign key relationships)
  await c.env.DB.prepare("DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)").bind(userId).run();
  await c.env.DB.prepare("DELETE FROM focus_sessions WHERE user_id = ?").bind(userId).run();
  await c.env.DB.prepare("DELETE FROM tasks WHERE user_id = ?").bind(userId).run();
  await c.env.DB.prepare("DELETE FROM user_settings WHERE user_id = ?").bind(userId).run();
  await c.env.DB.prepare("DELETE FROM user_profiles WHERE user_id = ?").bind(userId).run();
  await c.env.DB.prepare("DELETE FROM users WHERE user_id = ?").bind(userId).run();

  return c.json({ success: true });
});

// Admin - Create task for user
const AdminCreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().optional(),
  estimated_minutes: z.number().optional(),
  project: z.string().optional(),
  due_date: z.string().optional(),
});

app.post("/api/admin/users/:userId/tasks", adminMiddleware, zValidator("json", AdminCreateTaskSchema), async (c) => {
  const userId = c.req.param("userId");
  const data = c.req.valid("json");

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (user_id, title, description, priority, estimated_minutes, project, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'todo')`
  )
    .bind(
      userId,
      data.title,
      data.description || null,
      data.priority || 0,
      data.estimated_minutes || null,
      data.project || null,
      data.due_date || null
    )
    .run();

  const { results } = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(result.meta.last_row_id)
    .all();

  return c.json(results[0], 201);
});

// Admin - Update any task
const AdminUpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "completed"]).optional(),
  priority: z.number().optional(),
  estimated_minutes: z.number().optional(),
  is_completed: z.boolean().optional(),
  project: z.string().optional(),
  due_date: z.string().optional(),
});

app.patch("/api/admin/tasks/:id", adminMiddleware, zValidator("json", AdminUpdateTaskSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push("priority = ?");
    values.push(data.priority);
  }
  if (data.estimated_minutes !== undefined) {
    updates.push("estimated_minutes = ?");
    values.push(data.estimated_minutes);
  }
  if (data.is_completed !== undefined) {
    updates.push("is_completed = ?");
    values.push(data.is_completed ? 1 : 0);
    if (data.is_completed) {
      updates.push("completed_at = ?");
      values.push(new Date().toISOString());
    } else {
      updates.push("completed_at = ?");
      values.push(null);
    }
  }
  if (data.project !== undefined) {
    updates.push("project = ?");
    values.push(data.project);
  }
  if (data.due_date !== undefined) {
    updates.push("due_date = ?");
    values.push(data.due_date);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(id);

  await c.env.DB.prepare(
    `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...values)
    .run();

  const { results } = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id)
    .all();

  return c.json(results[0]);
});

// Admin - Delete any task
app.delete("/api/admin/tasks/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");

  // Delete subtasks first
  await c.env.DB.prepare("DELETE FROM subtasks WHERE task_id = ?")
    .bind(id)
    .run();

  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ?")
    .bind(id)
    .run();

  return c.json({ success: true });
});

// Admin - Generate registration code
app.post("/api/admin/registration-codes", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const planId = body.plan_id;
  const maxUses = body.max_uses || null;
  const expiresAt = body.expires_at || null;
  const notes = body.notes || null;

  if (!planId || !["pro", "enterprise"].includes(planId)) {
    return c.json({ error: "Invalid plan_id. Must be: pro or enterprise" }, 400);
  }

  // Generate a secure random code (32 characters)
  const code = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(36))
    .join('')
    .substring(0, 32)
    .toUpperCase();

  const admin = c.get("admin" as any);

  try {
    await c.env.DB.prepare(
      `INSERT INTO registration_codes (code, plan_id, max_uses, expires_at, created_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(code, planId, maxUses, expiresAt, admin.username, notes).run();

    return c.json({
      success: true,
      code,
      plan_id: planId,
      registration_url: `${new URL(c.req.url).origin}/?code=${code}`,
      max_uses: maxUses,
      expires_at: expiresAt
    }, 201);
  } catch (error) {
    console.error("Failed to create registration code:", error);
    return c.json({ error: "Failed to create registration code" }, 500);
  }
});

// Admin - List registration codes
app.get("/api/admin/registration-codes", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM registration_codes ORDER BY created_at DESC LIMIT 100"
  ).all();

  return c.json({ codes: results });
});

// Admin - Deactivate registration code
app.delete("/api/admin/registration-codes/:code", adminMiddleware, async (c) => {
  const code = c.req.param("code");

  await c.env.DB.prepare(
    "UPDATE registration_codes SET is_active = 0, updated_at = ? WHERE code = ?"
  ).bind(new Date().toISOString(), code).run();

  return c.json({ success: true });
});



// Public - Validate registration code
app.get("/api/registration-codes/:code/validate", async (c) => {
  const code = c.req.param("code");

  const { results } = await c.env.DB.prepare(`
    SELECT code, plan_id, max_uses, current_uses, expires_at, is_active
    FROM registration_codes 
    WHERE code = ?
  `).bind(code).all();

  if (results.length === 0) {
    return c.json({ valid: false, error: "Invalid code" }, 404);
  }

  const regCode = results[0] as any;

  // Check if code is active
  if (!regCode.is_active) {
    return c.json({ valid: false, error: "Code has been deactivated" }, 400);
  }

  // Check if expired
  if (regCode.expires_at && new Date(regCode.expires_at) < new Date()) {
    return c.json({ valid: false, error: "Code has expired" }, 400);
  }

  // Check if max uses reached
  if (regCode.max_uses && regCode.current_uses >= regCode.max_uses) {
    return c.json({ valid: false, error: "Code has reached maximum uses" }, 400);
  }

  return c.json({
    valid: true,
    plan_id: regCode.plan_id,
    uses_remaining: regCode.max_uses ? regCode.max_uses - regCode.current_uses : null
  });
});

// Admin user plan management
app.patch("/api/admin/users/:userId/plan", adminMiddleware, async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();
  const planId = body.plan_id;

  if (!planId || !["free", "pro", "enterprise"].includes(planId)) {
    return c.json({ error: "Invalid plan_id. Must be: free, pro, or enterprise" }, 400);
  }

  try {
    // Check if user exists
    const { results: userCheck } = await c.env.DB.prepare(
      "SELECT user_id FROM users WHERE user_id = ?"
    ).bind(userId).all();

    if (userCheck.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    // For now, we'll store the plan in the users table as a new column
    // Since payment system is disabled, this is just for admin tracking
    await c.env.DB.prepare(
      "UPDATE users SET subscription_plan = ?, updated_at = ? WHERE user_id = ?"
    ).bind(planId, new Date().toISOString(), userId).run();

    return c.json({
      success: true,
      message: `User plan updated to ${planId}`,
      user_id: userId,
      plan_id: planId
    });
  } catch (error) {
    console.error("Failed to update user plan:", error);
    return c.json({ error: "Failed to update user plan" }, 500);
  }
});

app.get("/api/admin/analytics", adminMiddleware, async (c) => {
  const days = parseInt(c.req.query("days") || "30");
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Daily active users
  const { results: dailyUsers } = await c.env.DB.prepare(`
    SELECT 
      DATE(start_time) as date,
      COUNT(DISTINCT user_id) as active_users
    FROM focus_sessions 
    WHERE start_time >= ?
    GROUP BY DATE(start_time)
    ORDER BY date
  `).bind(fromDate).all();

  // Daily task completion
  const { results: dailyTasks } = await c.env.DB.prepare(`
    SELECT 
      DATE(completed_at) as date,
      COUNT(*) as completed_tasks
    FROM tasks 
    WHERE is_completed = 1 AND completed_at >= ?
    GROUP BY DATE(completed_at)
    ORDER BY date
  `).bind(fromDate).all();

  // Daily focus time
  const { results: dailyFocus } = await c.env.DB.prepare(`
    SELECT 
      DATE(start_time) as date,
      SUM(duration_minutes) as total_minutes
    FROM focus_sessions 
    WHERE session_type = 'focus' AND end_time IS NOT NULL AND start_time >= ?
    GROUP BY DATE(start_time)
    ORDER BY date
  `).bind(fromDate).all();

  return c.json({
    daily_active_users: dailyUsers,
    daily_completed_tasks: dailyTasks,
    daily_focus_time: dailyFocus
  });
});

// Task endpoints
const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().optional(),
  estimated_minutes: z.number().optional(),
  project: z.string().optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  repeat_detail: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "completed"]).optional(),
  priority: z.number().optional(),
  estimated_minutes: z.number().optional(),
  actual_minutes: z.number().optional(),
  is_completed: z.boolean().optional(),
  project: z.string().optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  repeat_detail: z.string().optional(),
});

app.get("/api/tasks", authMiddleware, async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY priority DESC, created_at DESC"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

app.post("/api/tasks", authMiddleware, zValidator("json", CreateTaskSchema), async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    console.log("📝 [Tasks] Creating task:", {
      user_id: user!.id,
      title: data.title,
      has_description: !!data.description,
      priority: data.priority,
      project: data.project,
      due_date: data.due_date,
      repeat: data.repeat
    });

    const tagsJson = data.tags ? JSON.stringify(data.tags) : null;
    const repeat = data.repeat || "none";
    const repeatDetail = data.repeat_detail || null;

    // Calculate next occurrence date if this is a recurring task
    let nextOccurrence = null;
    if (repeat !== "none" && data.due_date) {
      nextOccurrence = calculateNextOccurrence(data.due_date, repeat, repeatDetail);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO tasks (user_id, title, description, priority, estimated_minutes, project, due_date, tags, status, \`repeat\`, repeat_detail, next_occurrence_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?)`
    )
      .bind(
        user!.id,
        data.title,
        data.description || null,
        data.priority || 0,
        data.estimated_minutes || null,
        data.project || null,
        data.due_date || null,
        tagsJson,
        repeat,
        repeatDetail,
        nextOccurrence
      )
      .run();

    console.log("📝 [Tasks] Insert result:", {
      success: result.success,
      last_row_id: result.meta.last_row_id,
      last_insert_rowid: result.meta.last_insert_rowid,
      changes: result.meta.changes
    });

    // Get the inserted ID - try both last_row_id and last_insert_rowid
    const insertedId = result.meta.last_row_id || result.meta.last_insert_rowid;

    if (!insertedId) {
      console.error("❌ [Tasks] No insert ID returned from database");
      console.error("❌ [Tasks] Full result meta:", JSON.stringify(result.meta, null, 2));
      throw new Error("Failed to get inserted task ID from database");
    }

    const { results } = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
      .bind(insertedId)
      .all();

    if (!results || results.length === 0) {
      console.error("❌ [Tasks] Task was inserted but not found when querying by ID:", insertedId);
      // Try to get the last inserted task for this user as fallback
      const { results: fallbackResults } = await c.env.DB.prepare(
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC LIMIT 1"
      ).bind(user!.id).all();

      if (fallbackResults && fallbackResults.length > 0) {
        console.log("✅ [Tasks] Found task using fallback query");
        return c.json(fallbackResults[0], 201);
      }

      throw new Error("Task was created but could not be retrieved");
    }

    console.log("✅ [Tasks] Task created successfully:", insertedId);
    return c.json(results[0], 201);
  } catch (error: any) {
    console.error("❌ [Tasks] Error creating task:", error);
    console.error("❌ [Tasks] Error stack:", error?.stack);
    console.error("❌ [Tasks] Error details:", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState
    });
    return c.json({
      error: "Failed to create task",
      message: error?.message || "Unknown error occurred",
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, 500);
  }
});

app.patch("/api/tasks/:id", authMiddleware, zValidator("json", UpdateTaskSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  const { results: existing } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(id, user!.id)
    .all();

  if (existing.length === 0) {
    return c.json({ error: "Task not found" }, 404);
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push("priority = ?");
    values.push(data.priority);
  }
  if (data.estimated_minutes !== undefined) {
    updates.push("estimated_minutes = ?");
    values.push(data.estimated_minutes);
  }
  if (data.actual_minutes !== undefined) {
    updates.push("actual_minutes = ?");
    values.push(data.actual_minutes);
  }
  if (data.is_completed !== undefined) {
    updates.push("is_completed = ?");
    values.push(data.is_completed ? 1 : 0);
    if (data.is_completed) {
      updates.push("completed_at = ?");
      values.push(new Date().toISOString());
    } else {
      updates.push("completed_at = ?");
      values.push(null);
    }
  }
  if (data.project !== undefined) {
    updates.push("project = ?");
    values.push(data.project);
  }
  if (data.due_date !== undefined) {
    updates.push("due_date = ?");
    values.push(data.due_date);
  }
  if (data.tags !== undefined) {
    updates.push("tags = ?");
    values.push(data.tags ? JSON.stringify(data.tags) : null);
  }
  if (data.repeat !== undefined) {
    updates.push("`repeat` = ?");
    values.push(data.repeat);

    // Recalculate next occurrence if repeat pattern changed
    if (data.repeat !== "none") {
      const task = existing[0] as any;
      const dueDate = data.due_date !== undefined ? data.due_date : task.due_date;
      const repeatDetail = data.repeat_detail !== undefined ? data.repeat_detail : task.repeat_detail;
      if (dueDate) {
        const nextOccurrence = calculateNextOccurrence(dueDate, data.repeat, repeatDetail);
        updates.push("next_occurrence_date = ?");
        values.push(nextOccurrence);
      }
    } else {
      updates.push("next_occurrence_date = ?");
      values.push(null);
    }
  }
  if (data.repeat_detail !== undefined) {
    updates.push("repeat_detail = ?");
    values.push(data.repeat_detail);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(id, user!.id);

  try {
    await c.env.DB.prepare(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
    )
      .bind(...values)
      .run();
  } catch (error: any) {
    console.error("[Tasks] Error updating task:", error);
    console.error("[Tasks] SQL:", `UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`);
    console.error("[Tasks] Values:", values);
    return c.json({
      error: "Failed to update task",
      message: error.message,
      details: error.sqlMessage || error.code
    }, 500);
  }

  const { results } = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id)
    .all();

  const updatedTask = results[0];

  // If task was just completed and Notion sync is enabled, trigger sync
  if (data.is_completed && updatedTask) {
    await syncToNotionIfEnabled(c.env.DB, user!.id, updatedTask as any);
  }

  return c.json(updatedTask);
});

app.delete("/api/tasks/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  // Delete subtasks first
  await c.env.DB.prepare("DELETE FROM subtasks WHERE task_id = ?")
    .bind(id)
    .run();

  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .bind(id, user!.id)
    .run();

  return c.json({ success: true });
});

// Subtask endpoints
const CreateSubtaskSchema = z.object({
  title: z.string().min(1),
  estimated_minutes: z.number().optional(),
  position: z.number().optional(),
});

const UpdateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  estimated_minutes: z.number().optional(),
  is_completed: z.boolean().optional(),
  position: z.number().optional(),
});

app.get("/api/tasks/:taskId/subtasks", authMiddleware, async (c) => {
  const user = c.get("user");
  const taskId = c.req.param("taskId");

  // Verify task ownership
  const { results: taskResults } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(taskId, user!.id)
    .all();

  if (taskResults.length === 0) {
    return c.json({ error: "Task not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, created_at ASC"
  )
    .bind(taskId)
    .all();

  return c.json(results);
});

app.post("/api/tasks/:taskId/subtasks", authMiddleware, zValidator("json", CreateSubtaskSchema), async (c) => {
  const user = c.get("user");
  const taskId = c.req.param("taskId");
  const data = c.req.valid("json");

  // Verify task ownership
  const { results: taskResults } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(taskId, user!.id)
    .all();

  if (taskResults.length === 0) {
    return c.json({ error: "Task not found" }, 404);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO subtasks (task_id, title, estimated_minutes, position)
     VALUES (?, ?, ?, ?)`
  )
    .bind(taskId, data.title, data.estimated_minutes || null, data.position || 0)
    .run();

  const { results } = await c.env.DB.prepare("SELECT * FROM subtasks WHERE id = ?")
    .bind(result.meta.last_row_id)
    .all();

  return c.json(results[0], 201);
});

app.patch("/api/subtasks/:id", authMiddleware, zValidator("json", UpdateSubtaskSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.estimated_minutes !== undefined) {
    updates.push("estimated_minutes = ?");
    values.push(data.estimated_minutes);
  }
  if (data.is_completed !== undefined) {
    updates.push("is_completed = ?");
    values.push(data.is_completed ? 1 : 0);
  }
  if (data.position !== undefined) {
    updates.push("position = ?");
    values.push(data.position);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(id);

  await c.env.DB.prepare(
    `UPDATE subtasks SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...values)
    .run();

  const { results } = await c.env.DB.prepare("SELECT * FROM subtasks WHERE id = ?")
    .bind(id)
    .all();

  return c.json(results[0]);
});

app.delete("/api/subtasks/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM subtasks WHERE id = ?")
    .bind(id)
    .run();

  return c.json({ success: true });
});

// Focus session endpoints
const CreateFocusSessionSchema = z.object({
  task_id: z.number().optional(),
  start_time: z.string(),
  session_type: z.enum(["focus", "short_break", "long_break"]),
  timer_mode: z.enum(["classic", "pomodoro", "custom"]).optional(),
});

const UpdateFocusSessionSchema = z.object({
  end_time: z.string().optional(),
  duration_minutes: z.number().optional(),
  notes: z.string().optional(),
});

app.get("/api/focus-sessions", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = "SELECT * FROM focus_sessions WHERE user_id = ?";
  const params: any[] = [user!.id];

  if (from) {
    query += " AND start_time >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND start_time <= ?";
    params.push(to);
  }

  query += " ORDER BY start_time DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.post("/api/focus-sessions", authMiddleware, zValidator("json", CreateFocusSessionSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  console.log("🎯 [Focus Session] Creating new session:", {
    user_id: user!.id,
    task_id: data.task_id,
    session_type: data.session_type,
    timer_mode: data.timer_mode,
    start_time: data.start_time
  });

  const result = await c.env.DB.prepare(
    `INSERT INTO focus_sessions (user_id, task_id, start_time, session_type, timer_mode)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(user!.id, data.task_id || null, data.start_time, data.session_type, data.timer_mode || 'pomodoro')
    .run();

  console.log("✅ [Focus Session] Session created with ID:", result.meta.last_row_id);

  const { results } = await c.env.DB.prepare("SELECT * FROM focus_sessions WHERE id = ?")
    .bind(result.meta.last_row_id)
    .all();

  return c.json(results[0], 201);
});

app.patch("/api/focus-sessions/:id", authMiddleware, zValidator("json", UpdateFocusSessionSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  console.log("📝 [Focus Session] Updating session:", {
    session_id: id,
    user_id: user!.id,
    updates: data
  });

  const { results: existing } = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE id = ?"
  )
    .bind(id)
    .all();

  if (existing.length === 0) {
    console.error("❌ [Focus Session] Session not found:", id);
    return c.json({ error: "Session not found" }, 404);
  }

  // Verify user owns this session
  const sessionData = existing[0] as any;
  if (sessionData.user_id !== user!.id) {
    console.error("❌ [Focus Session] User mismatch for session:", id, "Expected:", sessionData.user_id, "Got:", user!.id);
    return c.json({ error: "Session not found" }, 404);
  }
  const updates: string[] = [];
  const values: any[] = [];

  if (data.end_time !== undefined) {
    updates.push("end_time = ?");
    values.push(data.end_time);
  }
  if (data.duration_minutes !== undefined) {
    updates.push("duration_minutes = ?");
    values.push(data.duration_minutes);
  }
  if (data.notes !== undefined) {
    updates.push("notes = ?");
    values.push(data.notes);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(id, user!.id);

  await c.env.DB.prepare(
    `UPDATE focus_sessions SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
  )
    .bind(...values)
    .run();

  console.log("✅ [Focus Session] Session updated:", id, "Duration:", data.duration_minutes, "minutes");

  // If this is a focus session being completed and has a task, merge contiguous sessions and update task time
  if (data.end_time && sessionData.session_type === 'focus' && sessionData.task_id) {
    await mergeContiguousSessions(c.env.DB, user!.id, sessionData.task_id);
    await updateTaskActualTime(c.env.DB, sessionData.task_id);
  }

  const { results } = await c.env.DB.prepare("SELECT * FROM focus_sessions WHERE id = ?")
    .bind(id)
    .all();

  return c.json(results[0]);
});

// User settings endpoints
app.get("/api/settings", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_settings WHERE user_id = ?"
  )
    .bind(user!.id)
    .all();

  if (results.length === 0) {
    // Create default settings
    await c.env.DB.prepare(
      `INSERT INTO user_settings (user_id) VALUES (?)`
    )
      .bind(user!.id)
      .run();

    const { results: newResults } = await c.env.DB.prepare(
      "SELECT * FROM user_settings WHERE user_id = ?"
    )
      .bind(user!.id)
      .all();

    return c.json(newResults[0]);
  }

  return c.json(results[0]);
});

const UpdateSettingsSchema = z.object({
  focus_duration_minutes: z.number().optional(),
  short_break_minutes: z.number().optional(),
  long_break_minutes: z.number().optional(),
  cycles_before_long_break: z.number().optional(),
  auto_start_breaks: z.boolean().optional(),
  auto_start_focus: z.boolean().optional(),
  minimal_mode_enabled: z.number().optional(),
  blocked_websites: z.string().nullable().optional(),
  show_motivational_prompts: z.number().optional(),
  notion_sync_enabled: z.number().optional(),
  notion_database_id: z.string().nullable().optional(),
  notion_access_token: z.string().nullable().optional(),
  custom_theme_enabled: z.number().optional(),
  custom_theme_primary: z.string().optional(),
  custom_theme_secondary: z.string().optional(),
  custom_theme_accent: z.string().optional(),
});

app.patch("/api/settings", authMiddleware, zValidator("json", UpdateSettingsSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  const updates: string[] = [];
  const values: any[] = [];

  if (data.focus_duration_minutes !== undefined) {
    updates.push("focus_duration_minutes = ?");
    values.push(data.focus_duration_minutes);
  }
  if (data.short_break_minutes !== undefined) {
    updates.push("short_break_minutes = ?");
    values.push(data.short_break_minutes);
  }
  if (data.long_break_minutes !== undefined) {
    updates.push("long_break_minutes = ?");
    values.push(data.long_break_minutes);
  }
  if (data.cycles_before_long_break !== undefined) {
    updates.push("cycles_before_long_break = ?");
    values.push(data.cycles_before_long_break);
  }
  if (data.auto_start_breaks !== undefined) {
    updates.push("auto_start_breaks = ?");
    values.push(data.auto_start_breaks ? 1 : 0);
  }
  if (data.auto_start_focus !== undefined) {
    updates.push("auto_start_focus = ?");
    values.push(data.auto_start_focus ? 1 : 0);
  }
  if (data.minimal_mode_enabled !== undefined) {
    updates.push("minimal_mode_enabled = ?");
    values.push(data.minimal_mode_enabled);
  }
  if (data.blocked_websites !== undefined) {
    updates.push("blocked_websites = ?");
    values.push(data.blocked_websites);
  }
  if (data.show_motivational_prompts !== undefined) {
    updates.push("show_motivational_prompts = ?");
    values.push(data.show_motivational_prompts);
  }
  if (data.notion_sync_enabled !== undefined) {
    updates.push("notion_sync_enabled = ?");
    values.push(data.notion_sync_enabled);
  }
  if (data.notion_database_id !== undefined) {
    updates.push("notion_database_id = ?");
    values.push(data.notion_database_id);
  }
  if (data.notion_access_token !== undefined) {
    updates.push("notion_access_token = ?");
    values.push(data.notion_access_token);
  }
  if (data.custom_theme_enabled !== undefined) {
    updates.push("custom_theme_enabled = ?");
    values.push(data.custom_theme_enabled);
  }
  if (data.custom_theme_primary !== undefined) {
    updates.push("custom_theme_primary = ?");
    values.push(data.custom_theme_primary);
  }
  if (data.custom_theme_secondary !== undefined) {
    updates.push("custom_theme_secondary = ?");
    values.push(data.custom_theme_secondary);
  }
  if (data.custom_theme_accent !== undefined) {
    updates.push("custom_theme_accent = ?");
    values.push(data.custom_theme_accent);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(user!.id);

  await c.env.DB.prepare(
    `UPDATE user_settings SET ${updates.join(", ")} WHERE user_id = ?`
  )
    .bind(...values)
    .run();

  const { results } = await c.env.DB.prepare("SELECT * FROM user_settings WHERE user_id = ?")
    .bind(user!.id)
    .all();

  return c.json(results[0]);
});

// Analytics endpoint
app.get("/api/analytics", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = `
    SELECT 
      DATE(start_time) as date,
      COUNT(*) as session_count,
      SUM(
        CASE 
          WHEN end_time IS NOT NULL THEN duration_minutes
          ELSE TIMESTAMPDIFF(MINUTE, start_time, NOW())
        END
      ) as total_minutes,
      session_type
    FROM focus_sessions 
    WHERE user_id = ?
  `;
  const params: any[] = [user!.id];

  if (from) {
    query += " AND start_time >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND start_time <= ?";
    params.push(to);
  }

  query += " GROUP BY DATE(start_time), session_type ORDER BY date DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

// Get user subscription plan
app.get("/api/user/subscription", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT subscription_plan FROM users WHERE user_id = ?"
    ).bind(user!.id).all();

    const planId = results.length > 0 ? (results[0] as any).subscription_plan || 'free' : 'free';

    return c.json({
      plan_id: planId,
      is_pro: planId === 'pro',
      is_enterprise: planId === 'enterprise',
      is_free: planId === 'free'
    });
  } catch (error) {
    console.error("Failed to fetch subscription plan:", error);
    return c.json({
      plan_id: 'free',
      is_pro: false,
      is_enterprise: false,
      is_free: true
    });
  }
});

// Streak endpoint - increments on any day with ≥25 minutes focused
app.get("/api/streak", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get all days with at least 25 minutes of focus time
  const { results } = await c.env.DB.prepare(`
    SELECT DATE(start_time) as date, SUM(duration_minutes) as total_minutes
    FROM focus_sessions
    WHERE user_id = ? AND session_type = 'focus' AND end_time IS NOT NULL
    GROUP BY DATE(start_time)
    HAVING total_minutes >= 25
    ORDER BY date DESC
  `)
    .bind(user!.id)
    .all();

  if (results.length === 0) {
    return c.json({ streak: 0 });
  }

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if there's a qualifying session today or yesterday to start the streak
  const firstDate = results[0].date as string;
  if (firstDate !== today && firstDate !== yesterday) {
    return c.json({ streak: 0 });
  }

  // Count consecutive days
  let expectedDate = new Date();
  if (firstDate === yesterday) {
    expectedDate = new Date(Date.now() - 86400000);
  }

  for (const row of results) {
    const sessionDate = row.date as string;
    const expectedDateStr = expectedDate.toISOString().split('T')[0];

    if (sessionDate === expectedDateStr) {
      streak++;
      expectedDate = new Date(expectedDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return c.json({ streak });
});

// Dashboard stats endpoint
app.get("/api/dashboard-stats", authMiddleware, async (c) => {
  const user = c.get("user");
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Today's focus time (including active sessions)
    // MySQL: Use TIMESTAMPDIFF instead of julianday
    const { results: todayResults } = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN end_time IS NOT NULL THEN duration_minutes
          ELSE TIMESTAMPDIFF(MINUTE, start_time, NOW())
        END
      ), 0) as total_minutes
      FROM focus_sessions
      WHERE user_id = ? AND session_type = 'focus' AND start_time >= ?
    `).bind(user!.id, todayStart).all();

    // Week's focus time (including active sessions)
    const { results: weekResults } = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN end_time IS NOT NULL THEN duration_minutes
          ELSE TIMESTAMPDIFF(MINUTE, start_time, NOW())
        END
      ), 0) as total_minutes
      FROM focus_sessions
      WHERE user_id = ? AND session_type = 'focus' AND start_time >= ?
    `).bind(user!.id, weekAgo).all();

    // Completed tasks today
    const { results: completedResults } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE user_id = ? AND is_completed = 1 AND completed_at >= ?
  `).bind(user!.id, todayStart).all();

    // Average session length (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { results: avgResults } = await c.env.DB.prepare(`
    SELECT AVG(duration_minutes) as avg_minutes
    FROM focus_sessions
    WHERE user_id = ? AND session_type = 'focus' AND end_time IS NOT NULL AND start_time >= ?
  `).bind(user!.id, thirtyDaysAgo).all();

    // Longest streak
    const { results: streakDays } = await c.env.DB.prepare(`
      SELECT DATE(start_time) as date, SUM(duration_minutes) as total_minutes
      FROM focus_sessions
      WHERE user_id = ? AND session_type = 'focus' AND end_time IS NOT NULL
      GROUP BY DATE(start_time)
      HAVING total_minutes >= 25
      ORDER BY date DESC
    `).bind(user!.id).all();

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const row of streakDays as any[]) {
      const currentDate = new Date(row.date as string);

      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const dayDiff = Math.round((lastDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }

      lastDate = currentDate;
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    return c.json({
      today_focus_minutes: (todayResults[0] as any)?.total_minutes || 0,
      week_focus_minutes: (weekResults[0] as any)?.total_minutes || 0,
      completed_today: (completedResults[0] as any)?.count || 0,
      avg_session_minutes: Math.round((avgResults[0] as any)?.avg_minutes || 0),
      longest_streak: longestStreak,
    });
  } catch (error: any) {
    console.error("Error in dashboard-stats:", error);
    return c.json({
      error: "Failed to fetch dashboard stats",
      message: error?.message
    }, 500);
  }
});

// Sessions by mode endpoint
app.get("/api/analytics/by-mode", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");

  let query = `
    SELECT 
      timer_mode, 
      COUNT(*) as session_count, 
      SUM(
        CASE 
          WHEN end_time IS NOT NULL THEN duration_minutes
          ELSE TIMESTAMPDIFF(MINUTE, start_time, NOW())
        END
      ) as total_minutes
    FROM focus_sessions
    WHERE user_id = ? AND session_type = 'focus'
  `;
  const params: any[] = [user!.id];

  if (from) {
    query += " AND start_time >= ?";
    params.push(from);
  }

  query += " GROUP BY timer_mode";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Time by project/tag endpoint
app.get("/api/analytics/by-project", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");

  let query = `
    SELECT 
      t.project, 
      SUM(
        CASE 
          WHEN fs.end_time IS NOT NULL THEN fs.duration_minutes
          ELSE TIMESTAMPDIFF(MINUTE, fs.start_time, NOW())
        END
      ) as total_minutes
    FROM focus_sessions fs
    LEFT JOIN tasks t ON fs.task_id = t.id
    WHERE fs.user_id = ? AND fs.session_type = 'focus'
  `;
  const params: any[] = [user!.id];

  if (from) {
    query += " AND fs.start_time >= ?";
    params.push(from);
  }

  query += " GROUP BY t.project ORDER BY total_minutes DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Time tracking comparison endpoint - estimated vs actual
app.get("/api/analytics/time-comparison", authMiddleware, async (c) => {
  const user = c.get("user");
  const range = c.req.query("range") || "month";

  // Calculate date range
  let fromDate: string | null = null;
  const now = new Date();

  if (range === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    fromDate = weekAgo.toISOString();
  } else if (range === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    fromDate = monthAgo.toISOString();
  }

  // Get completed tasks with both estimated and actual time
  let query = `
    SELECT 
      id,
      title,
      project,
      estimated_minutes,
      actual_minutes,
      completed_at,
      (actual_minutes - estimated_minutes) as difference,
      CASE 
        WHEN estimated_minutes > 0 THEN (CAST(actual_minutes AS FLOAT) / CAST(estimated_minutes AS FLOAT)) * 100
        ELSE 0
      END as accuracy_percentage
    FROM tasks
    WHERE user_id = ?
      AND is_completed = 1
      AND estimated_minutes > 0
      AND actual_minutes > 0
  `;

  const params: any[] = [user!.id];

  if (fromDate) {
    query += " AND completed_at >= ?";
    params.push(fromDate);
  }

  query += " ORDER BY completed_at DESC";

  const { results: tasks } = await c.env.DB.prepare(query).bind(...params).all();

  // Calculate statistics
  const taskData = tasks as any[];
  const stats = {
    total_tasks_with_estimates: taskData.length,
    avg_estimation_accuracy: 0,
    total_overestimated: 0,
    total_underestimated: 0,
    total_accurate: 0,
    avg_overestimation_minutes: 0,
    avg_underestimation_minutes: 0,
  };

  if (taskData.length > 0) {
    let totalAccuracy = 0;
    let overestimationSum = 0;
    let overestimationCount = 0;
    let underestimationSum = 0;
    let underestimationCount = 0;

    taskData.forEach((task) => {
      const accuracy = task.accuracy_percentage;
      totalAccuracy += accuracy;

      // Consider accurate if within 10% of estimate
      if (accuracy >= 90 && accuracy <= 110) {
        stats.total_accurate++;
      } else if (task.difference > 0) {
        // Took longer than estimated (underestimated)
        stats.total_underestimated++;
        underestimationSum += Math.abs(task.difference);
        underestimationCount++;
      } else {
        // Took less time than estimated (overestimated)
        stats.total_overestimated++;
        overestimationSum += Math.abs(task.difference);
        overestimationCount++;
      }
    });

    stats.avg_estimation_accuracy = totalAccuracy / taskData.length;
    stats.avg_overestimation_minutes = overestimationCount > 0
      ? overestimationSum / overestimationCount
      : 0;
    stats.avg_underestimation_minutes = underestimationCount > 0
      ? underestimationSum / underestimationCount
      : 0;
  }

  return c.json({
    tasks: taskData,
    stats,
  });
});

// Goal endpoints
const CreateGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  target_type: z.enum(["focus_minutes", "completed_tasks", "focus_sessions", "daily_streak"]),
  target_value: z.number().min(1),
  start_date: z.string(),
  end_date: z.string(),
});

const UpdateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  target_value: z.number().min(1).optional(),
  end_date: z.string().optional(),
  is_completed: z.boolean().optional(),
});

app.get("/api/goals", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user!.id).all();

  // Calculate current values for each goal
  const goalsWithProgress = await Promise.all((results as any[]).map(async (goal) => {
    let currentValue = 0;

    switch (goal.target_type) {
      case "focus_minutes":
        const { results: minutesResults } = await c.env.DB.prepare(`
          SELECT COALESCE(SUM(duration_minutes), 0) as total
          FROM focus_sessions
          WHERE user_id = ? AND session_type = 'focus' AND end_time IS NOT NULL
            AND start_time >= ? AND start_time <= ?
        `).bind(user!.id, goal.start_date, goal.end_date).all();
        currentValue = (minutesResults[0] as any).total;
        break;

      case "completed_tasks":
        const { results: tasksResults } = await c.env.DB.prepare(`
          SELECT COUNT(*) as total
          FROM tasks
          WHERE user_id = ? AND is_completed = 1
            AND completed_at >= ? AND completed_at <= ?
        `).bind(user!.id, goal.start_date, goal.end_date).all();
        currentValue = (tasksResults[0] as any).total;
        break;

      case "focus_sessions":
        const { results: sessionsResults } = await c.env.DB.prepare(`
          SELECT COUNT(*) as total
          FROM focus_sessions
          WHERE user_id = ? AND session_type = 'focus' AND end_time IS NOT NULL
            AND start_time >= ? AND start_time <= ?
        `).bind(user!.id, goal.start_date, goal.end_date).all();
        currentValue = (sessionsResults[0] as any).total;
        break;

      case "daily_streak":
        const { results: streakResults } = await c.env.DB.prepare(`
          SELECT DATE(start_time) as date, SUM(duration_minutes) as total_minutes
          FROM focus_sessions
          WHERE user_id = ? AND session_type = 'focus' AND end_time IS NOT NULL
            AND start_time >= ? AND start_time <= ?
          GROUP BY DATE(start_time)
          HAVING total_minutes >= 25
          ORDER BY date ASC
        `).bind(user!.id, goal.start_date, goal.end_date).all();

        let streak = 0;
        let expectedDate = new Date(goal.start_date);
        for (const row of streakResults) {
          const sessionDate = new Date(row.date as string);
          if (sessionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            streak++;
            expectedDate = new Date(expectedDate.getTime() + 24 * 60 * 60 * 1000);
          } else {
            break;
          }
        }
        currentValue = streak;
        break;
    }

    // Update current_value in database
    await c.env.DB.prepare(
      "UPDATE user_goals SET current_value = ?, updated_at = ? WHERE id = ?"
    ).bind(currentValue, new Date().toISOString(), goal.id).run();

    // Check if goal is completed
    if (currentValue >= goal.target_value && !goal.is_completed) {
      await c.env.DB.prepare(
        "UPDATE user_goals SET is_completed = 1, completed_at = ?, updated_at = ? WHERE id = ?"
      ).bind(new Date().toISOString(), new Date().toISOString(), goal.id).run();
      goal.is_completed = 1;
      goal.completed_at = new Date().toISOString();
    }

    return { ...goal, current_value: currentValue };
  }));

  return c.json({ goals: goalsWithProgress });
});

app.post("/api/goals", authMiddleware, zValidator("json", CreateGoalSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  const result = await c.env.DB.prepare(
    `INSERT INTO user_goals (user_id, title, description, target_type, target_value, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user!.id,
    data.title,
    data.description || null,
    data.target_type,
    data.target_value,
    data.start_date,
    data.end_date
  ).run();

  const { results } = await c.env.DB.prepare("SELECT * FROM user_goals WHERE id = ?")
    .bind(result.meta.last_row_id)
    .all();

  return c.json(results[0], 201);
});

app.patch("/api/goals/:id", authMiddleware, zValidator("json", UpdateGoalSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  const { results: existing } = await c.env.DB.prepare(
    "SELECT * FROM user_goals WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).all();

  if (existing.length === 0) {
    return c.json({ error: "Goal not found" }, 404);
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.target_value !== undefined) {
    updates.push("target_value = ?");
    values.push(data.target_value);
  }
  if (data.end_date !== undefined) {
    updates.push("end_date = ?");
    values.push(data.end_date);
  }
  if (data.is_completed !== undefined) {
    updates.push("is_completed = ?");
    values.push(data.is_completed ? 1 : 0);
    if (data.is_completed) {
      updates.push("completed_at = ?");
      values.push(new Date().toISOString());
    }
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(id, user!.id);

  await c.env.DB.prepare(
    `UPDATE user_goals SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  const { results } = await c.env.DB.prepare("SELECT * FROM user_goals WHERE id = ?")
    .bind(id)
    .all();

  return c.json(results[0]);
});

app.delete("/api/goals/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM user_goals WHERE id = ? AND user_id = ?")
    .bind(id, user!.id)
    .run();

  return c.json({ success: true });
});

// Email signup endpoint
const EmailSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  signup_source: z.string().default("website"),
  marketing_consent: z.boolean().default(true),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
});

app.post("/api/email-signup", zValidator("json", EmailSignupSchema), async (c) => {
  const data = c.req.valid("json");
  const clientIP = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  const userAgent = c.req.header("user-agent") || "";

  try {
    // Check if email already exists
    const { results: existing } = await c.env.DB.prepare(
      "SELECT * FROM email_signups WHERE email = ?"
    ).bind(data.email).all();

    if (existing.length > 0) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Save to database
    await c.env.DB.prepare(
      `INSERT INTO email_signups 
       (email, name, signup_source, marketing_consent, ip_address, user_agent, referrer, utm_source, utm_medium, utm_campaign, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    ).bind(
      data.email,
      data.name || null,
      data.signup_source,
      data.marketing_consent ? 1 : 0,
      clientIP,
      userAgent,
      data.referrer || null,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null
    ).run();

    // Integrate with email CRM if API keys are available
    const signupData = {
      email: data.email,
      name: data.name,
      source: data.signup_source,
      utm_data: {
        source: data.utm_source,
        medium: data.utm_medium,
        campaign: data.utm_campaign,
      }
    };

    // Sync to both Systeme.io and AWeber if configured
    const systemeKey = c.env.SYSTEME_IO_API_KEY;
    let systemeResult = null;
    let aweberResult = null;

    // Try Systeme.io integration
    if (systemeKey) {
      try {
        console.log("📤 [Email Signup] Starting Systeme.io sync for:", data.email);
        systemeResult = await integrateWithSystemeIO(systemeKey, signupData);
        console.log("✅ [Email Signup] Successfully synced to Systeme.io:", data.email);
      } catch (error) {
        console.error("❌ [Email Signup] Systeme.io sync FAILED for:", data.email);
        console.error("❌ [Email Signup] Error:", error instanceof Error ? error.message : String(error));
      }
    }

    // Try AWeber integration
    const { addAWeberSubscriber } = await import("./aweber.js");
    try {
      console.log("📤 [Email Signup] Starting AWeber sync for:", data.email);
      aweberResult = await addAWeberSubscriber(c.env, {
        email: data.email,
        name: data.name || undefined,
        tags: [data.signup_source, "focusflow-waitlist"].filter(Boolean),
        custom_fields: {
          utm_source: data.utm_source || "",
          utm_medium: data.utm_medium || "",
          utm_campaign: data.utm_campaign || "",
        },
        ad_tracking: `focusflow-${data.signup_source}`,
      });

      if (aweberResult.success) {
        console.log("✅ [Email Signup] Successfully synced to AWeber:", data.email);
      } else {
        console.warn("⚠️ [Email Signup] AWeber sync completed with issues:", aweberResult.error);
      }
    } catch (error) {
      console.error("❌ [Email Signup] AWeber sync FAILED for:", data.email);
      console.error("❌ [Email Signup] Error:", error instanceof Error ? error.message : String(error));
    }

    return c.json({
      success: true,
      message: "Successfully added to waitlist",
      debug: {
        saved_to_database: true,
        systeme_io_synced: systemeResult !== null,
        aweber_synced: aweberResult?.success || false,
      }
    });

  } catch (error) {
    console.error("Email signup error:", error);
    return c.json({ error: "Failed to process signup" }, 500);
  }
});

// Payment endpoints removed - payment system disabled

// Admin endpoint to view signups
app.get("/api/admin/email-signups", adminMiddleware, async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = (page - 1) * limit;

  const { results: signups } = await c.env.DB.prepare(`
    SELECT * FROM email_signups 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const { results: totalCount } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM email_signups"
  ).all();

  return c.json({
    signups,
    pagination: {
      page,
      limit,
      total: (totalCount[0] as any).count,
      pages: Math.ceil((totalCount[0] as any).count / limit)
    }
  });
});

// Admin customer endpoint removed - payment system disabled

// Test endpoint for Systeme.io integration (admin only for security)
app.post("/api/test-systeme", adminMiddleware, async (c) => {
  const systemeKey = c.env.SYSTEME_IO_API_KEY;

  if (!systemeKey) {
    return c.json({
      success: false,
      error: "SYSTEME_IO_API_KEY not configured"
    }, 500);
  }

  try {
    // Parse email from request body if provided
    const body = await c.req.json().catch(() => ({}));
    const testEmail = body.email || "test@gmail.com";

    const testData = {
      email: testEmail,
      name: body.name || "Test User",
      source: "api-test",
      utm_data: {
        source: body.utm_source || null,
        medium: body.utm_medium || null,
        campaign: body.utm_campaign || null,
      }
    };

    console.log("🧪 [Test] Testing Systeme.io integration with:", testEmail);
    const result = await integrateWithSystemeIO(systemeKey, testData);

    return c.json({
      success: true,
      message: "Systeme.io integration test successful",
      result
    });
  } catch (error) {
    console.error("🧪 [Test] Systeme.io test failed:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      note: "422 errors are expected for invalid email addresses like test@example.com. Use real email domains for testing."
    }, 500);
  }
});

// Test endpoint - create a test session
app.post("/api/test/create-session", authMiddleware, async (c) => {
  const user = c.get("user");

  console.log("🧪 [Test] Creating test session for user:", user!.id);

  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO focus_sessions (user_id, start_time, end_time, duration_minutes, session_type, timer_mode)
       VALUES (?, ?, ?, ?, 'focus', 'pomodoro')`
    ).bind(
      user!.id,
      thirtyMinsAgo.toISOString(),
      now.toISOString(),
      30
    ).run();

    console.log("✅ [Test] Test session created with ID:", result.meta.last_row_id);

    return c.json({
      success: true,
      session_id: result.meta.last_row_id,
      message: "Test session created successfully"
    });
  } catch (error) {
    console.error("❌ [Test] Failed to create test session:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Export sessions as CSV
app.get("/api/export/sessions", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = `
    SELECT fs.*, t.title as task_title
    FROM focus_sessions fs
    LEFT JOIN tasks t ON fs.task_id = t.id
    WHERE fs.user_id = ?
  `;
  const params: any[] = [user!.id];

  if (from) {
    query += " AND fs.start_time >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND fs.start_time <= ?";
    params.push(to);
  }

  query += " ORDER BY fs.start_time DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  // Generate CSV
  const headers = ["ID", "Task", "Start Time", "End Time", "Duration (min)", "Type", "Mode", "Notes"];
  const rows = (results as any[]).map(row => [
    row.id,
    row.task_title || "No task",
    row.start_time,
    row.end_time || "",
    row.duration_minutes || "",
    row.session_type,
    row.timer_mode,
    (row.notes || "").replace(/"/g, '""'),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="focusflow-sessions-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

// Focus distraction tracking endpoints
const RecordDistractionSchema = z.object({
  session_id: z.number().optional(),
  distraction_type: z.string(),
  duration_seconds: z.number().min(0),
  metadata: z.string().optional(),
});

app.post("/api/focus-distractions", authMiddleware, zValidator("json", RecordDistractionSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  await c.env.DB.prepare(
    `INSERT INTO focus_distractions (user_id, session_id, distraction_type, duration_seconds, metadata, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    user!.id,
    data.session_id || null,
    data.distraction_type,
    data.duration_seconds,
    data.metadata || null,
    new Date().toISOString()
  ).run();

  return c.json({ success: true }, 201);
});

app.get("/api/focus-distractions", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = "SELECT * FROM focus_distractions WHERE user_id = ?";
  const params: any[] = [user!.id];

  if (from) {
    query += " AND timestamp >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND timestamp <= ?";
    params.push(to);
  }

  query += " ORDER BY timestamp DESC LIMIT 100";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

app.get("/api/focus-distractions/stats", authMiddleware, async (c) => {
  const user = c.get("user");
  const days = parseInt(c.req.query("days") || "30");
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Total distractions and time
  const { results: totals } = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_distractions,
      COALESCE(SUM(duration_seconds), 0) as total_duration_seconds,
      AVG(duration_seconds) as avg_duration_seconds
    FROM focus_distractions
    WHERE user_id = ? AND timestamp >= ?
  `).bind(user!.id, fromDate).all();

  // Distractions by type
  const { results: byType } = await c.env.DB.prepare(`
    SELECT 
      distraction_type,
      COUNT(*) as count,
      SUM(duration_seconds) as total_seconds
    FROM focus_distractions
    WHERE user_id = ? AND timestamp >= ?
    GROUP BY distraction_type
  `).bind(user!.id, fromDate).all();

  // Distractions by day
  const { results: byDay } = await c.env.DB.prepare(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as count,
      SUM(duration_seconds) as total_seconds
    FROM focus_distractions
    WHERE user_id = ? AND timestamp >= ?
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `).bind(user!.id, fromDate).all();

  return c.json({
    totals: totals[0],
    by_type: byType,
    by_day: byDay,
  });
});

// Get distraction analytics with blocked site tracking
app.get("/api/focus-distractions/analytics", authMiddleware, async (c) => {
  const user = c.get("user");
  const days = parseInt(c.req.query("days") || "7");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Total distractions
  const { results: totalResults } = await c.env.DB.prepare(`
    SELECT COUNT(*) as total, SUM(duration_seconds) as total_seconds
    FROM focus_distractions
    WHERE user_id = ? AND created_at >= ?
  `).bind(user!.id, startDate.toISOString()).all();

  // Distractions by type
  const { results: byTypeResults } = await c.env.DB.prepare(`
    SELECT distraction_type, COUNT(*) as count, SUM(duration_seconds) as total_seconds
    FROM focus_distractions
    WHERE user_id = ? AND created_at >= ?
    GROUP BY distraction_type
    ORDER BY count DESC
  `).bind(user!.id, startDate.toISOString()).all();

  // Blocked site visits (from metadata)
  const { results: blockedSiteResults } = await c.env.DB.prepare(`
    SELECT metadata, COUNT(*) as count
    FROM focus_distractions
    WHERE user_id = ? 
      AND created_at >= ?
      AND distraction_type = 'blocked_site_visit'
      AND metadata IS NOT NULL
    GROUP BY metadata
    ORDER BY count DESC
    LIMIT 10
  `).bind(user!.id, startDate.toISOString()).all();

  // Parse blocked sites from metadata
  const blockedSiteStats = blockedSiteResults.map((row: any) => {
    try {
      const metadata = JSON.parse(row.metadata);
      return {
        site: metadata.blockedSite,
        count: row.count,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Daily breakdown
  const { results: dailyResults } = await c.env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count, SUM(duration_seconds) as total_seconds
    FROM focus_distractions
    WHERE user_id = ? AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).bind(user!.id, startDate.toISOString()).all();

  return c.json({
    total: (totalResults[0] as any)?.total || 0,
    total_seconds: (totalResults[0] as any)?.total_seconds || 0,
    by_type: byTypeResults,
    blocked_sites: blockedSiteStats,
    daily: dailyResults,
  });
});

// Google Calendar Integration Endpoints
app.get("/api/calendar/auth-url", authMiddleware, async (c) => {
  const clientId = c.env.GOOGLE_CALENDAR_CLIENT_ID;

  if (!clientId) {
    return c.json({ error: "Google Calendar not configured" }, 500);
  }

  const redirectUri = `${new URL(c.req.url).origin}/api/calendar/callback`;
  const scope = "https://www.googleapis.com/auth/calendar.readonly";
  const state = crypto.randomUUID();

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`;

  return c.json({ authUrl });
});

app.get("/api/calendar/callback", async (c) => {
  // Immediately return a redirect page - process in background
  const code = c.req.query("code");
  const error = c.req.query("error");
  const state = c.req.query("state");

  // Simple redirect page that works immediately
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Connecting Calendar...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Connecting your calendar...</h2>
    <p>Please wait, redirecting...</p>
  </div>
  <script>
    (function() {
      const code = ${JSON.stringify(code)};
      const error = ${JSON.stringify(error)};
      const state = ${JSON.stringify(state)};
      
      console.log('Calendar callback received:', { code: !!code, error, state });
      
      // Store callback data in sessionStorage for processing
      if (code) {
        sessionStorage.setItem('calendar_oauth_code', code);
        sessionStorage.setItem('calendar_oauth_state', state || '');
      }
      
      // Redirect immediately
      setTimeout(function() {
        if (error) {
          window.location.href = '/settings?calendar_error=' + error;
        } else if (code) {
          window.location.href = '/settings?calendar_callback=true';
        } else {
          window.location.href = '/settings?calendar_error=no_code';
        }
      }, 500);
    })();
  </script>
</body>
</html>`;

  // Process the OAuth in the background (don't wait for completion)
  if (code && !error) {
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const sessionToken = getCookie(c, SESSION_TOKEN_COOKIE_NAME);
          if (!sessionToken) {
            console.error("❌ [Calendar Callback] No session token");
            return;
          }

          const user = await getCurrentUserFromToken(sessionToken, c.env.DB);

          if (!user) {
            console.error("❌ [Calendar Callback] No user found");
            return;
          }

          console.log("📅 [Calendar Callback] Processing OAuth for user:", user.id);

          const clientId = c.env.GOOGLE_CALENDAR_CLIENT_ID;
          const clientSecret = c.env.GOOGLE_CALENDAR_CLIENT_SECRET;
          const redirectUri = `${new URL(c.req.url).origin}/api/calendar/callback`;

          // Exchange code for tokens
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: clientId!,
              client_secret: clientSecret!,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("❌ [Calendar Callback] Token exchange failed:", errorText);
            return;
          }

          const tokens = await tokenResponse.json() as any;
          const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

          // Check if connection exists
          const { results: existing } = await c.env.DB.prepare(
            "SELECT id FROM user_calendar_connections WHERE user_id = ? AND provider = 'google'"
          ).bind(user.id).all();

          if (existing.length > 0) {
            // Update existing connection
            await c.env.DB.prepare(`
              UPDATE user_calendar_connections 
              SET access_token = ?, refresh_token = ?, token_expires_at = ?, is_active = 1, updated_at = ?
              WHERE user_id = ? AND provider = 'google'
            `).bind(
              tokens.access_token,
              tokens.refresh_token || null,
              expiresAt,
              new Date().toISOString(),
              user.id
            ).run();
          } else {
            // Create new connection
            await c.env.DB.prepare(`
              INSERT INTO user_calendar_connections 
              (user_id, provider, access_token, refresh_token, token_expires_at, calendar_id)
              VALUES (?, 'google', ?, ?, ?, 'primary')
            `).bind(
              user.id,
              tokens.access_token,
              tokens.refresh_token || null,
              expiresAt
            ).run();
          }

          console.log("✅ [Calendar Callback] Calendar connected successfully for user:", user.id);
        } catch (error) {
          console.error("❌ [Calendar Callback] Background processing error:", error);
        }
      })()
    );
  }

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});

app.get("/api/calendar/status", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(`
    SELECT provider, is_active, created_at 
    FROM user_calendar_connections 
    WHERE user_id = ? AND provider = 'google'
  `).bind(user!.id).all();

  if (results.length === 0) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    provider: results[0].provider,
    connectedAt: results[0].created_at
  });
});

app.delete("/api/calendar/disconnect", authMiddleware, async (c) => {
  const user = c.get("user");

  await c.env.DB.prepare(
    "DELETE FROM user_calendar_connections WHERE user_id = ? AND provider = 'google'"
  ).bind(user!.id).run();

  return c.json({ success: true });
});

async function refreshCalendarToken(env: Env, userId: string): Promise<string | null> {
  const { results } = await env.DB.prepare(`
    SELECT access_token, refresh_token, token_expires_at 
    FROM user_calendar_connections 
    WHERE user_id = ? AND provider = 'google'
  `).bind(userId).all();

  if (results.length === 0) return null;

  const connection = results[0] as any;
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  // Token still valid
  if (now < expiresAt) {
    return connection.access_token;
  }

  // Need to refresh
  if (!connection.refresh_token) {
    return null;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: connection.refresh_token,
        client_id: env.GOOGLE_CALENDAR_CLIENT_ID!,
        client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh token");
    }

    const tokens = await tokenResponse.json() as any;
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await env.DB.prepare(`
      UPDATE user_calendar_connections 
      SET access_token = ?, token_expires_at = ?, updated_at = ?
      WHERE user_id = ? AND provider = 'google'
    `).bind(
      tokens.access_token,
      newExpiresAt,
      new Date().toISOString(),
      userId
    ).run();

    return tokens.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

app.get("/api/calendar/events", authMiddleware, async (c) => {
  const user = c.get("user");
  const from = c.req.query("from");
  const to = c.req.query("to");

  const accessToken = await refreshCalendarToken(c.env, user!.id);

  if (!accessToken) {
    return c.json({ error: "Calendar not connected" }, 401);
  }

  try {
    const timeMin = from || new Date().toISOString();
    const timeMax = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      throw new Error("Failed to fetch calendar events");
    }

    const data = await calendarResponse.json() as any;

    const events = data.items.map((item: any) => ({
      id: item.id,
      title: item.summary || "Untitled Event",
      start_time: item.start.dateTime || item.start.date,
      end_time: item.end.dateTime || item.end.date,
      location: item.location,
      description: item.description,
      color: item.colorId,
      attendees: item.attendees?.map((a: any) => a.email) || [],
      is_all_day: !item.start.dateTime,
    }));

    return c.json({ events });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return c.json({ error: "Failed to fetch calendar events" }, 500);
  }
});

// Recurring tasks processing endpoint (admin only for security)
app.post("/api/admin/process-recurring-tasks", adminMiddleware, async (c) => {
  const result = await processRecurringTasks(c.env.DB);
  return c.json(result);
});

// User endpoint to manually process their recurring tasks
app.post("/api/recurring-tasks/process", authMiddleware, async (c) => {
  const user = c.get("user");
  const today = new Date().toISOString().split('T')[0];

  try {
    // Find user's recurring tasks that need processing
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM tasks 
      WHERE user_id = ?
        AND \`repeat\` != 'none' 
        AND next_occurrence_date IS NOT NULL 
        AND next_occurrence_date <= ?
        AND parent_recurring_task_id IS NULL
    `).bind(user!.id, today).all();

    let created = 0;

    for (const task of results as any[]) {
      // Create new task instance
      const newDueDate = task.next_occurrence_date;

      await c.env.DB.prepare(`
        INSERT INTO tasks (
          user_id, title, description, priority, estimated_minutes, 
          project, tags, status, due_date, parent_recurring_task_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?)
      `).bind(
        task.user_id,
        task.title,
        task.description,
        task.priority,
        task.estimated_minutes,
        task.project,
        task.tags,
        newDueDate,
        task.id
      ).run();

      created++;

      // Calculate and update next occurrence
      const nextOccurrence = calculateNextOccurrence(
        newDueDate,
        task.repeat,
        task.repeat_detail
      );

      await c.env.DB.prepare(`
        UPDATE tasks 
        SET next_occurrence_date = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        nextOccurrence,
        new Date().toISOString(),
        task.id
      ).run();
    }

    return c.json({ success: true, created });
  } catch (error) {
    console.error("Error processing recurring tasks:", error);
    return c.json({ error: "Failed to process recurring tasks" }, 500);
  }
});

// Export tasks as CSV
app.get("/api/export/tasks", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user!.id).all();

  // Generate CSV
  const headers = ["ID", "Title", "Description", "Status", "Priority", "Estimated (min)", "Actual (min)", "Completed", "Project", "Due Date", "Tags", "Created", "Updated"];
  const rows = (results as any[]).map(row => [
    row.id,
    row.title,
    row.description || "",
    row.status,
    row.priority,
    row.estimated_minutes || "",
    row.actual_minutes || "",
    row.is_completed ? "Yes" : "No",
    row.project || "",
    row.due_date || "",
    row.tags || "",
    row.created_at,
    row.updated_at,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="focusflow-tasks-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

// Helper function to merge contiguous sessions
async function mergeContiguousSessions(db: D1Database, userId: string, taskId: number) {
  // Get all completed focus sessions for this task, ordered by start time
  const { results: sessions } = await db.prepare(`
    SELECT * FROM focus_sessions 
    WHERE user_id = ? AND task_id = ? AND session_type = 'focus' AND end_time IS NOT NULL 
    ORDER BY start_time ASC
  `).bind(userId, taskId).all();

  if (sessions.length < 2) return;

  const sessionList = sessions as any[];
  const toMerge: any[][] = [];
  let currentGroup = [sessionList[0]];

  // Group contiguous sessions (gap < 90 seconds)
  for (let i = 1; i < sessionList.length; i++) {
    const prev = sessionList[i - 1];
    const current = sessionList[i];

    const prevEnd = new Date(prev.end_time).getTime();
    const currentStart = new Date(current.start_time).getTime();
    const gap = currentStart - prevEnd;

    if (gap < 90000) { // 90 seconds in milliseconds
      currentGroup.push(current);
    } else {
      if (currentGroup.length > 1) {
        toMerge.push([...currentGroup]);
      }
      currentGroup = [current];
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 1) {
    toMerge.push(currentGroup);
  }

  // Merge each group
  for (const group of toMerge) {
    const firstSession = group[0];
    const lastSession = group[group.length - 1];
    const totalDuration = group.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Collect all notes
    const allNotes = group.map(s => s.notes).filter(Boolean).join(' | ');

    // Update the first session with merged data
    await db.prepare(`
      UPDATE focus_sessions 
      SET end_time = ?, duration_minutes = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      lastSession.end_time,
      totalDuration,
      allNotes || null,
      new Date().toISOString(),
      firstSession.id
    ).run();

    // Delete the other sessions in the group
    for (let i = 1; i < group.length; i++) {
      await db.prepare("DELETE FROM focus_sessions WHERE id = ?")
        .bind(group[i].id)
        .run();
    }
  }
}

// Helper function to update task actual time
async function updateTaskActualTime(db: D1Database, taskId: number) {
  // Calculate total focus time for this task
  const { results } = await db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
    FROM focus_sessions 
    WHERE task_id = ? AND session_type = 'focus' AND end_time IS NOT NULL
  `).bind(taskId).all();

  const totalMinutes = (results[0] as any).total_minutes;

  // Update the task's actual_minutes
  await db.prepare(`
    UPDATE tasks 
    SET actual_minutes = ?, updated_at = ?
    WHERE id = ?
  `).bind(totalMinutes, new Date().toISOString(), taskId).run();
}

// Helper function to sync completed task to Notion (if enabled)
async function syncToNotionIfEnabled(db: D1Database, userId: string, task: any) {
  // Check if Notion sync is enabled for this user
  const { results } = await db.prepare(
    "SELECT notion_sync_enabled, notion_database_id, notion_access_token FROM user_settings WHERE user_id = ?"
  ).bind(userId).all();

  if (results.length === 0) return;

  const settings = results[0] as any;

  if (settings.notion_sync_enabled === 1 && settings.notion_database_id && settings.notion_access_token) {
    console.log("📝 [Notion Sync] Starting sync for task:", task.id);

    try {
      const result = await syncTaskToNotion(task, settings.notion_access_token, settings.notion_database_id);

      if (result.success) {
        console.log("✅ [Notion Sync] Successfully synced task to Notion:", task.title);
      } else {
        console.error("❌ [Notion Sync] Failed to sync task:", result.message);
      }
    } catch (error) {
      console.error("❌ [Notion Sync] Error during sync:", error);
    }
  }
}

// Helper function to integrate with Systeme.io
async function integrateWithSystemeIO(apiKey: string, signupData: any) {
  // Build tags array with source information
  const tags = ["focusflow-waitlist", signupData.source].filter(Boolean);

  // Add UTM data as tags if available
  if (signupData.utm_data?.source) tags.push(`utm_source:${signupData.utm_data.source}`);
  if (signupData.utm_data?.medium) tags.push(`utm_medium:${signupData.utm_data.medium}`);
  if (signupData.utm_data?.campaign) tags.push(`utm_campaign:${signupData.utm_data.campaign}`);

  const payload = {
    email: signupData.email,
    first_name: signupData.name || "",
    tags: tags
  };

  console.log("📦 [Systeme.io] Sending payload:", JSON.stringify(payload, null, 2));
  console.log("🔑 [Systeme.io] Using API key:", apiKey.substring(0, 10) + "...");

  const response = await fetch("https://api.systeme.io/api/contacts", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log("📥 [Systeme.io] Response status:", response.status);
  console.log("📥 [Systeme.io] Response body:", responseText);

  if (!response.ok) {
    // Try to parse error response
    let errorDetails = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      errorDetails = JSON.stringify(errorJson, null, 2);
    } catch (e) {
      // Keep as text
    }
    throw new Error(`Systeme.io API error: ${response.status} - ${errorDetails}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return { success: true, raw: responseText };
  }
}



// Payment helper functions removed - payment system disabled

export default app;
