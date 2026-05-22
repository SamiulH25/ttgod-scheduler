import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name?: string | null;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ name, image, size = "sm", className }: UserAvatarProps) {
  const sizeClass = sizeMap[size];

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "User"}
        className={cn(
          "shrink-0 rounded-full border-2 border-[var(--crayon-stroke)] object-cover",
          sizeClass,
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--crayon-stroke)] bg-secondary/20 font-display font-bold text-[var(--paper-ink)]",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
