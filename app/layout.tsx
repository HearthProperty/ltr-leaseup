import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
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
      <head>
        <Script
          id="mixpanel-sdk"
          strategy="beforeInteractive"
          src="//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
        />
        <Script
          id="mixpanel-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(e,c){if(!c.__SV){var l,h;window.mixpanel=c;c._i=[];c.init=function(q,r,f){function t(d,a){var g=a.split(".");2==g.length&&(d=d[g[0]],a=g[1]);d[a]=function(){d.push([a].concat(Array.prototype.slice.call(arguments,0)))}}var b=c;"undefined"!==typeof f?b=c[f]=[]:f="mixpanel";b.people=b.people||[];b.toString=function(d){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);d||(a+=" (stub)");return a};b.people.toString=function(){return b.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders start_session_recording stop_session_recording people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<l.length;h++)t(b,l[h]);var n="set set_once union unset remove delete".split(" ");b.get_group=function(){function d(p){a[p]=function(){b.push([g,[p].concat(Array.prototype.slice.call(arguments,0))])}}for(var a={},g=["get_group"].concat(Array.prototype.slice.call(arguments,0)),m=0;m<n.length;m++)d(n[m]);return a};c._i.push([q,r,f])};c.__SV=1.2}})(document,window.mixpanel||[]);
              mixpanel.init('5f47f510f29a6f028b0b99feab77ef55', {
                autocapture: true,
                record_sessions_percent: 100,
              });
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
