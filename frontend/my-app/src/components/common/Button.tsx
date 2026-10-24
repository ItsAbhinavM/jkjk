import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "../../lib/buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** For toggle buttons: whether the option is currently selected. */
  active?: boolean;
}

export default function Button({ variant = "ghost", active, className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={buttonClasses(variant, active, className)}
      {...rest}
    />
  );
}