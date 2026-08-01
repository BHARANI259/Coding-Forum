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
    <Card className="overflow-hidden p-0 transition sm:hover:-translate-y-0.5 sm:hover:shadow-md">
      <EventPosterPreview posterImageUrl={event.posterImageUrl} title={event.title} className="aspect-video rounded-b-none border-0" />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge variant="purple">{event.category?.name ?? "Uncategorized"}</Badge>
          {event.mandatoryEvent ? <Badge variant="warning">Mandatory</Badge> : null}
          <Badge variant="info">{formatLabel(event.eventType)}</Badge>
          <Badge variant={registrationState.badgeVariant}>{registrationState.label}</Badge>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-black leading-6 text-kec-text">{event.title}</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 text-sm">
          <InfoRow label="Incharge" value={inchargeText} />
          <InfoRow label="Date" value={formatDate(event.startDatetime)} />
          <InfoRow label="Registration" value={`${formatDate(event.registrationStart)} to ${formatDate(event.registrationEnd)}`} />
        </div>
        <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="grid grid-cols-[96px_1fr] gap-3 px-3 py-2.5">
      <span className="font-bold text-kec-muted">{label}</span>
      <span className="min-w-0 break-words font-medium text-kec-text">{value}</span>
    </p>
  );
}

function formatDate(value: string | null) {
  return formatDateTime(value, "Not set");
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
