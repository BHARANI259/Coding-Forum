type BreadcrumbsProps = {
  title: string;
};

export default function Breadcrumbs({ title }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="hidden text-sm text-white/85 sm:block lg:text-slate-600">
      <ol className="flex min-w-0 items-center gap-2">
        <li className="shrink-0">Kongu Engineering College</li>
        <li className="text-white/50 lg:text-slate-400">/</li>
        <li className="truncate font-semibold text-white lg:text-slate-900">{title}</li>
      </ol>
    </nav>
  );
}
