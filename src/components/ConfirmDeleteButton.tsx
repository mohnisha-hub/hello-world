"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmation: string;
};

/** A deliberate pause before a soft-delete server action is submitted. */
export function ConfirmDeleteButton({ confirmation, onClick, ...props }: Props) {
  return (
    <button
      {...props}
      type="submit"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !window.confirm(confirmation)) event.preventDefault();
      }}
    />
  );
}
