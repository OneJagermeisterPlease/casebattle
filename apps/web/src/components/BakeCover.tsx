'use client';

import type { CaseDTO } from '@casebattle/shared';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { CaseArt, coverSig } from './CaseArt';

declare global {
  interface Window {
    /** Switch the rendered case and resolve with its cover signature once fully loaded. */
    __bake?: (slug: string) => Promise<string | null>;
  }
}

/** Waits until fonts, <img> and SVG <image> resources inside the target are decoded. */
async function settle(root: HTMLElement) {
  await document.fonts.ready;
  const urls = new Set<string>();
  root.querySelectorAll('img').forEach((i) => urls.add(i.currentSrc || i.src));
  root.querySelectorAll('image').forEach((i) => urls.add(i.getAttribute('href') ?? ''));
  await Promise.all(
    [...urls].filter(Boolean).map((u) => {
      const im = new Image();
      im.src = u;
      return im.decode().catch(() => undefined);
    }),
  );
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 150));
}

/** Dev-only harness for baking covers: one live cover at grid size (284×218) on a bare page. */
export function BakeCover({ initialSlug }: { initialSlug: string }) {
  const [cases, setCases] = useState<CaseDTO[] | null>(null);
  const [slug, setSlug] = useState(initialSlug);
  const [waiter, setWaiter] = useState<((sig: string | null) => void) | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/cases`)
      .then((r) => r.json())
      .then(setCases)
      .catch(() => setCases([]));
  }, []);

  const c = cases?.find((x) => x.slug === slug) ?? null;

  useEffect(() => {
    if (!cases) return;
    window.__bake = (s: string) =>
      new Promise((resolve) => {
        setWaiter(() => resolve);
        setSlug(s);
      });
  }, [cases]);

  useEffect(() => {
    if (!cases || !waiter) return;
    const root = document.getElementById('bake-target');
    if (!c || !root) {
      waiter(null);
      setWaiter(null);
      return;
    }
    let off = false;
    settle(root).then(() => {
      if (off) return;
      waiter(coverSig(c));
      setWaiter(null);
    });
    return () => {
      off = true;
    };
  }, [cases, c, waiter]);

  return (
    <div style={{ padding: 120 }}>
      <style>{`#bake-target .cart { width: 284px; height: 218px; }`}</style>
      <div id="bake-target" style={{ display: 'inline-block' }}>
        {c && <CaseArt key={c.slug} c={c} live />}
      </div>
    </div>
  );
}
