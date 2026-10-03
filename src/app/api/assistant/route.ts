import { NextResponse } from "next/server";

function notImplemented() {
  return NextResponse.json(
    {
      error: "Not implemented",
      todo: "TODO: implement the innovation assistant.",
    },
    { status: 501 },
  );
}

export function GET() {
  return notImplemented();
}

export function POST() {
  return notImplemented();
}
