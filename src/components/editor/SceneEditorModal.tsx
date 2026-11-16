import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  Flag,
  Link2,
  Plus,
  Save,
  Trash2,
  Unlink,
  X,
} from 'lucide-react-native';
import { Choice, EndingType, Scene } from '../../types/story';
import { generateId } from '../../utils/id';
import { ChoiceLinkerModal } from './ChoiceLinkerModal';

const ENDING_TYPES: EndingType[] = ['VICTORY', 'DEATH', 'NEUTRAL', 'CLIFFHANGER'];

interface SceneEditorModalProps {
  visible: boolean;
  scene: Scene | null;
  allScenes: Scene[];
  isStartScene: boolean;
  onSetStartScene: (sceneId: string) => Promise<void>;
  onSaveScene: (updated: Scene) => Promise<void>;
  onCreateAndLinkScene: (title: string, parentScene: Scene) => Promise<Scene | null>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onClose: () => void;
}

export function SceneEditorModal({
  visible,
  scene,
  allScenes,
  isStartScene,
  onSetStartScene,
  onSaveScene,
  onCreateAndLinkScene,
  onDeleteScene,
  onClose,
}: SceneEditorModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [endingType, setEndingType] = useState<EndingType>('NEUTRAL');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [linkingChoiceId, setLinkingChoiceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (scene) {
      setTitle(scene.title);
      setContent(scene.content);
      setIsEnding(scene.isEnding);
      setEndingType(scene.endingType ?? 'NEUTRAL');
      setChoices(scene.choices.map((c) => ({ ...c })));
    }
  }, [scene]);

  const sceneTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of allScenes) {
      map.set(s.id, s.title || 'Untitled Scene');
    }
    return map;
  }, [allScenes]);

  const incomingCount = useMemo(() => {
    if (!scene) return 0;
    let count = 0;
    for (const s of allScenes) {
      if (s.id === scene.id) continue;
      for (const c of s.choices) {
        if (c.targetSceneId === scene.id) count++;
      }
    }
    return count;
  }, [allScenes, scene]);

  if (!scene) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const buildDraftScene = (overrideChoices?: Choice[]): Scene => ({
    ...scene,
    title: title.trim() || 'Untitled Scene',
    content,
    isEnding,
    endingType: isEnding ? endingType : null,
    choices: (overrideChoices ?? choices).map((c, idx) => ({
      ...c,
      orderIndex: idx,
    })),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveScene(buildDraftScene());
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: generateId(),
      sceneId: scene.id,
      text: '',
      targetSceneId: null,
      orderIndex: choices.length,
    };
    setChoices([...choices, newChoice]);
  };

  const handleUpdateChoiceText = (choiceId: string, text: string) => {
    setChoices((prev) =>
      prev.map((c) => (c.id === choiceId ? { ...c, text } : c))
    );
  };

  const handleMoveChoice = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= choices.length) return;
    const copy = [...choices];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setChoices(copy);
  };

  const handleDeleteChoice = (choiceId: string) => {
    setChoices((prev) => prev.filter((c) => c.id !== choiceId));
  };

  const handleDeleteScenePress = () => {
    const warning =
      incomingCount > 0
        ? `This scene is linked from ${incomingCount} choice(s) in other scenes. Deleting it will mark those choices as unlinked.`
        : 'Are you sure you want to delete this scene?';

    Alert.alert('Delete Scene', warning, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await onDeleteScene(scene.id);
          onClose();
        },
      },
    ]);
  };

  const linkingChoice = choices.find((c) => c.id === linkingChoiceId) ?? null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <X size={22} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Scene</Text>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Top metadata bar */}
          <View style={styles.metaRow}>
            <TouchableOpacity
              style={[styles.startBadgeBtn, isStartScene && styles.startBadgeActive]}
              onPress={() => onSetStartScene(scene.id)}
              disabled={isStartScene}
            >
              <Flag size={14} color={isStartScene ? '#FFFFFF' : '#4F46E5'} />
              <Text style={[styles.startBadgeText, isStartScene && styles.startBadgeTextActive]}>
                {isStartScene ? 'Starting Scene' : 'Set as Start Scene'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteSceneBtn} onPress={handleDeleteScenePress}>
              <Trash2 size={16} color="#DC2626" />
              <Text style={styles.deleteSceneText}>Delete</Text>
            </TouchableOpacity>
          </View>

          {/* Scene Title */}
          <Text style={styles.label}>Scene Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="e.g., The Whispering Gate"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          {/* Narrative Content */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Narrative Prose</Text>
            <Text style={styles.wordCount}>{wordCount} words</Text>
          </View>
          <TextInput
            style={styles.contentInput}
            placeholder="Write what happens in this scene..."
            placeholderTextColor="#94A3B8"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Ending Toggle */}
          <View style={styles.endingBox}>
            <View style={styles.endingToggleRow}>
              <View>
                <Text style={styles.endingTitle}>Mark as Ending</Text>
                <Text style={styles.endingSub}>Ends the playthrough when reached</Text>
              </View>
              <Switch value={isEnding} onValueChange={setIsEnding} trackColor={{ true: '#4F46E5' }} />
            </View>

            {isEnding && (
              <View style={styles.endingTypeRow}>
                {ENDING_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.endingChip,
                      endingType === type && styles.endingChipActive,
                    ]}
                    onPress={() => setEndingType(type)}
                  >
                    <Text
                      style={[
                        styles.endingChipText,
                        endingType === type && styles.endingChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Choices Section */}
          {!isEnding && (
            <View style={styles.choicesSection}>
              <View style={styles.choicesHeader}>
                <Text style={styles.label}>Decisions / Choices ({choices.length})</Text>
                <TouchableOpacity style={styles.addChoiceBtn} onPress={handleAddChoice}>
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addChoiceText}>Add Choice</Text>
                </TouchableOpacity>
              </View>

              {choices.length === 0 ? (
                <View style={styles.noChoicesBox}>
                  <Text style={styles.noChoicesText}>
                    No choices yet. Add at least one choice or mark this scene as an ending.
                  </Text>
                </View>
              ) : (
                choices.map((choice, idx) => {
                  const targetName = choice.targetSceneId
                    ? sceneTitleMap.get(choice.targetSceneId) ?? 'Missing Scene'
                    : null;

                  return (
                    <View key={choice.id} style={styles.choiceCard}>
                      <View style={styles.choiceCardTop}>
                        <Text style={styles.choiceIndex}>Choice {idx + 1}</Text>
                        <View style={styles.choiceActions}>
                          <TouchableOpacity
                            onPress={() => handleMoveChoice(idx, -1)}
                            disabled={idx === 0}
                            style={styles.smallIconBtn}
                          >
                            <ArrowUp size={16} color={idx === 0 ? '#CBD5E1' : '#475569'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMoveChoice(idx, 1)}
                            disabled={idx === choices.length - 1}
                            style={styles.smallIconBtn}
                          >
                            <ArrowDown
                              size={16}
                              color={idx === choices.length - 1 ? '#CBD5E1' : '#475569'}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteChoice(choice.id)}
                            style={styles.smallIconBtn}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TextInput
                        style={styles.choiceInput}
                        placeholder="e.g., Open the iron door"
                        placeholderTextColor="#94A3B8"
                        value={choice.text}
                        onChangeText={(txt) => handleUpdateChoiceText(choice.id, txt)}
                      />

                      <TouchableOpacity
                        style={[
                          styles.linkBtn,
                          targetName ? styles.linkBtnConnected : styles.linkBtnUnlinked,
                        ]}
                        onPress={() => setLinkingChoiceId(choice.id)}
                      >
                        {targetName ? (
                          <Link2 size={15} color="#4F46E5" />
                        ) : (
                          <Unlink size={15} color="#D97706" />
                        )}
                        <Text
                          style={[
                            styles.linkBtnText,
                            targetName ? styles.linkTextConnected : styles.linkTextUnlinked,
                          ]}
                          numberOfLines={1}
                        >
                          {targetName ? `Leads to: ${targetName}` : 'Tap to link destination scene'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        <ChoiceLinkerModal
          visible={linkingChoice !== null}
          scenes={allScenes}
          currentSceneId={scene.id}
          selectedTargetId={linkingChoice?.targetSceneId ?? null}
          onSelectTarget={(targetSceneId) => {
            if (!linkingChoice) return;
            setChoices((prev) =>
              prev.map((c) =>
                c.id === linkingChoice.id ? { ...c, targetSceneId } : c
              )
            );
          }}
          onCreateAndLink={async (newTitle) => {
            if (!linkingChoice) return;
            const created = await onCreateAndLinkScene(newTitle, buildDraftScene());
            if (created) {
              const updatedChoices = choices.map((c) =>
                c.id === linkingChoice.id ? { ...c, targetSceneId: created.id } : c
              );
              setChoices(updatedChoices);
              await onSaveScene(buildDraftScene(updatedChoices));
            }
          }}
          onClose={() => setLinkingChoiceId(null)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  startBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  startBadgeActive: { backgroundColor: '#4F46E5' },
  startBadgeText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  startBadgeTextActive: { color: '#FFFFFF' },
  deleteSceneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteSceneText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, textTransform: 'uppercase' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordCount: { fontSize: 12, color: '#94A3B8', marginBottom: 6 },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 160,
    lineHeight: 22,
    marginBottom: 16,
  },
  endingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 20,
  },
  endingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endingTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  endingSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  endingTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  endingChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endingChipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  endingChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  endingChipTextActive: { color: '#4F46E5' },
  choicesSection: { marginTop: 4 },
  choicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addChoiceText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  noChoicesBox: {
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noChoicesText: { fontSize: 13, color: '#92400E', lineHeight: 19 },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  choiceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  choiceIndex: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  choiceActions: { flexDirection: 'row', gap: 10 },
  smallIconBtn: { padding: 2 },
  choiceInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 8,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkBtnConnected: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  linkBtnUnlinked: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  linkBtnText: { fontSize: 13, fontWeight: '600', flex: 1 },
  linkTextConnected: { color: '#4338CA' },
  linkTextUnlinked: { color: '#B45309' },
});
