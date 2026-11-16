import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  List,
  Network,
  Play,
  Plus,
  Settings,
  X,
} from 'lucide-react-native';
import { GraphCanvas } from '../../components/editor/GraphCanvas';
import { OutlineList } from '../../components/editor/OutlineList';
import { SceneEditorModal } from '../../components/editor/SceneEditorModal';
import { ValidatorModal } from '../../components/editor/ValidatorModal';
import { useEditorStore } from '../../store/useEditorStore';
import { Scene } from '../../types/story';
import { useTopInset } from '../../utils/useTopInset';

export default function StoryEditorScreen() {
  const topInset = useTopInset();
  const route = useRoute<RouteProp<RootStackParamList, 'Editor'>>();
  const { storyId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    story,
    scenes,
    viewMode,
    selectedSceneId,
    isLoading,
    loadStory,
    clearEditor,
    setViewMode,
    selectScene,
    updateStoryMeta,
    addScene,
    saveScene,
    deleteScene,
    updateNodePosition,
    runAutoLayout,
    getValidationIssues,
  } = useEditorStore();

  const [validatorVisible, setValidatorVisible] = useState(false);
  const [metaVisible, setMetaVisible] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSynopsis, setMetaSynopsis] = useState('');

  useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    }
    return () => clearEditor();
  }, [storyId]);

  const issues = useMemo(() => getValidationIssues(), [story, scenes]);
  const selectedScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId]
  );

  const openMetaModal = () => {
    if (!story) return;
    setMetaTitle(story.title);
    setMetaAuthor(story.author);
    setMetaSynopsis(story.synopsis);
    setMetaVisible(true);
  };

  const handleSaveMeta = async () => {
    await updateStoryMeta({
      title: metaTitle.trim() || 'Untitled Adventure',
      author: metaAuthor.trim(),
      synopsis: metaSynopsis.trim(),
    });
    setMetaVisible(false);
  };

  const handleAddNewScene = async () => {
    const created = await addScene();
    if (created) {
      selectScene(created.id);
    }
  };

  const handleCreateAndLink = async (title: string, parent: Scene): Promise<Scene | null> => {
    return addScene({
      title,
      positionX: parent.positionX + 40,
      positionY: parent.positionY + 160,
    });
  };

  if (isLoading || !story) {
    return (
      <View style={[styles.loader, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.titleBtn} onPress={openMetaModal}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <Settings size={14} color="#64748B" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.issueBadge,
              issues.length > 0 ? styles.issueBadgeWarn : styles.issueBadgeOk,
            ]}
            onPress={() => setValidatorVisible(true)}
          >
            {issues.length > 0 ? (
              <AlertTriangle size={14} color="#B45309" />
            ) : (
              <CheckCircle2 size={14} color="#059669" />
            )}
            <Text
              style={[
                styles.issueBadgeText,
                issues.length > 0 ? styles.issueTextWarn : styles.issueTextOk,
              ]}
            >
              {issues.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playTestBtn}
            onPress={() => navigation.navigate('Play', { storyId: story.id })}
          >
            <Play size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dual-Mode Segmented Toggle */}
      <View style={styles.modeBar}>
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segBtn, viewMode === 'outline' && styles.segBtnActive]}
            onPress={() => setViewMode('outline')}
          >
            <List size={15} color={viewMode === 'outline' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.segText, viewMode === 'outline' && styles.segTextActive]}>
              Outline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segBtn, viewMode === 'map' && styles.segBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Network size={15} color={viewMode === 'map' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.segText, viewMode === 'map' && styles.segTextActive]}>
              Story Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Mode Canvas or Outline */}
      <View style={styles.body}>
        {viewMode === 'outline' ? (
          <OutlineList
            scenes={scenes}
            startSceneId={story.startSceneId}
            issues={issues}
            onSelectScene={(id) => selectScene(id)}
          />
        ) : (
          <GraphCanvas
            scenes={scenes}
            startSceneId={story.startSceneId}
            issues={issues}
            onSelectScene={(id) => selectScene(id)}
            onUpdateNodePosition={updateNodePosition}
            onAutoLayout={runAutoLayout}
          />
        )}

        {/* Add Scene FAB */}
        <TouchableOpacity style={styles.fab} onPress={handleAddNewScene}>
          <Plus size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>Scene</Text>
        </TouchableOpacity>
      </View>

      {/* Scene Editor Modal */}
      <SceneEditorModal
        visible={selectedScene !== null}
        scene={selectedScene}
        allScenes={scenes}
        isStartScene={selectedScene?.id === story.startSceneId}
        onSetStartScene={async (id) => {
          await updateStoryMeta({ startSceneId: id });
        }}
        onSaveScene={saveScene}
        onCreateAndLinkScene={handleCreateAndLink}
        onDeleteScene={(id) => deleteScene(id)}
        onClose={() => selectScene(null)}
      />

      {/* Graph Validator Diagnostics Modal */}
      <ValidatorModal
        visible={validatorVisible}
        issues={issues}
        onSelectScene={(id) => selectScene(id)}
        onClose={() => setValidatorVisible(false)}
      />

      {/* Story Metadata Modal */}
      <Modal
        visible={metaVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMetaVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: topInset }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Story Settings</Text>
            <TouchableOpacity
              onPress={() => setMetaVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color="#334155" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={metaTitle}
              onChangeText={setMetaTitle}
            />
            <Text style={styles.label}>Author</Text>
            <TextInput
              style={styles.input}
              value={metaAuthor}
              onChangeText={setMetaAuthor}
            />
            <Text style={styles.label}>Synopsis</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={metaSynopsis}
              onChangeText={setMetaSynopsis}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveMetaBtn} onPress={handleSaveMeta}>
              <Text style={styles.saveMetaText}>Save Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconBtn: { padding: 8 },
  titleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  issueBadgeWarn: { backgroundColor: '#FEF3C7' },
  issueBadgeOk: { backgroundColor: '#D1FAE5' },
  issueBadgeText: { fontSize: 12, fontWeight: '700' },
  issueTextWarn: { color: '#B45309' },
  issueTextOk: { color: '#059669' },
  playTestBtn: {
    backgroundColor: '#4F46E5',
    padding: 8,
    borderRadius: 8,
  },
  modeBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segBtnActive: { backgroundColor: '#4F46E5' },
  segText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  segTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalBody: { padding: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  textArea: { minHeight: 90 },
  saveMetaBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveMetaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
