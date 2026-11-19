// Generates a coloured placeholder "bed" image so we never ship copied photos.
// /api/placeholder?c=E8DCC4&t=Front
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const c = (sp.get('c') || 'CCCCCC').replace(/[^0-9a-fA-F]/g, '').slice(0, 6) || 'CCCCCC';
  const t = (sp.get('t') || '').replace(/[<>&"]/g, '').slice(0, 30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<rect width="800" height="600" fill="#f1f1ee"/>
<rect x="0" y="470" width="800" height="130" fill="#e4e2dc"/>
<rect x="150" y="150" width="500" height="190" rx="18" fill="#${c}"/>
<rect x="150" y="150" width="500" height="190" rx="18" fill="#000" opacity="0.12"/>
<rect x="110" y="300" width="580" height="130" rx="14" fill="#${c}"/>
<rect x="130" y="270" width="540" height="60" rx="26" fill="#fff" opacity="0.55"/>
<rect x="110" y="420" width="580" height="40" fill="#${c}"/>
<rect x="110" y="420" width="580" height="40" fill="#000" opacity="0.18"/>
<rect x="125" y="455" width="26" height="26" fill="#444"/><rect x="649" y="455" width="26" height="26" fill="#444"/>
<text x="400" y="545" font-family="Arial,sans-serif" font-size="28" fill="#666" text-anchor="middle">${t}</text>
</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } });
}
