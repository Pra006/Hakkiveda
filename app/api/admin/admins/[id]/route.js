import { jsonResponse } from "@/lib/admin";

export async function GET() {
  return jsonResponse({ error: "This endpoint has been removed" }, 404);
}

export async function PATCH() {
  return jsonResponse({ error: "This endpoint has been removed" }, 404);
}

export async function DELETE() {
  return jsonResponse({ error: "This endpoint has been removed" }, 404);
}
