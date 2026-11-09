"use client";
import { useEffect, useRef, useState } from "react";
import { authConfig } from "@/lib/auth-config";
import { setTemplateLike } from "@/app/api/template-likes/actions";

export type LikeState = {
  key: string;
  count: number;
  revision: number;
  liked: boolean;
  signedIn: boolean;
};

export function useTemplateLikes(key: string) {
  const [state, setState] = useState<LikeState | null>(null);
  const [failed, setFailed] = useState(false);
  const [optimistic, setOptimistic] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);
  const pending = useRef(false);

  function accept(incoming: LikeState, fromMutation = false) {
    setState((current) =>
      current && current.revision > incoming.revision
        ? fromMutation
          ? { ...current, liked: incoming.liked, signedIn: incoming.signedIn }
          : current
        : incoming,
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    let connected = false;
    let dispose: (() => void) | undefined;

    async function load() {
      if (pending.current || controller.signal.aborted) return;
      try {
        const response = await fetch(
          "/api/template-likes?key=" + encodeURIComponent(key),
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        if (!response.ok) throw new Error("Like count unavailable");
        const data: LikeState = await response.json();
        if (!controller.signal.aborted && !pending.current) {
          accept(data);
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    const config = authConfig();
    if (config) {
      void import("@supabase/supabase-js")
        .then(({ createClient }) => {
          if (controller.signal.aborted) return;
          const client = createClient(config.url, config.key, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          });
          const channel = client
            .channel("template-likes:" + key)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "template_like_counts",
                filter: "template_key=eq." + key,
              },
              (payload) => {
                const next = payload.new as {
                  count?: number;
                  revision?: number;
                };
                const count = next.count;
                const revision = next.revision;
                if (typeof count !== "number" || typeof revision !== "number")
                  return;
                setState((current) =>
                  current && revision >= current.revision
                    ? { ...current, count, revision }
                    : current,
                );
              },
            )
            .subscribe((status) => {
              connected = status === "SUBSCRIBED";
              if (connected) void load();
            });
          dispose = () => {
            void client.removeChannel(channel);
          };
        })
        .catch(() => undefined);
    }
    const timer = window.setInterval(() => {
      if (!connected && !document.hidden) void load();
    }, 8000);
    function refresh() {
      if (!document.hidden) void load();
    }
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      dispose?.();
    };
  }, [key]);

  async function react(liked: boolean) {
    if (!state?.signedIn || pending.current || state.liked === liked) return;
    pending.current = true;
    setOptimistic({
      liked,
      count: Math.max(0, state.count + (liked ? 1 : -1)),
    });
    setFailed(false);
    try {
      const result = await setTemplateLike(key, liked);
      if (!result) throw new Error("Like unavailable");
      accept(result, true);
    } catch {
      setFailed(true);
    } finally {
      pending.current = false;
      setOptimistic(null);
    }
  }

  return {
    state,
    failed,
    busy: optimistic !== null,
    liked: optimistic?.liked ?? state?.liked ?? false,
    count: optimistic?.count ?? state?.count ?? null,
    react,
  };
}
