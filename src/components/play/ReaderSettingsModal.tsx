import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Minus, Plus, X } from 'lucide-react-native';
import { READER_THEMES, ReaderTheme, useSettingsStore } from '../../store/useSettingsStore';

interface ReaderSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReaderSettingsModal({ visible, onClose }: ReaderSettingsModalProps) {
  const { theme, fontSize, setTheme, setFontSize } = useSettingsStore();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Reader Appearance</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#334155" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Color Theme</Text>
          <View style={styles.themeRow}>
            {(Object.keys(READER_THEMES) as ReaderTheme[]).map((key) => {
              const t = READER_THEMES[key];
              const active = theme === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeChip,
                    { backgroundColor: t.bg, borderColor: active ? '#4F46E5' : t.border },
                    active && styles.themeChipActive,
                  ]}
                  onPress={() => setTheme(key)}
                >
                  <Text style={[styles.themeLabel, { color: t.text }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Font Size ({fontSize}pt)</Text>
          <View style={styles.fontRow}>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => setFontSize(fontSize - 1)}
            >
              <Minus size={18} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.fontPreview} numberOfLines={1}>
              Aa Bb Cc
            </Text>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => setFontSize(fontSize + 1)}
            >
              <Plus size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  themeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  themeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  themeChipActive: { borderWidth: 2.5 },
  themeLabel: { fontSize: 13, fontWeight: '700' },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fontBtn: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fontPreview: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
});
