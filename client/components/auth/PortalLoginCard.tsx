import PortalCard from "@/components/ui/PortalCard";

const portals = [
  {
    title: "Student Login",
    description: "Event registration and performance access",
    href: "/auth/student/login"
  },
  {
    title: "Faculty Login",
    description: "Assigned event and department access",
    href: "/auth/faculty/login"
  },
  {
    title: "Admin Login",
    description: "Institutional administration access",
    href: "/auth/admin/login"
  }
];

export default function PortalLoginCard() {
  return (
    <div className="rounded-xl border border-kec-border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-kec-purple">
        Kongu Engineering College
      </p>
      <h1 className="mt-2 text-3xl font-bold text-kec-text">Coding Forum</h1>
      <p className="mt-2 text-sm text-kec-secondary">
        Event Registration and Student Performance Portal
      </p>
      <div className="mt-7 grid gap-4">
        {portals.map((portal) => (
          <PortalCard key={portal.href} {...portal} />
        ))}
      </div>
    </div>
  );
}
