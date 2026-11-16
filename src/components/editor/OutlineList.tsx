import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Flag, GitBranch, Sparkles } from 'lucide-react-native';
import { Scene, ValidationIssue } from '../../types/story';

type FilterTab = 'ALL' | 'UNLINKED' | 'DEAD_ENDS' | 'ORPHANS' | 'ENDINGS';

interface OutlineListProps {
  scenes: Scene[];
  startSceneId: string | null;
  issues: ValidationIssue[];
  onSelectScene: (sceneId: string) => void;
}

export function OutlineList({
  scenes,
  startSceneId,
  issues,
  onSelectScene,
}: OutlineListProps) {
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const sceneTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of scenes) {
      map.set(s.id, s.title || 'Untitled Scene');
    }
    return map;
  }, [scenes]);

  const orphanIds = useMemo(
    () => new Set(issues.filter((i) => i.type === 'ORPHAN_SCENE').map((i) => i.sceneId!)),
    [issues]
  );

  const filteredScenes = useMemo(() => {
    switch (filter) {
      case 'UNLINKED':
        return scenes.filter((s) =>
          s.choices.some((c) => !c.targetSceneId || !sceneTitleMap.has(c.targetSceneId))
        );
      case 'DEAD_ENDS':
        return scenes.filter((s) => !s.isEnding && s.choices.length === 0);
      case 'ORPHANS':
        return scenes.filter((s) => orphanIds.has(s.id));
      case 'ENDINGS':
        return scenes.filter((s) => s.isEnding);
      default:
        return scenes;
    }
  }, [filter, scenes, orphanIds, sceneTitleMap]);

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: 'ALL', label: `All (${scenes.length})` },
    { key: 'UNLINKED', label: 'Unlinked' },
    { key: 'DEAD_ENDS', label: 'Dead Ends' },
    { key: 'ORPHANS', label: 'Orphans' },
    { key: 'ENDINGS', label: 'Endings' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text
                style={[styles.filterText, filter === item.key && styles.filterTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredScenes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No scenes match this filter.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isStart = item.id === startSceneId;
          const isOrphan = orphanIds.has(item.id);
          const hasUnlinked = item.choices.some(
            (c) => !c.targetSceneId || !sceneTitleMap.has(c.targetSceneId)
          );
          const isDeadEnd = !item.isEnding && item.choices.length === 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectScene(item.id)}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title || 'Untitled Scene'}
                </Text>
                <View style={styles.badges}>
                  {isStart && (
                    <View style={styles.startBadge}>
                      <Flag size={11} color="#FFFFFF" />
                      <Text style={styles.startBadgeText}>START</Text>
                    </View>
                  )}
                  {item.isEnding && (
                    <View style={styles.endingBadge}>
                      <Sparkles size={11} color="#059669" />
                      <Text style={styles.endingBadgeText}>
                        {item.endingType ?? 'ENDING'}
                      </Text>
                    </View>
                  )}
                  {(hasUnlinked || isDeadEnd || isOrphan) && (
                    <View style={styles.warnBadge}>
                      <AlertTriangle size={11} color="#B45309" />
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.cardPreview} numberOfLines={2}>
                {item.content || 'Tap to write narrative prose...'}
              </Text>

              {!item.isEnding && (
                <View style={styles.choicesWrap}>
                  {item.choices.length === 0 ? (
                    <Text style={styles.deadEndText}>No choices defined (Dead end)</Text>
                  ) : (
                    item.choices.map((c) => {
                      const targetTitle = c.targetSceneId
                        ? sceneTitleMap.get(c.targetSceneId)
                        : null;
                      return (
                        <View
                          key={c.id}
                          style={[
                            styles.choicePill,
                            targetTitle ? styles.choicePillLinked : styles.choicePillUnlinked,
                          ]}
                        >
                          <GitBranch
                            size={11}
                            color={targetTitle ? '#4338CA' : '#B45309'}
                          />
                          <Text
                            style={[
                              styles.choicePillText,
                              targetTitle ? styles.choiceTextLinked : styles.choiceTextUnlinked,
                            ]}
                            numberOfLines={1}
                          >
                            {c.text || 'Untitled'} → {targetTitle ?? 'Unlinked'}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  filterContent: { paddingHorizontal: 14, gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { padding: 14, paddingBottom: 100 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#64748B' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  startBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  endingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  endingBadgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  warnBadge: {
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 6,
  },
  cardPreview: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 8 },
  choicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  deadEndText: { fontSize: 12, color: '#B45309', fontStyle: 'italic' },
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
  },
  choicePillLinked: { backgroundColor: '#EEF2FF' },
  choicePillUnlinked: { backgroundColor: '#FEF3C7' },
  choicePillText: { fontSize: 12, fontWeight: '500', flexShrink: 1 },
  choiceTextLinked: { color: '#4338CA' },
  choiceTextUnlinked: { color: '#B45309' },
});
