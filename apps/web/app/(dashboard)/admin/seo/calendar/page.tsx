import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminSeoCalendarPage() {
  return (
    <PortalRoutePlaceholder
      specId="SEO-03"
      title="Content calendar"
      description="Schedule approved SEO variants across channels."
      parentHref="/admin/seo"
      parentLabel="SEO panel"
    >
      Posting schedules use the PostingSchedule model and workers. Approve variants in the queue first;
      calendar UI connects when scheduler jobs are enabled in staging.
    </PortalRoutePlaceholder>
  )
}
