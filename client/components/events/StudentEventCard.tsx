"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EventPosterPreview from "@/components/events/EventPosterPreview";
import { formatDateTime } from "@/lib/dateFormat";
import { getEventRegistrationState } from "@/lib/eventRegistration";
import type { EventItem } from "@/lib/api";

type StudentEventCardProps = {
  event: EventItem;
  registered: boolean;
};

export default function StudentEventCard({ event, registered }: StudentEventCardProps) {
  const registrationState = getEventRegistrationState(event);
  const inchargeText = event.incharges.map((item) => item.label).join(", ") || "Faculty incharge not assigned";

  return (
    <Card className="overflow-hidden p-0">
      <EventPosterPreview posterImageUrl={event.posterImageUrl} title={event.title} className="aspect-video rounded-b-none border-0" />
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="purple">{event.category?.name ?? "Uncategorized"}</Badge>
          <Badge variant="info">{formatLabel(event.eventType)}</Badge>
          <Badge variant={registrationState.badgeVariant}>{registrationState.label}</Badge>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-bold text-kec-text">{event.title}</h2>
        <div className="mt-4 space-y-2 break-words text-sm text-kec-secondary">
          <p><span className="font-semibold text-kec-text">Incharge:</span> {inchargeText}</p>
          <p><span className="font-semibold text-kec-text">Date:</span> {formatDate(event.startDatetime)}</p>
          <p><span className="font-semibold text-kec-text">Registration:</span> {formatDate(event.registrationStart)} to {formatDate(event.registrationEnd)}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href={`/student/events/${event.id}`} className="w-full"><Button type="button" variant="secondary" className="w-full">View</Button></Link>
          <Link href={`/student/events/${event.id}?action=register`} className="w-full">
            <Button type="button" className="w-full" disabled={registered || !registrationState.available}>
              {registered ? "Registered" : registrationState.available ? "Register" : registrationState.label}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function formatDate(value: string | null) {
  return formatDateTime(value, "Not set");
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
