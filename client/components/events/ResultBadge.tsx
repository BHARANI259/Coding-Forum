import Badge from "@/components/ui/Badge";

export default function ResultBadge({ resultType }: { resultType: string }) {
  if (resultType === "WINNER") {
    return <Badge variant="success">WINNER</Badge>;
  }
  if (resultType === "RUNNER_UP") {
    return <Badge variant="info">RUNNER UP</Badge>;
  }
  if (resultType === "SECOND_RUNNER_UP") {
    return <Badge variant="warning">SECOND RUNNER UP</Badge>;
  }
  if (resultType === "DISQUALIFIED") {
    return <Badge variant="error">DISQUALIFIED</Badge>;
  }
  return <Badge>{resultType}</Badge>;
}
