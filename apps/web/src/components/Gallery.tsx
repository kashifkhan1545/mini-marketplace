'use client';
import { useEffect, useRef, useState } from 'react';

/** Swipeable gallery (CSS scroll-snap) with thumbnails and a click-to-enlarge lightbox. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  // Reset to the first slide when the image set changes (e.g. colour picked).
  useEffect(() => {
    setIdx(0);
    track.current?.scrollTo({ left: 0 });
  }, [images[0]]);

  const go = (i: number) => {
    const n = (i + images.length) % images.length;
    setIdx(n);
    const el = track.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="gallery">
      <div
        className="main"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((u, i) => (
          <div className="slide" key={u + i} onClick={() => setOpen(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`${alt} ${i + 1}`} />
          </div>
        ))}
      </div>
      <div className="thumbs">
        {images.map((u, i) => (
          <button key={u + i} className={i === idx ? 'on' : ''} onClick={() => go(i)} aria-label={`Image ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" />
          </button>
        ))}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[idx]} alt={alt} />
          <button className="x" aria-label="Close">✕</button>
          {images.length > 1 && (
            <>
              <button className="nav-b" style={{ left: 8 }} onClick={(e) => { e.stopPropagation(); go(idx - 1); }}>‹</button>
              <button className="nav-b" style={{ right: 8 }} onClick={(e) => { e.stopPropagation(); go(idx + 1); }}>›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
