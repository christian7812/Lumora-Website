import { createHash } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "../lib/auth.js";
import { db } from "../db/db.js";
import { user } from "../schema/schema.js";
import { authArcjetMiddleware } from "../lib/arcjet.js";

export const authRouter = Router();

const AVATAR_UPLOAD_FOLDER = "cruiser-store/avatars";

// Curated high-resolution preset avatars for instant selection
export const PRESET_AVATARS = [
  {
    id: "preset-1",
    name: "Golden Chic",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=GoldenChic&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    id: "preset-2",
    name: "Urban Explorer",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=UrbanExplorer&backgroundColor=b6e3f4,c0aede",
  },
  {
    id: "preset-3",
    name: "Cosmic Shopper",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CosmicShopper&backgroundColor=d1d4f9,c0aede",
  },
  {
    id: "preset-4",
    name: "Modern Minimalist",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=ModernMinimalist&backgroundColor=ffdfbf,ffd5dc",
  },
  {
    id: "preset-5",
    name: "Creative Visionary",
    url: "https://api.dicebear.com/7.x/micah/svg?seed=CreativeVisionary&backgroundColor=d1d4f9,ffd5dc",
  },
  {
    id: "preset-6",
    name: "Cyber Nomad",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberNomad&backgroundColor=b6e3f4,d1d4f9",
  },
  {
    id: "preset-7",
    name: "Elegance Lux",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=EleganceLux&backgroundColor=c0aede,ffd5dc",
  },
  {
    id: "preset-8",
    name: "Sunset Adventurer",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=SunsetAdventurer&backgroundColor=ffd5dc,ffdfbf",
  },
];

export function getDefaultAvatar(name: string, email: string): string {
  const seed = encodeURIComponent(name?.trim() || email?.trim() || "LumoraUser");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=facc15&textColor=000000&fontWeight=700`;
}

export function formatUserProfile(userData: {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: Date;
}) {
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || "christiancruiseratsagba@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

  const cleanName = userData.name?.trim() || "Lumora Shopper";
  const nameParts = cleanName.split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "";
  const avatarUrl = userData.image?.trim() || getDefaultAvatar(cleanName, userData.email);
  const isAdmin = adminEmails.has(userData.email.trim().toLowerCase());

  return {
    id: userData.id,
    name: cleanName,
    fullName: cleanName,
    firstName,
    lastName,
    email: userData.email,
    emailVerified: Boolean(userData.emailVerified),
    image: avatarUrl,
    avatar: avatarUrl,
    role: isAdmin ? "admin" : "customer",
    isAdmin,
    createdAt: userData.createdAt ?? new Date(),
  };
}

/**
 * GET /api/auth/presets
 * List curated avatar presets that any user can pick from.
 */
authRouter.get("/presets", (_req: Request, res: Response) => {
  res.json({ presets: PRESET_AVATARS });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile, formatted with avatar, fullName, role.
 */
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const currentUser = dbUser || session.user;
    res.json(formatUserProfile(currentUser));
  } catch (error) {
    console.error("Failed to fetch /auth/me:", error);
    res.status(500).json({ message: "Could not load user profile." });
  }
});

const avatarSchema = z.object({
  avatar: z.string().trim().min(1, "Avatar URL is required"),
});

/**
 * PATCH /api/auth/avatar
 * Update authenticated user's avatar image URL.
 */
authRouter.patch("/avatar", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ message: "Sign in to update your avatar." });
      return;
    }

    const bodyToValidate = {
      avatar: req.body?.avatar || req.body?.image || req.body?.avatarUrl,
    };
    const parsed = avatarSchema.safeParse(bodyToValidate);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message || "Invalid avatar URL.",
      });
      return;
    }

    const newAvatarUrl = parsed.data.avatar;

    const [updated] = await db
      .update(user)
      .set({
        image: newAvatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    res.json({
      message: "Avatar updated successfully.",
      user: formatUserProfile(updated || { ...session.user, image: newAvatarUrl }),
    });
  } catch (error) {
    console.error("Failed to update avatar:", error);
    res.status(500).json({ message: "Could not update avatar." });
  }
});

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  avatar: z.string().trim().optional(),
});

/**
 * PATCH /api/auth/profile
 * Update authenticated user's display name and/or avatar.
 */
authRouter.patch("/profile", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ message: "Sign in to update your profile." });
      return;
    }

    const body = {
      name: req.body?.name,
      avatar: req.body?.avatar || req.body?.image,
    };
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message || "Invalid profile data.",
      });
      return;
    }

    const updates: { name?: string; image?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.avatar) updates.image = parsed.data.avatar;

    const [updated] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, session.user.id))
      .returning();

    res.json({
      message: "Profile updated successfully.",
      user: formatUserProfile(updated || { ...session.user, ...updates }),
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ message: "Could not update profile." });
  }
});

/**
 * POST /api/auth/avatar-upload-signature
 * Generates Cloudinary signature for secure direct avatar uploads by authenticated users.
 */
authRouter.post("/avatar-upload-signature", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ message: "Sign in to upload an avatar." });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(503).json({
        message: "Cloudinary image uploads are not configured on the server.",
      });
      return;
    }

    res.setHeader("Cache-Control", "no-store");

    const paramsToSign = req.body?.paramsToSign ?? req.body?.params_to_sign;

    if (!paramsToSign) {
      res.json({ cloudName, apiKey, folder: AVATAR_UPLOAD_FOLDER });
      return;
    }

    if (typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
      res.status(400).json({ message: "Invalid upload parameters." });
      return;
    }

    if (paramsToSign.folder && paramsToSign.folder !== AVATAR_UPLOAD_FOLDER) {
      res.status(400).json({ message: "Invalid upload folder." });
      return;
    }

    const signatureBase = Object.entries(paramsToSign)
      .filter(
        ([key, value]) =>
          key !== "file" &&
          key !== "cloud_name" &&
          key !== "resource_type" &&
          key !== "api_key" &&
          value !== undefined &&
          value !== null &&
          value !== "",
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(",") : value}`)
      .join("&");

    const signature = createHash("sha1")
      .update(signatureBase + apiSecret)
      .digest("hex");

    res.json({
      signature,
      apiKey,
      timestamp: paramsToSign.timestamp,
      folder: AVATAR_UPLOAD_FOLDER,
    });
  } catch (error) {
    console.error("Avatar upload signature error:", error);
    res.status(500).json({ message: "Could not generate upload signature." });
  }
});

/**
 * Fallback to Better-Auth handler for all standard auth routes:
 * /sign-in/email, /sign-up/email, /sign-out, /get-session, etc.
 */
authRouter.all(["/", "/{*splat}"], authArcjetMiddleware, toNodeHandler(auth));

export default authRouter;
