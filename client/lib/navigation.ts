import type { UserRole } from "./api";

export type NavItem = {
  label: string;
  href: string;
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
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Events", href: "/admin/events" },
    { label: "Categories", href: "/admin/categories" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Students", href: "/admin/students" },
    { label: "Faculty", href: "/admin/faculty" },
    { label: "Event Incharges", href: "/admin/event-incharges" },
    { label: "Leaderboard", href: "/admin/leaderboard" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Notifications", href: "/admin/notifications" },
    { label: "Analytics", href: "/admin/analytics" }
  ]
};

export function roleDisplayName(role: UserRole) {
  if (role === "SUPER_ADMIN") {
    return "SuperAdmin";
  }
  return role.charAt(0) + role.slice(1).toLowerCase();
}
