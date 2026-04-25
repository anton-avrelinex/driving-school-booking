import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Avatar } from "./Avatar.vue";

export const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium select-none shrink-0",
  {
    variants: {
      size: {
        sm: "size-6 text-[10px]",
        md: "size-8 text-xs",
        lg: "size-10 text-sm",
        xl: "size-14 text-lg",
      },
      role: {
        admin:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        instructor:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        student:
          "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      role: "neutral",
    },
  },
);
export type AvatarVariants = VariantProps<typeof avatarVariants>;
