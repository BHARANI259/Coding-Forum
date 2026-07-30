"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DataTable from "@/components/ui/DataTable";
import {
  DashboardActionPanel,
  DashboardMetricStrip,
  DashboardQuickAccess,
  DashboardWelcomeCard,
  InlineActionCard,
  type DashboardTile
} from "@/components/dashboard/DashboardHomeBlocks";
import { getMyPointHistory, getMyRegistrations, getMyStatistics, getMyTeams, getStudentEvents, getUnreadNotificationCount, type EventItem, type MyRegistration, type StudentPointHistory, type StudentStatistics, type TeamDetail } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
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
  const user = getCurrentUser();
  const quickAccess: DashboardTile[] = [
    { title: "Events", description: "Browse and register", href: "/student/events", icon: "calendar" },
    { title: "My Registrations", description: "Your enrolled events", href: "/student/registrations", icon: "document" },
    { title: "My Teams", description: "Team codes and members", href: "/student/teams", icon: "group" },
    { title: "Results", description: "Rounds and points", href: "/student/results", icon: "results" },
    { title: "Leaderboard", description: "Rankings", href: "/student/leaderboard", icon: "leaderboard" },
    { title: "Notifications", description: "Forum updates", href: "/student/notifications", icon: "notification", badge: unreadCount },
    { title: "Profile", description: "Personal details", href: "/student/profile", icon: "profile" }
  ];

  return (
    <AppShell expectedRole="STUDENT" title="Student Dashboard">
      <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-kec-purple">Home</p>
        <h1 className="mt-1 text-3xl font-black text-kec-text">Student Dashboard</h1>
        <p className="mt-1 text-sm text-kec-secondary">Your coding forum activity, registrations, teams, and points in one place.</p>
      </div>
      {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <DashboardWelcomeCard
        roleLabel="Student"
        name={user?.name ?? "Student"}
        email={user?.email ?? ""}
        href="/student/profile"
        summary={`${stats?.totalPoints ?? 0} points earned across ${stats?.totalEventsRegistered ?? 0} registered event${(stats?.totalEventsRegistered ?? 0) === 1 ? "" : "s"}.`}
      />

      <DashboardQuickAccess title="Quick Access" subtitle="Open the most-used student sections quickly." tiles={quickAccess} />

      <DashboardActionPanel title="Applications & Registrations" subtitle="Current actions that may need your attention.">
        <div className="grid gap-4 lg:grid-cols-2">
          <InlineActionCard
            title={openEvent ? "Registration Available" : "Event Registration"}
            description={openEvent ? `${openEvent.title} is open for registration.` : "No new eligible event is open right now."}
            href={openEvent ? `/student/events/${openEvent.id}?action=register` : "/student/events"}
            action={openEvent ? "View Event" : "Browse Events"}
          />
          <InlineActionCard
            title="Team Readiness"
            description={incompleteTeam ? `${incompleteTeam.teamName}: ${incompleteTeam.members.length} of ${incompleteTeam.event.minTeamSize ?? 1} minimum members joined.` : "You have no incomplete team waiting for members."}
            href="/student/teams"
            action="View My Teams"
          />
        </div>
      </DashboardActionPanel>

      <DashboardMetricStrip
        items={[
          { label: "Total Points", value: stats?.totalPoints ?? 0, hint: "From declared results" },
          { label: "Events Participated", value: stats?.totalEventsRegistered ?? 0, hint: "Registered events" },
          { label: "Wins", value: stats?.winsCount ?? 0, hint: "Winner tags" },
          { label: "Runner-ups", value: stats?.runnerUpCount ?? 0, hint: "Runner-up tags" },
          { label: "Participation Count", value: stats?.participationCount ?? 0, hint: "Participation points" }
        ]}
      />

      <DashboardActionPanel title="Recent Point History" subtitle="Latest points credited to your profile.">
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
      </DashboardActionPanel>
      </div>
    </AppShell>
  );
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
