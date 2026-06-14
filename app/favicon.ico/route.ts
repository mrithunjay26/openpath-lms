import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#5B6CFF"/>
      <path d="M20 36c6-13 18-13 24 0" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/>
      <circle cx="20" cy="36" r="4" fill="white"/>
      <circle cx="44" cy="36" r="4" fill="white"/>
    </svg>`,
    {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "public, max-age=31536000, immutable",
      },
    },
  );
}
