import { Paragraph } from "@shopify/react-native-skia";
import { type SkParagraph } from "@shopify/react-native-skia";

type Props = {
  paragraph: SkParagraph;
  x: number;
  y: number;
  width: number;
};

export function TweetText({ paragraph, x, y, width }: Props) {
  return <Paragraph paragraph={paragraph} x={x} y={y} width={width} />;
}