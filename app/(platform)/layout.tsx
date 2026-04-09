import { DemoEnvironmentBanner } from "@/components/demo-environment-banner"

export default function PlatformDemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="print:hidden">
        <DemoEnvironmentBanner />
      </div>
      {children}
    </>
  )
}
