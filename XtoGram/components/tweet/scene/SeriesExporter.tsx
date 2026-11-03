import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { PixelRatio, StyleSheet, View } from "react-native";
import { Skia, useCanvasRef, type SkImage } from "@shopify/react-native-skia";
import { PageRenderer } from "./PageRenderer";
import { PAGE_HEIGHT, PAGE_WIDTH, type Page } from "./plan";
import type { CardTemplate } from "./types";
import { imageUrisOf, loadImage } from "../skia/imageCache";

type Job = { page: Page; template: CardTemplate; pageColor?: string; token: number };

export type SeriesExporterHandle = {
  renderAll: (
    pages: Page[],
    template: CardTemplate,
    pageColor: string | undefined,
    onPage: (image: SkImage, index: number) => Promise<void>,
  ) => Promise<void>;
};

const nextFrames = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// A snapshot has physical-pixel size. Force exactly 1080x1350 whatever the device density.
function normalize(image: SkImage): SkImage {
  if (image.width() === PAGE_WIDTH && image.height() === PAGE_HEIGHT) return image;
  const surface = Skia.Surface.MakeOffscreen(PAGE_WIDTH, PAGE_HEIGHT) ?? Skia.Surface.Make(PAGE_WIDTH, PAGE_HEIGHT);
  if (!surface) throw new Error("Could not create export surface");
  surface.getCanvas().drawImageRect(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    Skia.XYWHRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT),
    Skia.Paint(),
    true,
  );
  return surface.makeImageSnapshot();
}

export const SeriesExporter = forwardRef<SeriesExporterHandle>(function SeriesExporter(_, ref) {
  const canvasRef = useCanvasRef();
  const [job, setJob] = useState<Job | null>(null);
  const readyRef = useRef<(() => void) | null>(null);
  const busyRef = useRef(false);

  useImperativeHandle(ref, () => ({
    renderAll: async (pages, template, pageColor, onPage) => {
      if (busyRef.current) throw new Error("Already saving");
      busyRef.current = true;
      try {
        // Load every image first so each page draws complete on its first frame.
        const uris = new Set(pages.flatMap((p) => p.items.flatMap((i) => imageUrisOf(i.tweet))));
        await Promise.all([...uris].map(loadImage));

        for (let i = 0; i < pages.length; i++) {
          const ready = new Promise<void>((resolve) => { readyRef.current = resolve; });
          setJob({ page: pages[i], template, pageColor, token: i + Date.now() });
          await withTimeout(ready, 10_000, "A card took too long to render");
          await nextFrames();
          const snapshot = canvasRef.current?.makeImageSnapshot();
          if (!snapshot) throw new Error("Could not render a card");
          await onPage(normalize(snapshot), i);
        }
      } finally {
        busyRef.current = false;
        setJob(null);
      }
    },
  }));

  return (
    <View style={s.offscreen} pointerEvents="none">
      {job && (
        <PageRenderer
          key={job.token}
          page={job.page}
          template={job.template}
          pageColor={job.pageColor}
          // Sized in dp so the canvas is exactly 1080 physical pixels wide on any device.
          width={PAGE_WIDTH / PixelRatio.get()}
          canvasRef={canvasRef}
          onReady={() => readyRef.current?.()}
        />
      )}
    </View>
  );
});

const s = StyleSheet.create({ offscreen: { position: "absolute", top: -10000, left: -10000 } });