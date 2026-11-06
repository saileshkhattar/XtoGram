import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { PageRenderer } from "./PageRenderer";
import type { Page } from "./plan";
import type { CardTemplate } from "./types";
import { PREVIEW_RADIUS } from "../../ui/PreviewOutline";

export function PagePager({ pages, template, width, pageColor }: { pages: Page[]; template: CardTemplate, width : number, pageColor? :string }) {

  const [index, setIndex] = useState(0);
  if (pages.length === 0) return null;

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={pages}
        keyExtractor={(_, i) => String(i)}
        initialNumToRender={1}
        windowSize={3}
        style={{ width }}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, borderRadius: PREVIEW_RADIUS, overflow: 'hidden' }}>
            <PageRenderer page={item} template={template} width={width} pageColor={pageColor} />
          </View>
        )}
      />
      <Text style={{ textAlign: "center", color: "#999", marginTop: 8 }}>
        {index + 1}/{pages.length}
      </Text>
    </View>
  );
}