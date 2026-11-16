import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  CornerUpLeft,
  History,
  RotateCcw,
  Sparkles,
  Type,
} from 'lucide-react-native';
import { ReaderSettingsModal } from '../../components/play/ReaderSettingsModal';
import { RewindDrawer } from '../../components/play/RewindDrawer';
import { SaveSlotsModal } from '../../components/play/SaveSlotsModal';
import { usePlayStore } from '../../store/usePlayStore';
import { READER_THEMES, useSettingsStore } from '../../store/useSettingsStore';
import { Choice } from '../../types/story';

export default function PlayStoryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>();
  const { storyId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const {
    story,
    scenesById,
    currentSceneId,
    historyStack,
    savedSlots,
    isLoading,
    startOrResumeStory,
    clearPlaySession,
    makeChoice,
    rewindOneStep,
    rewindToStep,
    restartStory,
    saveManualSlot,
    loadSaveSlot,
    deleteSaveSlot,
  } = usePlayStore();

  const { theme, fontSize } = useSettingsStore();
  const palette = READER_THEMES[theme];

  const [rewindVisible, setRewindVisible] = useState(false);
  const [savesVisible, setSavesVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    if (storyId) {
      startOrResumeStory(storyId);
    }
    return () => clearPlaySession();
  }, [storyId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentSceneId]);

  const currentScene = currentSceneId ? scenesById[currentSceneId] : null;

  const handleChoicePress = async (choice: Choice) => {
    if (!choice.targetSceneId || !scenesById[choice.targetSceneId]) {
      Alert.alert(
        'Unlinked Path',
        'This choice has not been linked to a destination scene yet in the editor.'
      );
      return;
    }
    await makeChoice(choice);
  };

  const handleRestartConfirm = () => {
    Alert.alert('Restart Story', 'Return to the beginning of this story?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: restartStory },
    ]);
  };

  if (isLoading || !story) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Reader Navigation Chrome */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.storyTitle, { color: palette.text }]} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={[styles.stepBadge, { color: palette.muted }]}>
            Step {historyStack.length + 1}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={rewindOneStep}
            disabled={historyStack.length === 0}
            style={[styles.iconBtn, historyStack.length === 0 && styles.disabledBtn]}
          >
            <CornerUpLeft size={20} color={palette.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRewindVisible(true)} style={styles.iconBtn}>
            <History size={20} color={palette.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSavesVisible(true)} style={styles.iconBtn}>
            <Bookmark size={20} color={palette.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
            <Type size={20} color={palette.text} />
          </TouchableOpacity>
        </View>
      </View>

      {!currentScene ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            No Starting Scene Found
          </Text>
          <Text style={[styles.emptySub, { color: palette.muted }]}>
            Open this story in the editor and add or assign a starting scene.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.sceneTitle, { color: palette.text }]}>
            {currentScene.title}
          </Text>

          <Text
            style={[
              styles.prose,
              {
                color: palette.text,
                fontSize,
                lineHeight: Math.round(fontSize * 1.55),
              },
            ]}
          >
            {currentScene.content || 'This scene has no narrative text yet.'}
          </Text>

          {currentScene.isEnding ? (
            <View
              style={[
                styles.endingCard,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <View style={styles.endingHeader}>
                <Sparkles size={20} color={palette.accent} />
                <Text style={[styles.endingTitle, { color: palette.text }]}>
                  {currentScene.endingType ?? 'THE END'}
                </Text>
              </View>
              <Text style={[styles.endingSub, { color: palette.muted }]}>
                You reached an ending in {historyStack.length + 1} step
                {historyStack.length === 0 ? '' : 's'}.
              </Text>

              <View style={styles.endingActions}>
                {historyStack.length > 0 && (
                  <TouchableOpacity
                    style={[styles.endingBtn, { backgroundColor: palette.accent }]}
                    onPress={rewindOneStep}
                  >
                    <CornerUpLeft size={16} color={palette.accentText} />
                    <Text style={[styles.endingBtnText, { color: palette.accentText }]}>
                      Rewind Last Choice
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.endingSecondaryBtn,
                    { borderColor: palette.border, backgroundColor: palette.bg },
                  ]}
                  onPress={() => setRewindVisible(true)}
                >
                  <History size={16} color={palette.text} />
                  <Text style={[styles.endingSecondaryText, { color: palette.text }]}>
                    Open Timeline
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.endingSecondaryBtn,
                    { borderColor: palette.border, backgroundColor: palette.bg },
                  ]}
                  onPress={handleRestartConfirm}
                >
                  <RotateCcw size={16} color={palette.text} />
                  <Text style={[styles.endingSecondaryText, { color: palette.text }]}>
                    Restart Story
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.choicesBox}>
              <Text style={[styles.choicesLabel, { color: palette.muted }]}>
                What will you do?
              </Text>

              {currentScene.choices.length === 0 ? (
                <View
                  style={[
                    styles.deadEndBox,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                >
                  <Text style={[styles.deadEndText, { color: palette.muted }]}>
                    No choices available from this scene. Use Rewind to go back.
                  </Text>
                </View>
              ) : (
                currentScene.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceBtn,
                      { backgroundColor: palette.surface, borderColor: palette.border },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleChoicePress(choice)}
                  >
                    <Text style={[styles.choiceText, { color: palette.text }]}>
                      {choice.text || 'Continue'}
                    </Text>
                    <ChevronRight size={18} color={palette.accent} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      <RewindDrawer
        visible={rewindVisible}
        currentSceneTitle={currentScene?.title ?? 'Unknown Scene'}
        historyStack={historyStack}
        onRewindToStep={rewindToStep}
        onClose={() => setRewindVisible(false)}
      />

      <SaveSlotsModal
        visible={savesVisible}
        savedSlots={savedSlots}
        onSaveNewSlot={saveManualSlot}
        onLoadSlot={loadSaveSlot}
        onDeleteSlot={deleteSaveSlot}
        onClose={() => setSavesVisible(false)}
      />

      <ReaderSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 6 },
  disabledBtn: { opacity: 0.3 },
  headerCenter: { flex: 1, marginHorizontal: 8 },
  storyTitle: { fontSize: 15, fontWeight: '700' },
  stepBadge: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sceneTitle: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  prose: { marginBottom: 28 },
  choicesBox: { marginTop: 8 },
  choicesLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  choiceText: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 10 },
  deadEndBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
  deadEndText: { fontSize: 14, fontStyle: 'italic' },
  endingCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 12,
  },
  endingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  endingTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  endingSub: { fontSize: 14, marginBottom: 16 },
  endingActions: { gap: 10 },
  endingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
  },
  endingBtnText: { fontSize: 15, fontWeight: '700' },
  endingSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  endingSecondaryText: { fontSize: 14, fontWeight: '600' },
});
