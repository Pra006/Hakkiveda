import { jsonResponse } from "@/lib/admin";

export async function GET() {
  return jsonResponse({ error: "This endpoint has been removed" }, 404);
}

export async function POST() {
  return jsonResponse({ error: "This endpoint has been removed" }, 404);
}
