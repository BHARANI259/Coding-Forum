import type { UserRole } from "./api";

export type NavItem = {
  label: string;
  href: string;
  group?: string;
};

export const roleNavigation: Record<UserRole, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Events", href: "/student/events" },
    { label: "My Registrations", href: "/student/registrations" },
    { label: "My Teams", href: "/student/teams" },
    { label: "Leaderboard", href: "/student/leaderboard" },
    { label: "Results", href: "/student/results" },
    { label: "Notifications", href: "/student/notifications" },
    { label: "Profile", href: "/student/profile" }
  ],
  FACULTY: [
    { label: "Dashboard", href: "/faculty/dashboard" },
    { label: "Assigned Events", href: "/faculty/events" },
    { label: "Results", href: "/faculty/results" },
    { label: "Department Monitoring", href: "/faculty/department-monitoring" },
    { label: "Reports", href: "/faculty/reports" },
    { label: "Notifications", href: "/faculty/notifications" },
    { label: "Profile", href: "/faculty/profile" }
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", group: "Overview" },
    { label: "Events", href: "/admin/events", group: "Event Setup" },
    { label: "Categories", href: "/admin/categories", group: "Event Setup" },
    { label: "Event Incharges", href: "/admin/event-incharges", group: "Event Setup" },
    { label: "Departments", href: "/admin/departments", group: "People" },
    { label: "Students", href: "/admin/students", group: "People" },
    { label: "Faculty", href: "/admin/faculty", group: "People" },
    { label: "Leaderboard", href: "/admin/leaderboard", group: "Performance" },
    { label: "Analytics", href: "/admin/analytics", group: "Performance" },
    { label: "Reports", href: "/admin/reports", group: "Performance" },
    { label: "Notifications", href: "/admin/notifications", group: "Communication" }
  ]
};

export function roleDisplayName(role: UserRole) {
  if (role === "SUPER_ADMIN") {
    return "SuperAdmin";
  }
  return role.charAt(0) + role.slice(1).toLowerCase();
}
