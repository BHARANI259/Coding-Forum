"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EventPosterPreview from "@/components/events/EventPosterPreview";
import type { EventItem } from "@/lib/api";

type StudentEventCardProps = {
  event: EventItem;
  registered: boolean;
};

export default function StudentEventCard({ event, registered }: StudentEventCardProps) {
  const registrationClosed = !event.registrationOpen || event.status === "COMPLETED" || event.status === "CANCELLED";
  const registrationLabel = event.status === "COMPLETED" ? "Completed" : event.status === "CANCELLED" ? "Cancelled" : event.registrationOpen ? "Open" : "Closed";
  const registrationBadgeVariant = event.status === "COMPLETED" ? "info" : event.status === "CANCELLED" ? "error" : event.registrationOpen ? "success" : "warning";
  const inchargeText = event.incharges.map((item) => item.label).join(", ") || "Faculty incharge not assigned";

  return (
    <Card className="overflow-hidden p-0">
      <EventPosterPreview posterImageUrl={event.posterImageUrl} title={event.title} className="aspect-video rounded-b-none border-0" />
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="purple">{event.category?.name ?? "Uncategorized"}</Badge>
          <Badge variant="info">{event.eventType}</Badge>
          <Badge variant={registrationBadgeVariant}>{registrationLabel}</Badge>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-bold text-kec-text">{event.title}</h2>
        <div className="mt-4 space-y-2 text-sm text-kec-secondary">
          <p><span className="font-semibold text-kec-text">Incharge:</span> {inchargeText}</p>
          <p><span className="font-semibold text-kec-text">Date:</span> {formatDate(event.startDatetime)}</p>
          <p><span className="font-semibold text-kec-text">Registration:</span> {formatDate(event.registrationStart)} to {formatDate(event.registrationEnd)}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/student/events/${event.id}`}><Button type="button" variant="secondary">View</Button></Link>
          <Link href={`/student/events/${event.id}?action=register`}>
            <Button type="button" disabled={registered || registrationClosed}>
              {registered ? "Registered" : event.status === "COMPLETED" ? "Completed" : registrationClosed ? "Closed" : "Register"}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not set";
}
