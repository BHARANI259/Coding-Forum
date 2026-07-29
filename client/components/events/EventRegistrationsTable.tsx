"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { EventRegistration } from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";

type EventRegistrationsTableProps = {
  registrations: EventRegistration[];
};

type RegistrationGroup = {
  id: string;
  type: "TEAM" | "INDIVIDUAL";
  title: string;
  subtitle: string;
  memberCount: number;
  problem: string;
  status: string;
  registeredAt: string;
  members: EventRegistration[];
};

export default function EventRegistrationsTable({ registrations }: EventRegistrationsTableProps) {
  const groups = useMemo(() => groupRegistrations(registrations), [registrations]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId && group.type === "TEAM") ?? null;

  if (!groups.length) {
    return (
      <Card className="py-10 text-center">
        <p className="text-sm font-semibold text-kec-secondary">No registrations found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="hidden overflow-x-auto sm:block">
          <table className="min-w-[760px] divide-y divide-kec-border text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Header>Team / Participant</Header>
                <Header>Member Count</Header>
                <Header>Problem Statement</Header>
                <Header>Status</Header>
                <Header>Registered At</Header>
              </tr>
            </thead>
            <tbody className="divide-y divide-kec-border bg-white">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  role={group.type === "TEAM" ? "button" : undefined}
                  tabIndex={group.type === "TEAM" ? 0 : undefined}
                  onClick={() => group.type === "TEAM" ? setSelectedGroupId(group.id) : undefined}
                  onKeyDown={(event) => {
                    if (group.type === "TEAM" && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setSelectedGroupId(group.id);
                    }
                  }}
                  className={group.type === "TEAM" ? "cursor-pointer transition hover:bg-kec-bg" : undefined}
                >
                  <Cell>
                    <p className="font-bold text-kec-text">{group.title}</p>
                    <p className="mt-1 text-xs text-kec-secondary">{group.subtitle}</p>
                  </Cell>
                  <Cell>{group.memberCount}</Cell>
                  <Cell>{group.problem}</Cell>
                  <Cell><Badge variant={group.status === "REGISTERED" ? "success" : "warning"}>{humanize(group.status)}</Badge></Cell>
                  <Cell>{group.registeredAt}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 bg-slate-50 p-3 sm:hidden">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              disabled={group.type !== "TEAM"}
              onClick={() => setSelectedGroupId(group.id)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition enabled:hover:border-kec-purple/40 disabled:cursor-default"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base font-black text-kec-text">{group.title}</p>
                  <p className="mt-1 text-xs font-semibold text-kec-secondary">{group.subtitle}</p>
                </div>
                <Badge variant={group.status === "REGISTERED" ? "success" : "warning"}>{humanize(group.status)}</Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <Info label="Members" value={String(group.memberCount)} />
                <Info label="Problem" value={group.problem} />
                <Info label="Registered At" value={group.registeredAt} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {selectedGroup ? (
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-black text-kec-text">{selectedGroup.title} Members</h3>
              <p className="mt-1 text-sm text-kec-secondary">{selectedGroup.problem} · {selectedGroup.registeredAt}</p>
            </div>
            <Badge variant="purple">{selectedGroup.memberCount} members</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {selectedGroup.members.map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-bold text-kec-text">{member.studentName}</p>
                <div className="mt-2 grid gap-2 text-sm text-kec-secondary sm:grid-cols-3">
                  <Info label="Register No" value={member.registerNumber} />
                  <Info label="Department" value={member.departmentCode ?? "-"} />
                  <Info label="Email" value={member.email} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function groupRegistrations(registrations: EventRegistration[]) {
  const teamMap = new Map<number, RegistrationGroup>();
  const groups: RegistrationGroup[] = [];

  for (const registration of registrations) {
    if (registration.registrationType === "TEAM" && registration.teamId) {
      const existing = teamMap.get(registration.teamId);
      if (existing) {
        existing.members.push(registration);
        existing.memberCount = existing.members.length;
        continue;
      }
      const group: RegistrationGroup = {
        id: `team-${registration.teamId}`,
        type: "TEAM",
        title: registration.teamName ?? "Unnamed Team",
        subtitle: registration.teamCode ? `Team code: ${registration.teamCode}` : "Team registration",
        memberCount: 1,
        problem: registration.problemStatementTitle ?? "-",
        status: registration.status,
        registeredAt: formatDateTime(registration.registeredAt),
        members: [registration]
      };
      teamMap.set(registration.teamId, group);
      groups.push(group);
      continue;
    }

    groups.push({
      id: `student-${registration.id}`,
      type: "INDIVIDUAL",
      title: registration.studentName,
      subtitle: registration.registerNumber,
      memberCount: 1,
      problem: registration.problemStatementTitle ?? "-",
      status: registration.status,
      registeredAt: formatDateTime(registration.registeredAt),
      members: [registration]
    });
  }

  return groups;
}

function Header({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-kec-muted">{children}</th>;
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 align-top text-kec-text">{children}</td>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 sm:block">
      <span className="text-xs font-bold uppercase tracking-wide text-kec-muted">{label}</span>
      <span className="min-w-0 break-words text-sm font-medium text-kec-text sm:mt-1 sm:block">{value}</span>
    </div>
  );
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
