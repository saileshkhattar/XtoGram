import { Skia, type SkImage } from '@shopify/react-native-skia';
import type { TransformState } from '../../hooks/useTransformGesture';

type Options = {
  frameWidth: number;
  frameHeight: number;
  backgroundColor: string;
  cardImage: SkImage;
  transform: TransformState;
};


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