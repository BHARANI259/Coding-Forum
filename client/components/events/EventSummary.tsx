import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EventPosterPreview from "@/components/events/EventPosterPreview";
import type { EventDetail, EventItem } from "@/lib/api";

type EventSummaryProps = {
  event: EventItem | EventDetail;
};

export default function EventSummary({ event }: EventSummaryProps) {
  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <EventPosterPreview
          posterImageUrl={event.posterImageUrl}
          title={event.title}
          className="min-h-[320px] lg:min-h-full"
          imageClassName="min-h-[320px] lg:min-h-full"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-kec-text">{event.title}</h2>
              <p className="mt-1 text-sm text-kec-secondary">{event.category?.name ?? "Uncategorized"} - {event.venue ?? "Venue not set"}</p>
              {event.posterOriginalName ? (
                <p className="mt-2 text-xs font-semibold text-kec-muted">Poster: {event.posterOriginalName}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="purple">{event.eventType}</Badge>
              <Badge variant={event.registrationOpen ? "success" : "warning"}>{event.registrationOpen ? "Registration Open" : "Registration Closed"}</Badge>
              <Badge variant={event.resultsPublished ? "success" : "default"}>{event.resultsPublished ? "Results Published" : "Results Pending"}</Badge>
              <Badge variant={event.status === "CANCELLED" ? "error" : "info"}>{event.status}</Badge>
            </div>
          </div>

          {"description" in event && event.description ? (
            <div className="mt-5 rounded-xl border border-kec-border bg-kec-bg px-4 py-3">
              <p className="text-xs font-semibold uppercase text-kec-muted">Description</p>
              <p className="mt-2 text-sm leading-6 text-kec-text">{event.description}</p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <Info label="Start" value={formatDate(event.startDatetime)} />
            <Info label="End" value={formatDate(event.endDatetime)} />
            <Info label="Registration Start" value={formatDate(event.registrationStart)} />
            <Info label="Registration End" value={formatDate(event.registrationEnd)} />
            <Info label="Max Participants" value={event.maxParticipants ?? "No limit"} />
            <Info label="Team Size" value={event.eventType === "TEAM" ? `${event.minTeamSize ?? "-"} - ${event.maxTeamSize ?? "-"}` : "Individual"} />
            <Info label="Max Teams" value={event.maxTeams ?? "No limit"} />
            <Info label="Placement Willing Only" value={event.placementWillingOnly ? "Yes" : "No"} />
            <Info label="Rounds" value={event.roundsCount} />
            <Info label="Problem Statements" value={event.problemStatementCount} />
          </div>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <Info label="Allowed Departments" value={event.allowedDepartments.map((item) => item.label).join(", ") || "All departments"} />
            <Info label="Allowed Years" value={event.allowedYears.join(", ") || "All years"} />
            <Info label="Allowed Sections" value={event.allowedSections.join(", ") || "All sections"} />
            <Info label="Allowed Technical Areas" value={event.allowedTechnicalAreas.join(", ") || "SOFTWARE, HARDWARE"} />
            <div className="sm:col-span-2">
              <Info label="Incharges" value={event.incharges.map((item) => `${item.label}${item.secondaryLabel ? ` (${item.secondaryLabel})` : ""}`).join(", ") || "No incharges assigned"} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-semibold text-kec-secondary">{label}</p>
      <p className="mt-1 text-kec-text">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }
  return new Date(value).toLocaleString();
}
