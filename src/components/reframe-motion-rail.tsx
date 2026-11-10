/* A continuously moving, native-scroll carousel. Copies are visual only: the middle
   sequence is the single keyboard/screen-reader collection. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

export type RailMode = "coverflow" | "stack";

type Props = {
  count: number;
  mode: RailMode;
  variant: "showcase" | "objects";
  label: string;
  paused?: boolean;
  renderCard: (index: number, copy: number) => ReactNode;
};

export function ReframeMotionRail({ count, mode, variant, label, paused = false, renderCard }: Props) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const [position, setPosition] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const railWidth = useRef(0);
  const drag = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const hovered = useRef(false);
  const focused = useRef(false);
  const holdUntil = useRef(0);
  const lastProgress = useRef(-1);
  const active = useRef(false);
  const visible = useRef(false);

  active.current = playing && !paused;
  visible.current = inView;

  const hold = useCallback((duration = 5000) => {
    holdUntil.current = performance.now() + duration;
  }, []);

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    const element = viewport.current;
    if (!element || count < 2) return;
    const middle = element.querySelector<HTMLElement>('[data-rail-copy="1"]');
    if (!middle) return;

    let frame = 0;
    let drawFrame = 0;
    let previous = performance.now();
    const cards = Array.from(element.querySelectorAll<HTMLElement>(".rf-rail-card"));

    const updateDepth = () => {
      const center = element.scrollLeft + element.clientWidth / 2;
      const measured = cards.map(card => ({
        card,
        middle: (card.parentElement?.offsetLeft ?? 0) + card.offsetLeft + card.offsetWidth / 2,
        width: Math.max(card.offsetWidth, 1),
      }));
      for (const { card, middle: cardCenter, width } of measured) {
        const normalized = Math.max(-2.5, Math.min(2.5, (cardCenter - center) / (width * 1.1)));
        const magnitude = Math.abs(normalized);
        const direction = Math.sign(normalized);
        card.style.setProperty("--rail-turn", mode === "coverflow" ? (-direction * Math.min(magnitude, 1.4) * 21) + "deg" : (normalized * -4.5) + "deg");
        card.style.setProperty("--rail-rise", mode === "coverflow" ? Math.min(magnitude, 2) * 13 + "px" : Math.min(magnitude, 2) * 10 + "px");
        card.style.setProperty("--rail-scale", String(1 - Math.min(magnitude, 2) * (mode === "coverflow" ? 0.073 : 0.039)));
        card.style.setProperty("--rail-opacity", String(1 - Math.min(magnitude, 2) * 0.13));
      }
      const width = railWidth.current;
      if (width) {
        const fraction = (((element.scrollLeft - width) % width) + width) % width / width;
        const bucket = Math.floor(fraction * 100);
        if (bucket !== lastProgress.current) {
          lastProgress.current = bucket;
          setPosition(bucket);
        }
      }
    };

    const onScroll = () => {
      const width = railWidth.current;
      if (width) {
        const edge = element.clientWidth * 1.1;
        if (element.scrollLeft < width - edge) element.scrollLeft += width;
        else if (element.scrollLeft >= 2 * width - edge) element.scrollLeft -= width;
      }
      if (!drawFrame) drawFrame = requestAnimationFrame(() => {
        drawFrame = 0;
        updateDepth();
      });
    };

    let initialized = false;
    const measure = () => {
      const width = middle.offsetWidth;
      if (width <= 0) return;
      const oldWidth = railWidth.current;
      railWidth.current = width;
      if (!initialized) {
        element.scrollLeft = width + Math.min(element.clientWidth * 0.45, width * 0.08);
        initialized = true;
      } else if (oldWidth !== width) {
        element.scrollLeft += width - oldWidth;
      }
      updateDepth();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(middle);
    resize.observe(element);
    measure();

    element.addEventListener("scroll", onScroll, { passive: true });

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.045);
      previous = now;
      if (active.current && visible.current && !focused.current &&
          !drag.current && now > holdUntil.current && railWidth.current > 0) {
        // Keep moving on hover, just more slowly so a card is easier to inspect.
        const speed = hovered.current ? 10 : mode === "stack" ? 34 : 29;
        element.scrollLeft += speed * delta;
      }
      if (visible.current && document.visibilityState === "visible") {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };
    const start = () => {
      if (!frame && visible.current && document.visibilityState === "visible") {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) start();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }, { threshold: 0.12 });
    observer.observe(element);
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(drawFrame);
      resize.disconnect();
      observer.disconnect();
      element.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count, mode]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") { hold(6000); return; }
    if (event.button !== 0) return;
    const element = viewport.current;
    if (!element) return;
    drag.current = { startX: event.clientX, startScroll: element.scrollLeft, moved: false };
    hold(6500);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || event.pointerType === "touch" || !(event.buttons & 1)) return;
    const difference = event.clientX - drag.current.startX;
    if (Math.abs(difference) > 6) {
      drag.current.moved = true;
      dragged.current = true;
      if (viewport.current) viewport.current.scrollLeft = drag.current.startScroll - difference;
    }
  };

  const onPointerEnd = () => {
    if (drag.current?.moved) {
      // A drag's synthesized click must not open a template.
      window.setTimeout(() => { dragged.current = false; }, 75);
    }
    drag.current = null;
    hold(5000);
  };

  return (
    <div className={"rf-motion-rail rf-motion-rail-" + variant} data-mode={mode}>
      <div className="rf-rail-meta">
        <span className="rf-rail-meta-start">
          <span className="rf-live-mark" aria-hidden="true" />
          {count} FORMATS / {mode === "coverflow" ? "FLOW" : "STACK"}
        </span>
        <span className="rf-rail-instruction">SWIPE · DRAG · SCROLL SIDEWAYS</span>
        <button type="button" className="rf-rail-play"
          onClick={() => setPlaying(state => !state)}
          aria-label={playing ? "Pause automatic gallery movement" : "Play automatic gallery movement"}
          aria-pressed={playing}>
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          <span>{playing ? "PAUSE" : "PLAY"}</span>
        </button>
      </div>
      <div ref={viewport} className="rf-rail-viewport" tabIndex={0} role="region" aria-roledescription="carousel"
        aria-label={label + ". Swipe, drag, or scroll horizontally to browse."}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd} onPointerEnter={e => { if (e.pointerType === "mouse") hovered.current = true; }}
        onPointerLeave={e => { if (e.pointerType === "mouse") { hovered.current = false; if (drag.current) onPointerEnd(); } }}
        onTouchStart={() => hold(7000)} onWheel={() => hold(4000)}
        onFocusCapture={() => { focused.current = true; hold(5000); }}
        onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { focused.current = false; hold(2000); } }}
        onKeyDown={event => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            hold(6000);
            viewport.current?.scrollBy({ left: (event.key === "ArrowRight" ? 1 : -1) * Math.max(180, (viewport.current?.clientWidth ?? 600) * 0.65), behavior: reduced ? "instant" : "smooth" });
          }
        }}
        onClickCapture={event => {
          if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; }
        }}>
        <div className="rf-rail-track">
          {[0,1,2].map(copy => (
            <div key={copy} className="rf-rail-segment" data-rail-copy={copy}
              aria-hidden={copy !== 1} inert={copy !== 1}>
              {Array.from({length:count}, (_, index) => (
                <div className="rf-rail-card" key={index} data-card-index={index}>
                  {renderCard(index, copy)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="rf-rail-bottom" aria-hidden="true"><span>AN ENDLESS ARCHIVE</span>
        <div className="rf-rail-progress"><span style={{ transform: "scaleX(" + Math.max(0.03, position / 100) + ")" }} /></div>
        <span>MAKE IT YOURS ↗</span>
      </div>
    </div>
  );
}
