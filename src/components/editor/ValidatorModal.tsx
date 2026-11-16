import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, CheckCircle2, ChevronRight, X } from 'lucide-react-native';
import { ValidationIssue } from '../../types/story';
import { useTopInset } from '../../utils/useTopInset';

interface ValidatorModalProps {
  visible: boolean;
  issues: ValidationIssue[];
  onSelectScene: (sceneId: string) => void;
  onClose: () => void;
}

export function ValidatorModal({
  visible,
  issues,
  onSelectScene,
  onClose,
}: ValidatorModalProps) {
  const topInset = useTopInset();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Story Graph Diagnostics</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color="#334155" />
          </TouchableOpacity>
        </View>

        {issues.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>All Paths Valid!</Text>
            <Text style={styles.emptySub}>
              No unlinked choices, dead ends, or unreachable orphan scenes found.
            </Text>
          </View>
        ) : (
          <FlatList
            data={issues}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.issueCard}
                disabled={!item.sceneId}
                onPress={() => {
                  if (item.sceneId) {
                    onClose();
                    onSelectScene(item.sceneId);
                  }
                }}
              >
                <AlertTriangle size={20} color="#D97706" style={styles.icon} />
                <View style={styles.issueBody}>
                  <Text style={styles.issueType}>{item.type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.issueMessage}>{item.message}</Text>
                </View>
                {item.sceneId && <ChevronRight size={18} color="#94A3B8" />}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  closeBtn: { padding: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  listContent: { padding: 16, gap: 10 },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  icon: { marginRight: 12 },
  issueBody: { flex: 1 },
  issueType: { fontSize: 11, fontWeight: '700', color: '#B45309', marginBottom: 2 },
  issueMessage: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
});
