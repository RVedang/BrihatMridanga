import { marathonStandings } from "@/lib/marathon-data";
export async function GET() {
  return Response.json(await marathonStandings(), {
    headers: { "Cache-Control": "no-store" },
  });
}
