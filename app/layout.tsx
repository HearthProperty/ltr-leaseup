import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lease-Up Audit | Hearth Property',
  description:
    "Find out why your rental isn't leasing, what vacancy is costing you, and how Hearth can fix it fast. Free instant lease-up audit for property owners.",
  openGraph: {
    title: 'Free Lease-Up Audit | Hearth Property',
    description:
      "Your property is sitting vacant. Find out what it's costing you and how to fix it — in 60 seconds.",
    url: 'https://leaseup.hearthproperty.com',
    siteName: 'Hearth Property',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
