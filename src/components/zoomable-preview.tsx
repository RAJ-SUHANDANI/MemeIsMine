"use client";
import { Heart, Minus, Plus, RotateCcw } from "lucide-react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (a: Point, b: Point) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ZoomablePreview({
  children,
  onDoubleTap,
}: {
  children: ReactNode;
  onDoubleTap: () => boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const points = useRef(new Map<number, Point>());
  const start = useRef<Point | null>(null);
  const lastTap = useRef<(Point & { time: number }) | null>(null);
  const pinch = useRef<{
    center: Point;
    distance: number;
    scale: number;
    x: number;
    y: number;
  } | null>(null);
  const moved = useRef(false);
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [zoom, setZoom] = useState(1);
  const [burst, setBurst] = useState<(Point & { id: number }) | null>(null);
  const sequence = useRef(0);
  const reduce = useReducedMotion();

  function transform(next: number, offsetX: number, offsetY: number) {
    const box = viewport.current?.getBoundingClientRect();
    if (!box) return;
    const z = clamp(next, 1, 4);
    const maxX = (box.width * (z - 1)) / 2;
    const maxY = (box.height * (z - 1)) / 2;
    scale.set(z);
    x.set(clamp(offsetX, -maxX, maxX));
    y.set(clamp(offsetY, -maxY, maxY));
  }

  function setStep(next: number) {
    transform(next, x.get(), y.get());
    setZoom(scale.get());
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || points.current.size >= 2) return;
    const point = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    points.current.set(event.pointerId, point);
    if (points.current.size === 1) {
      start.current = point;
      moved.current = false;
      return;
    }
    const [a, b] = [...points.current.values()];
    pinch.current = {
      center: center(a, b),
      distance: Math.max(distance(a, b), 1),
      scale: scale.get(),
      x: x.get(),
      y: y.get(),
    };
    moved.current = true;
    lastTap.current = null;
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = points.current.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    points.current.set(event.pointerId, point);
    if (pinch.current && points.current.size === 2) {
      const [a, b] = [...points.current.values()];
      const initial = pinch.current;
      const midpoint = center(a, b);
      const box = event.currentTarget.getBoundingClientRect();
      const next = clamp(
        (initial.scale * distance(a, b)) / initial.distance,
        1,
        4,
      );
      const ratio = next / initial.scale;
      transform(
        next,
        midpoint.x -
          (box.left + box.width / 2) -
          (initial.center.x - box.left - box.width / 2 - initial.x) * ratio,
        midpoint.y -
          (box.top + box.height / 2) -
          (initial.center.y - box.top - box.height / 2 - initial.y) * ratio,
      );
      return;
    }
    if (start.current && distance(start.current, point) > 9) {
      moved.current = true;
      lastTap.current = null;
    }
    if (scale.get() > 1)
      transform(
        scale.get(),
        x.get() + point.x - previous.x,
        y.get() + point.y - previous.y,
      );
  }

  function end(event: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    if (!points.current.delete(event.pointerId)) return;
    if (points.current.size === 0) {
      setZoom(scale.get());
      pinch.current = null;
      if (cancelled) lastTap.current = null;
      if (cancelled || moved.current) return;
      const point = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
      };
      const previous = lastTap.current;
      if (
        previous &&
        point.time - previous.time < 320 &&
        distance(previous, point) < 32
      ) {
        lastTap.current = null;
        if (onDoubleTap()) {
          const box = event.currentTarget.getBoundingClientRect();
          setBurst({
            x: point.x - box.left,
            y: point.y - box.top,
            id: ++sequence.current,
          });
        }
      } else lastTap.current = point;
    }
  }

  return (
    <div className="preview-viewer">
      <div
        ref={viewport}
        className="preview-zoom-viewport"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(event) => end(event, false)}
        onPointerCancel={(event) => end(event, true)}
        onLostPointerCapture={(event) => end(event, true)}
      >
        <motion.div className="preview-zoom-art" style={{ scale, x, y }}>
          {children}
        </motion.div>
        {burst && (
          <motion.span
            key={burst.id}
            className="preview-heart-burst"
            aria-hidden="true"
            style={{ left: burst.x, top: burst.y }}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.55 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: reduce ? 1 : [0.55, 1.2, 1, 0.9],
            }}
            transition={{ duration: reduce ? 0.25 : 0.7 }}
            onAnimationComplete={() =>
              setBurst((current) => (current?.id === burst.id ? null : current))
            }
          >
            <Heart size={48} fill="currentColor" />
          </motion.span>
        )}
      </div>
      <div
        className="preview-zoom-controls"
        role="group"
        aria-label="Preview zoom"
      >
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= 1}
          onClick={() => setStep(scale.get() - 0.5)}
        >
          <Minus size={16} />
        </button>
        <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= 4}
          onClick={() => setStep(scale.get() + 0.5)}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          disabled={zoom <= 1}
          onClick={() => setStep(1)}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}
