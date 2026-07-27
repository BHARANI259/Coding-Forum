import Link from "next/link";

const portals = [
  {
    title: "Student",
    subtitle: "Register, track teams, and view results",
    href: "/auth/student/login",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3 2 8l10 5 10-5-10-5Z" />
        <path d="M6 10.2V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.8" />
        <path d="M20 9v5" />
      </svg>
    )
  },
  {
    title: "Faculty",
    subtitle: "Manage assigned events and rounds",
    href: "/auth/faculty/login",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
        <path d="M18 5.5h3" />
        <path d="M19.5 4v3" />
      </svg>
    )
  },
  {
    title: "Admin",
    subtitle: "Configure events, users, and analytics",
    href: "/auth/admin/login",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6l-7-3Z" />
        <path d="M9 12l2 2 4-5" />
      </svg>
    )
  }
];

export default function Home() {
  return (
    <main className="landing-page">
      <img
        src="/kec.jpeg"
        alt="Kongu Engineering College campus"
        className="landing-bg"
      />
      <div className="landing-shade" />

      <section className="landing-content" aria-label="KEC Coding Forum portal selection">
        <div className="landing-brand">
          <img
            src="/logo.png"
            alt="Kongu Engineering College"
            className="landing-logo"
          />
          <h1>KEC Coding Forum</h1>
        </div>

        <div className="landing-role-grid">
          {portals.map((portal, index) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="landing-role-card"
              style={{ animationDelay: `${0.18 + index * 0.08}s` }}
            >
              <span className="landing-role-icon">{portal.icon}</span>
              <span className="landing-role-title">{portal.title}</span>
              <span className="landing-role-subtitle">{portal.subtitle}</span>
              <span className="landing-role-action">Login</span>
            </Link>
          ))}
        </div>

        <p className="landing-footer">Academic Year 2026-27</p>
      </section>
    </main>
  );
}
