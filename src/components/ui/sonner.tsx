"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      richColors={false}
      closeButton={true}
      duration={5000}
      icons={{
        success: <CircleCheckIcon className="size-5 text-white" />,
        info: <InfoIcon className="size-5 text-white" />,
        warning: <TriangleAlertIcon className="size-5 text-white" />,
        error: <OctagonXIcon className="size-5 text-white" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-900 group-[.toaster]:border group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg group-[.toaster]:p-4 group-[.toaster]:min-w-[320px]",
          title: "group-[.toast]:text-base group-[.toast]:font-semibold",
          description: "group-[.toast]:text-sm group-[.toast]:text-zinc-600",
          actionButton: "group-[.toast]:bg-zinc-900 group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton: "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-700 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5",
          error: "group-[.toaster]:!bg-red-600 group-[.toaster]:!text-white group-[.toaster]:!border-red-700",
          success: "group-[.toaster]:!bg-emerald-600 group-[.toaster]:!text-white group-[.toaster]:!border-emerald-700",
          warning: "group-[.toaster]:!bg-amber-500 group-[.toaster]:!text-white group-[.toaster]:!border-amber-600",
          info: "group-[.toaster]:!bg-blue-600 group-[.toaster]:!text-white group-[.toaster]:!border-blue-700",
        },
      }}
      style={{} as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
