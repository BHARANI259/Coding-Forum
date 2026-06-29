import { ReactNode } from "react";
import Card from "./Card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-kec-purple/10 text-lg font-bold text-kec-purple">
        K
      </div>
      <h2 className="text-lg font-bold text-kec-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-kec-secondary">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}
