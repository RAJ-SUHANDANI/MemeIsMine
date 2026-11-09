"use client";
import {
  ArrowLeft,
  ArrowRight,
  Layers3,
  LayoutGrid,
  PanelsTopLeft,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties, type ReactNode } from "react";

const arrangements = [
  { id: "fan", label: "Fan", icon: PanelsTopLeft },
  { id: "stack", label: "Stack", icon: Layers3 },
  { id: "grid", label: "Grid", icon: LayoutGrid },
] as const;

export function GalleryShowcase({
  label,
  items,
}: {
  label: string;
  items: { id: string; name: string; card: ReactNode }[];
}) {
  const [arrangement, setArrangement] =
    useState<(typeof arrangements)[number]["id"]>("fan");
  const [selected, setSelected] = useState(0);
  const reduce = useReducedMotion();
  if (!items.length) return null;
  const active = selected % items.length;
  function step(delta: number) {
    setSelected((active + delta + items.length) % items.length);
  }

  return (
    <section className="gallery-showcase" aria-label={label} data-scroll-reveal>
      <div className="showcase-toolbar">
        <div
          className="showcase-layouts"
          role="group"
          aria-label={label + " layout"}
        >
          {arrangements.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={arrangement === id}
              onClick={() => setArrangement(id)}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
        {arrangement !== "grid" && (
          <div className="showcase-controls">
            <button
              type="button"
              aria-label={"Previous " + label}
              onClick={() => step(-1)}
            >
              <ArrowLeft size={17} />
            </button>
            <span aria-live="polite">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(items.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label={"Next " + label}
              onClick={() => step(1)}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
      <div className="showcase-stage" data-arrangement={arrangement}>
        {items.map((item, index) => {
          const slot = (index - active + items.length) % items.length;
          const offset = [0, 1, -1, 2][slot] ?? slot;
          return (
            <motion.div
              key={item.id}
              className="showcase-item"
              layout={reduce ? false : "position"}
              style={
                {
                  "--offset": offset,
                  "--depth": slot,
                  zIndex: items.length - slot,
                } as CSSProperties
              }
              transition={{
                layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              }}
              data-selected={slot === 0 || undefined}
              inert={arrangement !== "grid" && slot !== 0}
            >
              <div className="showcase-card">{item.card}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
