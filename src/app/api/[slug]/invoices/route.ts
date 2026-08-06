import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params: _ }: { params: { slug: string } }
) {
  return NextResponse.json({ message: "TODO" }, { status: 501 });
}
