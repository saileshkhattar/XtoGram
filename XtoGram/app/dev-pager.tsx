import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import fixtures from "../dev/fixtures-parsed.json";
import { PagePager } from "../components/tweet/scene/PagePager";
import { planPages } from "../components/tweet/scene/plan";
import { useTweetFonts } from "../components/tweet/skia/fonts";
import { getTemplatesForShape } from "../components/tweet/templates/definations";
import { getShape } from "../utils/conversation";
import type { Tweet } from "../types/tweet";
import { useWindowDimensions } from "react-native";

type Fixture = { label: string; nodes: Tweet[] };
const FIXTURES = fixtures as unknown as Fixture[];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={{ color: active ? "#000" : "#ddd" }}>{label}</Text>
    </Pressable>
  );
}

export default function DevPager() {
  const fontMgr = useTweetFonts();
  const [fixtureIdx, setFixtureIdx] = useState(1);
  const [count, setCount] = useState<number | null>(null);      // slice the fixture to test fit
  const [templateIdx, setTemplateIdx] = useState(0);
  const [oneOverride, setOneOverride] = useState<boolean | null>(null);

  const fixture = FIXTURES[fixtureIdx];
  const nodes = useMemo(() => fixture.nodes.slice(0, count ?? fixture.nodes.length), [fixture, count]);
  const shape = getShape(nodes);
  const templates = getTemplatesForShape(shape);
  const template = templates[Math.min(templateIdx, templates.length - 1)];

  const { width: screenW } = useWindowDimensions();

  const plan = useMemo(
    () => (fontMgr ? planPages({ nodes, template, fontMgr }) : null),
    [fontMgr, nodes, template],
  );

  const pick = (i: number) => { setFixtureIdx(i); setCount(null); setTemplateIdx(0); setOneOverride(null); };

  if (!plan) return <View style={s.root}><Text style={s.text}>Loading fonts…</Text></View>;

  const showOne = oneOverride ?? plan.mode === "one";
  const pages = showOne && plan.onePage ? [plan.onePage] : plan.series;
  const total = fixture.nodes.length;

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingTop: 60, paddingBottom: 40, gap: 12 }}>
      <View style={s.row}>
        {FIXTURES.map((f, i) => <Chip key={f.label} label={f.label} active={i === fixtureIdx} onPress={() => pick(i)} />)}
      </View>
      <View style={s.row}>
        {templates.map((t, i) => <Chip key={t.id} label={t.name} active={t.id === template.id} onPress={() => setTemplateIdx(i)} />)}
      </View>
      <View style={s.row}>
        <Chip label="−" active={false} onPress={() => setCount(Math.max(1, (count ?? total) - 1))} />
        <Text style={s.text}>{nodes.length}/{total} nodes</Text>
        <Chip label="+" active={false} onPress={() => setCount(Math.min(total, (count ?? total) + 1))} />
        {plan.onePage && nodes.length > 1 && (
          <Chip label={showOne ? "One page" : "Series"} active onPress={() => setOneOverride(!showOne)} />
        )}
      </View>
      <Text style={s.text}>
        shape {shape} · mode {plan.mode} · fit {plan.fitScale ?? "< 0.6"} · {pages.length} page(s)
      </Text>
      <PagePager key={`${fixtureIdx}-${nodes.length}-${template.id}-${showOne}`} pages={pages} template={template} width={screenW - 32} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, alignItems: "center" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#444" },
  chipActive: { backgroundColor: "#ddd" },
  text: { color: "#ddd", paddingHorizontal: 16 },
});