import { redirect } from "next/navigation"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { BillingOverviewClient } from "@/components/platform/billing-overview-client"

export default async function BillingPage() {
  const auth = await getAuthProfile()
  if (!auth || !isAdmin(auth.profile)) {
    redirect("/dashboard")
  }
  return <BillingOverviewClient />
}
