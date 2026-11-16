import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CornerUpLeft, History, X } from 'lucide-react-native';
import { HistoryStep } from '../../types/story';
import { useTopInset } from '../../utils/useTopInset';

interface RewindDrawerProps {
  visible: boolean;
  currentSceneTitle: string;
  historyStack: HistoryStep[];
  onRewindToStep: (stepIndex: number) => Promise<void>;
  onClose: () => void;
}

export function RewindDrawer({
  visible,
  currentSceneTitle,
  historyStack,
  onRewindToStep,
  onClose,
}: RewindDrawerProps) {
  const topInset = useTopInset();
  const handleSelectStep = (stepIndex: number, title: string) => {
    Alert.alert(
      'Rewind Story',
      `Rewind back to Step ${stepIndex + 1}: "${title}"? Any steps after this will be cleared from your current timeline.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rewind',
          onPress: async () => {
            await onRewindToStep(stepIndex);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <History size={20} color="#4F46E5" />
            <Text style={styles.headerTitle}>Rewind Timeline</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color="#334155" />
          </TouchableOpacity>
        </View>

        <View style={styles.currentBox}>
          <Text style={styles.currentLabel}>CURRENT SCENE (STEP {historyStack.length + 1})</Text>
          <Text style={styles.currentTitle}>{currentSceneTitle}</Text>
        </View>

        {historyStack.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              You are at the start of the story. Make choices to build your timeline.
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...historyStack].reverse()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stepCard}
                onPress={() => handleSelectStep(item.stepIndex, item.sceneTitleSnapshot)}
              >
                <View style={styles.stepLeft}>
                  <Text style={styles.stepNumber}>Step {item.stepIndex + 1}</Text>
                  <Text style={styles.stepScene}>{item.sceneTitleSnapshot}</Text>
                  {item.chosenChoiceText && (
                    <Text style={styles.stepChoice}>Chose: “{item.chosenChoiceText}”</Text>
                  )}
                </View>
                <View style={styles.rewindPill}>
                  <CornerUpLeft size={14} color="#4F46E5" />
                  <Text style={styles.rewindText}>Rewind</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  closeBtn: { padding: 4 },
  currentBox: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  currentLabel: { fontSize: 11, fontWeight: '700', color: '#4338CA', marginBottom: 2 },
  currentTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  listContent: { padding: 16 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  stepLeft: { flex: 1, marginRight: 12 },
  stepNumber: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  stepScene: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  stepChoice: { fontSize: 13, color: '#475569', marginTop: 4, fontStyle: 'italic' },
  rewindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewindText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
});
