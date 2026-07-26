"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getMyPointHistory, getMyRegistrations, getMyStatistics, getMyTeams, getStudentEvents, getUnreadNotificationCount, type EventItem, type MyRegistration, type StudentPointHistory, type StudentStatistics, type TeamDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";

export default function StudentDashboardShell() {
  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [history, setHistory] = useState<StudentPointHistory[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
          getMyStatistics(),
          getMyPointHistory({ size: 5 }),
          getStudentEvents(),
          getMyRegistrations(),
          getMyTeams(),
          getUnreadNotificationCount()
      ]);
      const [statistics, pointHistory, eventList, registrationList, teamList, unread] = results;
      if (statistics.status === "fulfilled") setStats(statistics.value);
      if (pointHistory.status === "fulfilled") setHistory(pointHistory.value.content);
      if (eventList.status === "fulfilled") setEvents(eventList.value);
      if (registrationList.status === "fulfilled") setRegistrations(registrationList.value);
      if (teamList.status === "fulfilled") setTeams(teamList.value);
      if (unread.status === "fulfilled") setUnreadCount(unread.value.count);
      if (results.every((result) => result.status === "rejected")) setError("Unable to load dashboard data. Please try again.");
    }
    void load();
  }, []);

  const registeredEventIds = new Set(registrations.filter((item) => item.status === "REGISTERED").map((item) => item.eventId));
  const openEvent = events.find((item) => item.status === "PUBLISHED" && item.registrationOpen && !registeredEventIds.has(item.id));
  const incompleteTeam = teams.find((item) => !item.lockedAfterRegistration && item.members.length < (item.event.minTeamSize ?? 1));

  return (
    <AppShell expectedRole="STUDENT" title="Student Dashboard">
      <PageHeader
        title="Student Dashboard"
        subtitle="Overview of your coding forum activity."
      />
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Points" value={stats?.totalPoints ?? 0} hint="From declared results" />
        <StatCard label="Events Participated" value={stats?.totalEventsRegistered ?? 0} hint="Registered events" />
        <StatCard label="Wins" value={stats?.winsCount ?? 0} hint="Winner tags" />
        <StatCard label="Runner-ups" value={stats?.runnerUpCount ?? 0} hint="Runner-up tags" />
        <StatCard label="Participation Count" value={stats?.participationCount ?? 0} hint="Participation points" />
      </div>
      <section className="mt-6 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-kec-text">Your Next Actions</h2>
          <p className="text-sm text-kec-secondary">The most useful things to check now.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ActionCard
            title={openEvent ? "Registration Available" : "Event Registration"}
            description={openEvent ? `${openEvent.title} is open for registration.` : "No new eligible event is open right now."}
            href={openEvent ? `/student/events/${openEvent.id}?action=register` : "/student/events"}
            action={openEvent ? "View Event" : "Browse Events"}
          />
          <ActionCard
            title="Team Readiness"
            description={incompleteTeam ? `${incompleteTeam.teamName}: ${incompleteTeam.members.length} of ${incompleteTeam.event.minTeamSize ?? 1} minimum members joined.` : "You have no incomplete team waiting for members."}
            href="/student/teams"
            action="View My Teams"
          />
          <ActionCard title="Results and Progress" description="Check published round progress and final event results." href="/student/results" action="View Results" />
          <ActionCard title="Notifications" description={unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.` : "You are up to date."} href="/student/notifications" action="Open Notifications" />
          <ActionCard title="Leaderboard" description="See your college and department position and learn how points are awarded." href="/student/leaderboard" action="View Rankings" />
        </div>
      </section>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-bold text-kec-text">Recent Point History</h2>
        <DataTable
          headers={["Event", "Category", "Type", "Points", "Date"]}
          rows={history.map((item) => [
            item.eventTitle,
            item.categoryName,
            humanize(item.pointType),
            item.points,
            formatDateTime(item.createdAt)
          ])}
          emptyMessage="No point history yet."
        />
      </div>
    </AppShell>
  );
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ActionCard({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <Card className="flex min-h-40 flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-kec-text">{title}</h3>
        <p className="mt-2 text-sm text-kec-secondary">{description}</p>
      </div>
      <Link className="mt-4" href={href}><Button className="w-full" type="button" variant="secondary">{action}</Button></Link>
    </Card>
  );
}
