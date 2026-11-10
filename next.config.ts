import type { NextConfig } from "next";

const development=process.env.NODE_ENV!=="production";
const csp=[
  "default-src 'self'",
  // Next.js currently emits inline hydration data. A nonce-based CSP requires
  // dynamic rendering and a separate preview rollout; do not pretend this is
  // a fully strict script policy.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://unpkg.com"+(development?" 'unsafe-eval'":""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: data: https:",
  "connect-src 'self' blob: https: wss:",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(development?[]:["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders=[
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=()"},
  {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
  {key:"X-DNS-Prefetch-Control",value:"off"},
  {key:"Content-Security-Policy",value:csp},
  ...(development?[]:[{key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"}]),
];
const nextConfig:NextConfig={
  poweredByHeader:false,
  devIndicators:false,
  images:{unoptimized:true},
  async headers(){
    return [{source:"/:path*",headers:securityHeaders}];
  },
};
export default nextConfig;
