import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/cn";

type EventPosterPreviewProps = {
  posterImageUrl?: string | null;
  title?: string;
  className?: string;
  imageClassName?: string;
};

export default function EventPosterPreview({ posterImageUrl, title = "KEC Coding Forum", className, imageClassName }: EventPosterPreviewProps) {
  const imageUrl = toPublicImageUrl(posterImageUrl);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-kec-border bg-white", className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${title} poster`}
          loading="lazy"
          decoding="async"
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div className={cn("flex h-full min-h-44 w-full flex-col items-center justify-center bg-slate-100 px-4 text-center", imageClassName)}>
          <p className="text-xs font-semibold uppercase tracking-wide text-kec-muted">Event Poster</p>
          <p className="mt-2 text-lg font-bold text-kec-text">KEC Coding Forum</p>
        </div>
      )}
    </div>
  );
}

export function toPublicImageUrl(value?: string | null) {
  if (!value) {
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${apiOrigin}${value}`;
}
