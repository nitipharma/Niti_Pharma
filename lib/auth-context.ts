import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { User as DbUser } from "@prisma/client"

export type AuthProfile = DbUser

export async function getSessionUser(): Promise<SupabaseUser | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Ensure a Prisma User row exists for the Supabase user (first login). */
export async function ensureUserRecord(user: SupabaseUser): Promise<AuthProfile> {
  const email = user.email ?? `${user.id}@users.local`
  const existing = await prisma.user.findUnique({ where: { id: user.id } })
  if (existing) return existing
  return prisma.user.create({
    data: {
      id: user.id,
      email,
      role: "customer",
    },
  })
}

export async function getAuthProfile(): Promise<{
  user: SupabaseUser
  profile: AuthProfile
} | null> {
  const user = await getSessionUser()
  if (!user) return null
  const profile = await ensureUserRecord(user)
  return { user, profile }
}

export function isAdmin(profile: AuthProfile): boolean {
  return profile.role === "admin"
}
