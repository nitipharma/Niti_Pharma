import { NextResponse } from "next/server"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

export async function GET() {
  const auth = await getAuthProfile()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({
    id: auth.user.id,
    role: auth.profile.role,
    customerId: auth.profile.customerId,
    isAdmin: isAdmin(auth.profile),
  })
}
