import React, { useCallback, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {
  BookOpen,
  Download,
  Edit3,
  Play,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { storyRepo } from '../db/storyRepo';
import { StoryWithCounts } from '../types/story';
import { parseImportedStoryBundle, serializeStoryToBundle } from '../utils/storySerializer';

export default function LibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stories, setStories] = useState<StoryWithCounts[]>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newSynopsis, setNewSynopsis] = useState('');

  const loadStories = useCallback(async () => {
    const list = await storyRepo.listStories();
    setStories(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [loadStories])
  );

  const handleCreateStory = async () => {
    const title = newTitle.trim() || 'Untitled Adventure';
    const created = await storyRepo.createStory({
      title,
      author: newAuthor.trim(),
      synopsis: newSynopsis.trim(),
    });
    setNewTitle('');
    setNewAuthor('');
    setNewSynopsis('');
    setCreateVisible(false);
    await loadStories();
    navigation.navigate('Editor', { storyId: created.id });
  };

  const handleDeleteStory = (story: StoryWithCounts) => {
    Alert.alert(
      'Delete Story',
      `Are you sure you want to delete "${story.title}" and all its scenes and save files?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storyRepo.deleteStory(story.id);
            await loadStories();
          },
        },
      ]
    );
  };

  const handleExportStory = async (storyId: string) => {
    try {
      const data = await storyRepo.getStoryWithScenes(storyId);
      if (!data) return;
      const bundle = serializeStoryToBundle(data.story, data.scenes);
      const safeName = data.story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'story';
      const filePath = `${RNFS.CachesDirectoryPath}/${safeName}.cyoa.json`;
      await RNFS.writeFile(filePath, JSON.stringify(bundle, null, 2), 'utf8');
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        failOnCancel: false,
      });
    } catch (err) {
      Alert.alert('Export Failed', String(err));
    }
  };

  const handleImportStory = async () => {
    try {
      const [picked] = await pick({
        type: [types.json, types.allFiles],
      });
      if (!picked) return;
      const [localCopy] = await keepLocalCopy({
        files: [{ uri: picked.uri, fileName: picked.name ?? 'story.cyoa.json' }],
        destination: 'cachesDirectory',
      });
      if (localCopy.status !== 'success') {
        throw new Error('Could not copy selected file');
      }
      const content = await RNFS.readFile(localCopy.localUri, 'utf8');
      const { story, scenes } = parseImportedStoryBundle(content);
      await storyRepo.importStoryBundle(story, scenes);
      await loadStories();
      Alert.alert('Imported', `"${story.title}" added to your library.`);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert('Import Failed', 'Could not parse the selected CYOA JSON file.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <BookOpen size={24} color="#4F46E5" />
          <Text style={styles.headerTitle}>Adventure Forge</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.importBtn} onPress={handleImportStory}>
            <Download size={18} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={() => setCreateVisible(true)}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New Story</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Stories Yet</Text>
            <Text style={styles.emptySub}>
              Tap “New Story” to craft your first branching adventure, or import a .cyoa.json file.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!!item.author && <Text style={styles.cardAuthor}>by {item.author}</Text>}
              </View>
              <Text style={styles.sceneCountBadge}>
                {item.sceneCount} scene{item.sceneCount === 1 ? '' : 's'}
              </Text>
            </View>

            {!!item.synopsis && (
              <Text style={styles.synopsis} numberOfLines={2}>
                {item.synopsis}
              </Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => navigation.navigate('Play', { storyId: item.id })}
              >
                <Play size={15} color="#FFFFFF" />
                <Text style={styles.playBtnText}>
                  {item.hasAutoSave ? 'Resume' : 'Play'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('Editor', { storyId: item.id })}
              >
                <Edit3 size={15} color="#4F46E5" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => handleExportStory(item.id)}
              >
                <Share2 size={16} color="#475569" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => handleDeleteStory(item)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Create Story Modal */}
      <Modal
        visible={createVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Adventure</Text>
            <TouchableOpacity onPress={() => setCreateVisible(false)}>
              <X size={22} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.label}>Story Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., The Sunken Citadel"
              placeholderTextColor="#94A3B8"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.label}>Author (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#94A3B8"
              value={newAuthor}
              onChangeText={setNewAuthor}
            />

            <Text style={styles.label}>Synopsis (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief premise of your story..."
              placeholderTextColor="#94A3B8"
              value={newSynopsis}
              onChangeText={setNewSynopsis}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.createSubmitBtn} onPress={handleCreateStory}>
              <Text style={styles.createSubmitText}>Create & Start Writing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    padding: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  newBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitleWrap: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  cardAuthor: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sceneCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  synopsis: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 12 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 10,
  },
  playBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  iconActionBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
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
  createSubmitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createSubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
