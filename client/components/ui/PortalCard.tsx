import Link from "next/link";

type PortalCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function PortalCard({ title, description, href }: PortalCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-kec-border bg-white p-5 transition hover:border-kec-purple hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-kec-purple/20"
    >
      <span className="block text-base font-bold text-kec-text">{title}</span>
      <span className="mt-1 block text-sm text-kec-secondary">{description}</span>
    </Link>
  );
}
