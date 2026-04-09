import { redirect } from "next/navigation"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { TrackingManageClient } from "@/components/platform/tracking-manage-client"

export default async function TrackingManagePage() {
  const auth = await getAuthProfile()
  if (!auth || !isAdmin(auth.profile)) {
    redirect("/tracking")
  }
  return <TrackingManageClient />
}
