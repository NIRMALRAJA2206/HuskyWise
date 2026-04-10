import { loadStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await loadStore();
  const documents = [...store.documents].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return Response.json({ documents });
}
