const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
});

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

export function formatDateTime(value: string | Date | null | undefined, fallback = "-") {
  if (!value) {
    return fallback;
  }
  const date = parseAppDate(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return DATE_TIME_FORMAT.format(date).replace(",", "");
}

export function formatDate(value: string | Date | null | undefined, fallback = "-") {
  if (!value) {
    return fallback;
  }
  const date = parseAppDate(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return DATE_FORMAT.format(date);
}

export function parseAppDate(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }
  const normalized = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  if (hasTimezone) {
    return new Date(normalized);
  }

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/
  );
  if (!match) {
    return new Date(normalized);
  }

  const [, year, month, day, hour = "0", minute = "0", second = "0", fraction = "0"] = match;
  const millisecond = Number(fraction.padEnd(3, "0").slice(0, 3));
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond
  );
}
