import { Skia, type SkImage } from '@shopify/react-native-skia';
import type { TransformState } from '../../hooks/useTransformGesture';

type Options = {
  frameWidth: number;
  frameHeight: number;
  backgroundColor: string;
  cardImage: SkImage;
  transform: TransformState;
};

// Composites the rendered card image onto a background canvas of
// arbitrary size, applying the user's pan/pinch/rotate transform.
// Runs fully imperatively (no React tree) so there's no render-timing
// race with the interactive on-screen preview.
//
// NOTE: verify Skia.Surface.MakeOffscreen against your installed
// @shopify/react-native-skia version (2.2.12) — this needs a quick
// on-device check since it can't be exercised in this environment.
// If it's unavailable, Skia.Surface.Make(width, height) is the CPU
// raster equivalent with the same call shape.
export function renderFramedImage(opts: Options): SkImage {
  const surface =
    Skia.Surface.MakeOffscreen(opts.frameWidth, opts.frameHeight) ??
    Skia.Surface.Make(opts.frameWidth, opts.frameHeight);
  if (!surface) throw new Error('Could not create offscreen surface for export');

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(opts.backgroundColor));

  const { cardImage, transform } = opts;
  const cx = opts.frameWidth / 2 + transform.translateX;
  const cy = opts.frameHeight / 2 + transform.translateY;

  canvas.save();
  canvas.translate(cx, cy);
  canvas.rotate((transform.rotation * 180) / Math.PI, 0, 0);
  canvas.scale(transform.scale, transform.scale);
  canvas.translate(-cardImage.width() / 2, -cardImage.height() / 2);
  canvas.drawImage(cardImage, 0, 0);
  canvas.restore();

  const snapshot = surface.makeImageSnapshot();
  if (!snapshot) throw new Error('Could not snapshot the composited frame');
  return snapshot;
}