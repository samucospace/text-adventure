import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Plus, Search, Unlink, X } from 'lucide-react-native';
import { Scene } from '../../types/story';

interface ChoiceLinkerModalProps {
  visible: boolean;
  scenes: Scene[];
  currentSceneId: string;
  selectedTargetId: string | null;
  onSelectTarget: (targetSceneId: string | null) => void;
  onCreateAndLink: (newSceneTitle: string) => Promise<void>;
  onClose: () => void;
}

export function ChoiceLinkerModal({
  visible,
  scenes,
  currentSceneId,
  selectedTargetId,
  onSelectTarget,
  onCreateAndLink,
  onClose,
}: ChoiceLinkerModalProps) {
  const [query, setQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredScenes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenes.filter((s) => {
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
      );
    });
  }, [scenes, query]);

  const handleCreate = async () => {
    const title = newTitle.trim() || `Scene ${scenes.length + 1}`;
    setIsCreating(true);
    try {
      await onCreateAndLink(title);
      setNewTitle('');
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Link Choice Destination</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#334155" />
          </TouchableOpacity>
        </View>

        <View style={styles.createBox}>
          <Text style={styles.sectionLabel}>Create & Link New Scene</Text>
          <View style={styles.createRow}>
            <TextInput
              style={styles.createInput}
              placeholder="New scene title..."
              placeholderTextColor="#94A3B8"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TouchableOpacity
              style={[styles.createBtn, isCreating && styles.disabledBtn]}
              onPress={handleCreate}
              disabled={isCreating}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.unlinkRow, selectedTargetId === null && styles.selectedRow]}
          onPress={() => {
            onSelectTarget(null);
            onClose();
          }}
        >
          <View style={styles.rowLeft}>
            <Unlink size={18} color="#D97706" />
            <Text style={styles.unlinkText}>Leave Unlinked (Draft)</Text>
          </View>
          {selectedTargetId === null && <Check size={18} color="#4F46E5" />}
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search existing scenes..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={filteredScenes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedTargetId;
            const isSelf = item.id === currentSceneId;
            return (
              <TouchableOpacity
                style={[styles.sceneRow, isSelected && styles.selectedRow]}
                onPress={() => {
                  onSelectTarget(item.id);
                  onClose();
                }}
              >
                <View style={styles.sceneInfo}>
                  <View style={styles.titleLine}>
                    <Text style={styles.sceneTitle} numberOfLines={1}>
                      {item.title || 'Untitled Scene'}
                    </Text>
                    {isSelf && <Text style={styles.selfBadge}>Self-Loop</Text>}
                    {item.isEnding && <Text style={styles.endingBadge}>Ending</Text>}
                  </View>
                  <Text style={styles.scenePreview} numberOfLines={1}>
                    {item.content || 'No narrative text yet'}
                  </Text>
                </View>
                {isSelected && <Check size={18} color="#4F46E5" />}
              </TouchableOpacity>
            );
          }}
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
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  createRow: { flexDirection: 'row', gap: 8 },
  createInput: {
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  disabledBtn: { opacity: 0.6 },
  createBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  unlinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unlinkText: { fontSize: 15, fontWeight: '600', color: '#B45309' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  listContent: { paddingHorizontal: 12, paddingBottom: 32 },
  sceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  selectedRow: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  sceneInfo: { flex: 1, marginRight: 8 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sceneTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', flexShrink: 1 },
  selfBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  endingBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scenePreview: { fontSize: 13, color: '#64748B' },
});
