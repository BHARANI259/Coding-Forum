type BreadcrumbsProps = {
  title: string;
};

export default function Breadcrumbs({ title }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="hidden text-sm text-kec-secondary sm:block">
      <ol className="flex min-w-0 items-center gap-2">
        <li className="shrink-0">Kongu Engineering College</li>
        <li className="text-kec-muted">/</li>
        <li className="truncate font-semibold text-kec-text">{title}</li>
      </ol>
    </nav>
  );
}
