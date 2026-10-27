import { bus, getProject } from "@/lib/store";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

// Server-Sent Events: cada vez que el proyecto cambia, el cliente recibe la versión completa.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (p: Project) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(p)}\n\n`));
        } catch {
          cleanup();
        }
      };
      const current = getProject(id);
      if (current) send(current);
      const ping = setInterval(() => {
        try {
          controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 15000);
      bus().on(`project:${id}`, send);
      cleanup = () => {
        clearInterval(ping);
        bus().off(`project:${id}`, send);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" },
  });
}
