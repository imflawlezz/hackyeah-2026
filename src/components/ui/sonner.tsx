"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/16/solid";

const Toaster = ({ ...props }: ToasterProps) => {
  // Colours come from the CSS variables below, which follow data-theme.
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CheckCircleIcon aria-hidden="true" className="size-4" />,
        info: <InformationCircleIcon aria-hidden="true" className="size-4" />,
        warning: (
          <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
        ),
        error: <XCircleIcon aria-hidden="true" className="size-4" />,
        loading: (
          <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
