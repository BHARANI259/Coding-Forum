import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-black leading-7 text-kec-text sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-kec-secondary max-sm:leading-5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center [&>a]:w-full sm:[&>a]:w-auto [&_button]:w-full sm:[&_button]:w-auto">{actions}</div> : null}
    </div>
  );
}
