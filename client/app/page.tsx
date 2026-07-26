import Link from "next/link";

const portals = [
  {
    title: "Faculty Login",
    href: "/auth/faculty/login"
  },
  {
    title: "Student Login",
    href: "/auth/student/login"
  },
  {
    title: "Admin Login",
    href: "/auth/admin/login"
  }
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-kec-sidebar">
      <img
        src="/kec.jpeg"
        alt="Kongu Engineering College campus"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/10" />

      <section className="relative z-10 grid min-h-screen lg:grid-cols-[1fr_620px]">
        <div className="flex min-h-[36vh] items-end px-5 py-8 sm:px-10 lg:min-h-screen">
          <div className="max-w-2xl text-white drop-shadow">
            <h1 className="text-2xl font-light uppercase leading-tight tracking-wide sm:text-4xl lg:text-5xl">
              Kongu Engineering College
            </h1>
            <p className="mt-2 text-xl font-light uppercase tracking-wide sm:text-3xl">
              (Autonomous)
            </p>
          </div>
        </div>

        <aside className="flex min-h-[64vh] flex-col justify-center bg-white/55 px-5 py-8 backdrop-blur-[1px] sm:px-10 lg:min-h-screen lg:px-12">
          <div className="mx-auto w-full max-w-[520px]">
            <div className="mb-8 flex justify-center sm:mb-16">
              <img
                src="/logo.png"
                alt="Kongu Engineering College"
                className="h-20 w-auto object-contain sm:h-28"
              />
            </div>

            <div className="space-y-4 sm:space-y-6">
              {portals.map((portal) => (
                <Link
                  key={portal.href}
                  href={portal.href}
                  className="block border border-gray-300 bg-white px-5 py-5 text-2xl font-light text-[#333333] shadow-sm transition hover:border-kec-purple hover:text-kec-purple focus:outline-none focus:ring-4 focus:ring-kec-purple/20 sm:px-7 sm:py-8 sm:text-3xl"
                >
                  {portal.title}
                </Link>
              ))}
            </div>

            <p className="mt-10 text-center text-xs text-kec-secondary sm:mt-28">
              Powered by KEC Coding Forum
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
