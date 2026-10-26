import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonProps) {
  const classes = [`button-${variant}`, className].filter(Boolean).join(' ')

  return <button className={classes} {...props} />
}
