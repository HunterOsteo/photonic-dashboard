import { runArxivWorker } from "@/app/workers/arxivWorker";

export async function GET() {
  const result = await runArxivWorker();

  return Response.json({
    ok: true,
    result,
    time: new Date().toISOString(),
  });
}