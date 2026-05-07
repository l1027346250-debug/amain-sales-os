import { type ReactNode } from 'react';

export const Button = ({
  title,
  children,
  ...props
}: {
  title?: string;
  children?: ReactNode;
}) => <button {...props}>{title ?? children}</button>;
