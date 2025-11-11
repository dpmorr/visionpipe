import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default:
          "bg-gray-50 text-gray-600 ring-gray-500/10",
        primary:
          "bg-primary-50 text-primary-700 ring-primary-700/10",
        secondary:
          "bg-secondary-50 text-secondary-700 ring-secondary-700/10",
        success:
          "bg-green-50 text-green-700 ring-green-600/20",
        warning:
          "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
        danger:
          "bg-red-50 text-red-700 ring-red-600/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

function Tag({ className, variant, ...props }: TagProps) {
  return (
    <span className={cn(tagVariants({ variant }), className)} {...props} />
  )
}

export { Tag, tagVariants }
