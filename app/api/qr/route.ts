import QRCode from "qrcode";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  const svg = await QRCode.toString(u, { type: "svg", margin: 0, color: { dark: "#1f201d", light: "#0000" } });
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });
}
