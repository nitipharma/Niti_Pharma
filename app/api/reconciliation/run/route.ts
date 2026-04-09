import { NextResponse } from "next/server"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { reconcileAll } from "@/lib/reconciliation"

export const runtime = "nodejs"

export async function POST() {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(auth.profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await reconcileAll()
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Reconciliation failed" },
      { status: 500 }
    )
  }
}
