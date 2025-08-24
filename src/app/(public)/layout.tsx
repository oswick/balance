import React from 'react';

// This is a bare-bones layout for public pages like login, register, etc.
// It doesn't include the main navigation or any protected elements.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
