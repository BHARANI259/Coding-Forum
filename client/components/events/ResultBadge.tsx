import Badge from "@/components/ui/Badge";

export default function ResultBadge({ resultType }: { resultType: string }) {
  if (resultType === "WINNER") {
    return <Badge variant="success">Winner</Badge>;
  }
  if (resultType === "RUNNER_UP") {
    return <Badge variant="info">Runner-up</Badge>;
  }
  if (resultType === "SECOND_RUNNER_UP") {
    return <Badge variant="warning">Second runner-up</Badge>;
  }
  if (resultType === "DISQUALIFIED") {
    return <Badge variant="error">Disqualified</Badge>;
  }
  return <Badge>{humanize(resultType)}</Badge>;
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
