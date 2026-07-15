import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import type { TweetAuthor } from '../../types/tweet';

type Props = {
  author: TweetAuthor;
  children: React.ReactNode; // the image/content slot
};

export function InstagramFrame({ author, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: author.avatar }} style={styles.avatar} />
        <Text style={styles.username} numberOfLines={1}>
          {author.handle.replace(/^@/, '')}
        </Text>
        <Feather name="more-horizontal" size={18} color={Colors.TEXT_HIGH} />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Feather name="heart" size={23} color={Colors.TEXT_HIGH} style={styles.actionIcon} />
          <Feather name="message-circle" size={23} color={Colors.TEXT_HIGH} style={styles.actionIcon} />
          <Feather name="send" size={23} color={Colors.TEXT_HIGH} />
        </View>
        <Feather name="bookmark" size={23} color={Colors.TEXT_HIGH} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.SURFACE,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.SURFACE_RAISED,
  },
  username: {
    flex: 1,
    color: Colors.TEXT_HIGH,
    fontWeight: '600',
    fontSize: FontSize.bodySmall,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.BG_BASE,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginRight: Spacing.md,
  },
});