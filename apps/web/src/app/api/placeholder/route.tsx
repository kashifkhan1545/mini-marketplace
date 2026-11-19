import { ImageResponse } from 'next/og';

// Tinted placeholder "bed" picture (PNG, so it also works in the React Native app, which cannot render SVG).
// Used for colour swatches that have no photo. /api/placeholder?c=E8DCC4&t=Front
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const c = (sp.get('c') || 'CCCCCC').replace(/[^0-9a-fA-F]/g, '').slice(0, 6) || 'CCCCCC';
  const t = (sp.get('t') || '').replace(/[<>&"]/g, '').slice(0, 30);
  const box = (x: number, y: number, w: number, h: number, bg: string, extra: Record<string, unknown> = {}) => (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: bg, display: 'flex', ...extra }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: 800, height: 600, display: 'flex', position: 'relative', background: '#f1f1ee' }}>
        {box(0, 470, 800, 130, '#e4e2dc')}
        {box(150, 150, 500, 190, `#${c}`, { borderRadius: 18 })}
        {box(150, 150, 500, 190, 'rgba(0,0,0,0.12)', { borderRadius: 18 })}
        {box(110, 300, 580, 130, `#${c}`, { borderRadius: 14 })}
        {box(130, 270, 540, 60, 'rgba(255,255,255,0.55)', { borderRadius: 26 })}
        {box(110, 420, 580, 40, `#${c}`)}
        {box(110, 420, 580, 40, 'rgba(0,0,0,0.18)')}
        {box(125, 455, 26, 26, '#444')}
        {box(649, 455, 26, 26, '#444')}
        <div style={{ position: 'absolute', left: 0, top: 520, width: 800, display: 'flex', justifyContent: 'center', fontSize: 28, color: '#666' }}>{t}</div>
      </div>
    ),
    { width: 800, height: 600, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
