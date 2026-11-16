import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BookmarkPlus, Play, Trash2, X } from 'lucide-react-native';
import { PlaySession } from '../../types/story';
import { useTopInset } from '../../utils/useTopInset';

interface SaveSlotsModalProps {
  visible: boolean;
  savedSlots: PlaySession[];
  onSaveNewSlot: (slotName: string) => Promise<void>;
  onLoadSlot: (session: PlaySession) => Promise<void>;
  onDeleteSlot: (sessionId: string) => Promise<void>;
  onClose: () => void;
}

export function SaveSlotsModal({
  visible,
  savedSlots,
  onSaveNewSlot,
  onLoadSlot,
  onDeleteSlot,
  onClose,
}: SaveSlotsModalProps) {
  const topInset = useTopInset();
  const [slotName, setSlotName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveNewSlot(slotName);
      setSlotName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (session: PlaySession) => {
    Alert.alert(
      'Load Save',
      `Load "${session.slotName}"? Your current unsaved position will be replaced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            await onLoadSlot(session);
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
          <Text style={styles.headerTitle}>Save & Load Progress</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color="#334155" />
          </TouchableOpacity>
        </View>

        <View style={styles.createBox}>
          <Text style={styles.sectionLabel}>Create Manual Save</Text>
          <View style={styles.createRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Before opening the vault..."
              placeholderTextColor="#94A3B8"
              value={slotName}
              onChangeText={setSlotName}
            />
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.disabledBtn]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <BookmarkPlus size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={savedSlots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No saved slots yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.slotCard}>
              <View style={styles.slotInfo}>
                <View style={styles.slotTitleRow}>
                  <Text style={styles.slotName}>{item.slotName}</Text>
                  {item.isAutoSave && <Text style={styles.autoBadge}>AUTO</Text>}
                </View>
                <Text style={styles.slotMeta}>
                  {item.historyStack.length} step{item.historyStack.length === 1 ? '' : 's'} taken •{' '}
                  {new Date(item.savedAt).toLocaleString()}
                </Text>
              </View>

              <View style={styles.slotActions}>
                <TouchableOpacity style={styles.loadBtn} onPress={() => handleLoad(item)}>
                  <Play size={14} color="#4F46E5" />
                  <Text style={styles.loadBtnText}>Load</Text>
                </TouchableOpacity>

                {!item.isAutoSave && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onDeleteSlot(item.id)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
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
  createBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  createRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 16 },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#64748B' },
  slotCard: {
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
  slotInfo: { flex: 1, marginRight: 12 },
  slotTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  autoBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  slotActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  loadBtnText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  deleteBtn: { padding: 6 },
});
