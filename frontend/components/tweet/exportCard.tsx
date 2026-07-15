import { useCanvasRef, ImageFormat, type SkImage } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

type CanvasRef = ReturnType<typeof useCanvasRef>;

async function imageToFile(image: SkImage): Promise<string> {
  // Skia's SkImage encodes straight to base64 — no Buffer polyfill
  // needed, which RN doesn't have by default.
  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);

  const path = `${FileSystem.cacheDirectory}xtogram-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return path;
}

function snapshotFromCanvas(canvasRef: CanvasRef): SkImage {
  const canvas = canvasRef.current;
  if (!canvas) throw new Error("Canvas not ready");
  const image = canvas.makeImageSnapshot();
  if (!image) throw new Error("Could not snapshot canvas");
  return image;
}

// Saves directly to the camera roll. Requires media library permission.
export async function saveImageToLibrary(image: SkImage): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to save photos was denied");
  }
  const path = await imageToFile(image);
  await MediaLibrary.saveToLibraryAsync(path);
}

// Opens the native share sheet (Instagram, Messages, etc.) with the PNG.
export async function shareImage(image: SkImage): Promise<void> {
  const path = await imageToFile(image);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error("Sharing is not available on this device");
  await Sharing.shareAsync(path, { mimeType: "image/png" });
}

// Back-compat wrappers for the plain (non-framed) canvas-ref export path.
export async function saveCardToLibrary(canvasRef: CanvasRef): Promise<void> {
  await saveImageToLibrary(snapshotFromCanvas(canvasRef));
}

export async function shareCard(canvasRef: CanvasRef): Promise<void> {
  await shareImage(snapshotFromCanvas(canvasRef));
}