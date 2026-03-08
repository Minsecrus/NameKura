import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HexBoard } from "@/components/HexBoard";
import { InfoIsland } from "@/components/InfoIsland";
import { ToastPill } from "@/components/ToastPill";
import { TopIslands } from "@/components/TopIslands";
import { UploadModal } from "@/components/UploadModal";
import {
  createName,
  fetchPublishedNames,
  recordCopy,
  voteName,
} from "@/lib/api/names";
import { copyText } from "@/lib/clipboard";
import {
  buildUserCard,
  generateBatch,
} from "@/lib/name-data";
import {
  HEX_GAP,
  getBoardMetrics,
  getCanvasColumnCount,
  getVisibleColumnCount,
} from "@/lib/board-layout";
import type { NameCard } from "@/types/name";

function App() {
  const [items, setItems] = useState<NameCard[]>([]);
  const [visibleColumns, setVisibleColumns] = useState(4);
  const [canvasColumns, setCanvasColumns] = useState(8);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [viewportHeight, setViewportHeight] = useState(720);
  const [filterQuery, setFilterQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rippleToken, setRippleToken] = useState("");
  const [rippleCardId, setRippleCardId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNames() {
      try {
        const data = await fetchPublishedNames();

        if (!cancelled) {
          setItems(data);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setItems(generateBatch(0, 320));
          setLoadError("Supabase unavailable, fallback to local data.");
        }
      }
    }

    void loadNames();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setViewportWidth(width);
      setViewportHeight(height);
      setVisibleColumns(getVisibleColumnCount(width));
      setCanvasColumns(getCanvasColumnCount(width));
    });

    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
      setVisibleColumns(getVisibleColumnCount(window.innerWidth));
      setCanvasColumns(getCanvasColumnCount(window.innerWidth));
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);

    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 1400);

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [toast]);

  const filteredItems = useMemo(() => {
    const query = filterQuery.trim();

    if (!query) {
      return items;
    }

    return items.filter((item) =>
      `${item.name} ${item.tags.join(" ")}`.includes(query),
    );
  }, [filterQuery, items]);

  const boardMetrics = useMemo(() => {
    return getBoardMetrics(viewportWidth, visibleColumns);
  }, [viewportWidth, visibleColumns]);

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: canvasColumns }, () => [] as NameCard[]);

    filteredItems.forEach((item, index) => {
      nextColumns[index % canvasColumns].push(item);
    });

    return nextColumns;
  }, [canvasColumns, filteredItems]);

  const boardStyle = {
    "--hex-gap": `${HEX_GAP}px`,
    "--hex-height": `${boardMetrics.tileHeight}px`,
    "--hex-offset": `${boardMetrics.offset}px`,
    "--hex-overlap": `${boardMetrics.overlap}px`,
    "--hex-width": `${boardMetrics.tileWidth}px`,
  } as CSSProperties;

  const handleCopy = useCallback(async (card: NameCard) => {
    await copyText(card.name);
    try {
      await recordCopy(card.id);
    } catch {
      // Ignore analytics write failures after the clipboard action succeeds.
    }
    setRippleCardId(card.id);
    setRippleToken(`${card.id}-${Date.now()}`);
    setToast("已拾取");
  }, []);

  const handleVote = useCallback((id: string, delta: "up" | "down") => {
    void (async () => {
      try {
        const updated = await voteName(id, delta);
        setItems((current) =>
          current.map((item) => (item.id === id ? updated : item)),
        );
      } catch {
        setItems((current) =>
          current.map((item) => {
            if (item.id !== id) {
              return item;
            }

            return {
              ...item,
              dislikes: item.dislikes + (delta === "down" ? 1 : 0),
              likes: item.likes + (delta === "up" ? 1 : 0),
            };
          }),
        );
      }
    })();
  }, []);

  const handleUpload = useCallback(() => {
    const value = uploadName.replace(/\s+/g, "").trim();
    if (value.length < 2) {
      return;
    }

    void (async () => {
      try {
        const created = await createName(value);
        setItems((current) => [created, ...current]);
        setToast("已收录");
      } catch {
        setItems((current) => [buildUserCard(value), ...current]);
        setToast("已收录");
      } finally {
        setUploadName("");
        setIsUploadOpen(false);
      }
    })();
  }, [uploadName]);

  return (
    <main className="h-screen overflow-hidden bg-white text-black selection:bg-[#0052CC]/15">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(0,82,204,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbfcff_48%,#ffffff_100%)]" />

      <TopIslands
        filterQuery={filterQuery}
        onFilterChange={setFilterQuery}
        onUploadOpen={() => setIsUploadOpen(true)}
      />

      <InfoIsland isOpen={isInfoOpen} onOpen={() => setIsInfoOpen(true)} onClose={() => setIsInfoOpen(false)} />

      <section className="relative z-10 h-screen w-screen overflow-hidden">
        <HexBoard
          viewportRef={viewportRef}
          boardStyle={boardStyle}
          boardMetrics={boardMetrics}
          canvasColumns={canvasColumns}
          viewportHeight={viewportHeight}
          viewportWidth={viewportWidth}
          columns={columns}
          rippleCardId={rippleCardId}
          rippleToken={rippleToken}
          onCopy={handleCopy}
          onVote={handleVote}
        />
      </section>

      {loadError ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-black/8 bg-white/92 px-3 py-2 text-sm text-black/45 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          offline fallback
        </div>
      ) : null}

      <ToastPill text={toast} />

      <UploadModal
        isOpen={isUploadOpen}
        value={uploadName}
        onChange={setUploadName}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleUpload}
      />
    </main>
  );
}

export default App;
