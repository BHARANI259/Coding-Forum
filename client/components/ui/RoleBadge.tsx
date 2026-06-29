import type { UserRole } from "@/lib/api";
import { roleDisplayName } from "@/lib/navigation";
import Badge from "./Badge";

export default function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant="purple">{roleDisplayName(role)}</Badge>;
}
