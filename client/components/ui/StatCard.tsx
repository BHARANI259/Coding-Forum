import Card from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
};

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-kec-secondary">{label}</p>
        <p className="mt-3 text-3xl font-bold text-kec-text">{value}</p>
        {hint ? <p className="mt-2 text-xs text-kec-muted">{hint}</p> : null}
      </div>
      {icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kec-purple/10 text-sm font-bold text-kec-purple">
          {icon}
        </div>
      ) : null}
    </Card>
  );
}
