import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PrimaryActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  children: ReactNode;
};

const buttonClassName =
  "inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-[#f4dcc0]/25 bg-[#f4dcc0] px-5 py-3 text-sm font-semibold text-[#170f18] shadow-[0_18px_45px_rgba(217,167,160,0.24)] transition duration-300 ease-out hover:bg-[#ffe4c6] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55";

export function PrimaryActionButton({
  href,
  className,
  children,
  type = "button",
  ...props
}: PrimaryActionButtonProps) {
  if (href) {
    return (
      <Link className={cn(buttonClassName, className)} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cn(buttonClassName, className)} type={type} {...props}>
      {children}
    </button>
  );
}
