import { Skia, TileMode, type SkImage } from '@shopify/react-native-skia';
import type { TransformState } from '../../hooks/useTransformGesture';

type Options = {
  frameWidth: number;
  frameHeight: number;
  backgroundColor: string;
  cardImage: SkImage;
  transform: TransformState;
  backgroundImageUri?: string;
  backgroundImageBlur?: number;
};

/** Draws an image with the same cover behaviour as React Native Image. */
function drawCoverImage(canvas: ReturnType<NonNullable<ReturnType<typeof Skia.Surface.MakeOffscreen>>['getCanvas']>, image: SkImage, width: number, height: number, blur = 0) {
  const scale = Math.max(width / image.width(), height / image.height());
  const destinationWidth = image.width() * scale;
  const destinationHeight = image.height() * scale;
  const left = (width - destinationWidth) / 2;
  const top = (height - destinationHeight) / 2;
  const paint = Skia.Paint();
  if (blur > 0) paint.setImageFilter(Skia.ImageFilter.MakeBlur(blur, blur, TileMode.Clamp, null));
  canvas.drawImageRect(image, Skia.XYWHRect(0, 0, image.width(), image.height()), Skia.XYWHRect(left, top, destinationWidth, destinationHeight), paint, true);
}

export async function renderFramedImage(opts: Options): Promise<SkImage> {
  const surface =
    Skia.Surface.MakeOffscreen(opts.frameWidth, opts.frameHeight) ??
    Skia.Surface.Make(opts.frameWidth, opts.frameHeight);
  if (!surface) throw new Error('Could not create offscreen surface for export');

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(opts.backgroundColor));
  if (opts.backgroundImageUri) {
    const data = await Skia.Data.fromURI(opts.backgroundImageUri);
    const backgroundImage = Skia.Image.MakeImageFromEncoded(data);
    if (backgroundImage) drawCoverImage(canvas, backgroundImage, opts.frameWidth, opts.frameHeight, opts.backgroundImageBlur);
  }

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
