import { NextResponse } from "next/server";
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
export function OPTIONS() {
  return NextResponse.json({});
}
