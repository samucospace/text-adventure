import React, { useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, Marker, Path, Polygon } from 'react-native-svg';
import { AlertTriangle, Flag, LayoutGrid, Sparkles, ZoomIn, ZoomOut } from 'lucide-react-native';
import { Scene, ValidationIssue } from '../../types/story';

const NODE_WIDTH = 176;
const NODE_HEIGHT = 92;
const CANVAS_SIZE = 2600;

interface DraggableNodeProps {
  scene: Scene;
  scale: number;
  isStart: boolean;
  hasWarning: boolean;
  onSelect: (sceneId: string) => void;
  onDragEnd: (sceneId: string, x: number, y: number) => void;
}

function DraggableNode({
  scene,
  scale,
  isStart,
  hasWarning,
  onSelect,
  onDragEnd,
}: DraggableNodeProps) {
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });
  const movedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        movedRef.current = false;
        dragOffsetRef.current = { dx: 0, dy: 0 };
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
          movedRef.current = true;
        }
        const next = { dx: gs.dx / scale, dy: gs.dy / scale };
        dragOffsetRef.current = next;
        setDragOffset(next);
      },
      onPanResponderRelease: () => {
        const { dx, dy } = dragOffsetRef.current;
        if (!movedRef.current) {
          onSelect(scene.id);
        } else {
          const finalX = Math.max(20, Math.round(scene.positionX + dx));
          const finalY = Math.max(20, Math.round(scene.positionY + dy));
          onDragEnd(scene.id, finalX, finalY);
        }
        dragOffsetRef.current = { dx: 0, dy: 0 };
        setDragOffset({ dx: 0, dy: 0 });
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.nodeCard,
        isStart && styles.nodeStart,
        scene.isEnding && styles.nodeEnding,
        {
          left: scene.positionX + dragOffset.dx,
          top: scene.positionY + dragOffset.dy,
        },
      ]}
    >
      <View style={styles.nodeHeader}>
        <Text style={styles.nodeTitle} numberOfLines={1}>
          {scene.title || 'Untitled'}
        </Text>
        {isStart && <Flag size={13} color="#4F46E5" />}
        {scene.isEnding && <Sparkles size={13} color="#059669" />}
        {hasWarning && <AlertTriangle size={13} color="#D97706" />}
      </View>

      <Text style={styles.nodePreview} numberOfLines={2}>
        {scene.content || 'Tap to edit scene...'}
      </Text>

      <Text style={styles.nodeFooter}>
        {scene.isEnding
          ? `Ending (${scene.endingType ?? 'END'})`
          : `${scene.choices.length} choice${scene.choices.length === 1 ? '' : 's'}`}
      </Text>
    </View>
  );
}

interface GraphCanvasProps {
  scenes: Scene[];
  startSceneId: string | null;
  issues: ValidationIssue[];
  onSelectScene: (sceneId: string) => void;
  onUpdateNodePosition: (sceneId: string, x: number, y: number) => void;
  onAutoLayout: () => void;
}

export function GraphCanvas({
  scenes,
  startSceneId,
  issues,
  onSelectScene,
  onUpdateNodePosition,
  onAutoLayout,
}: GraphCanvasProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const panStartRef = useRef({ x: 0, y: 0 });

  const sceneMap = new Map<string, Scene>();
  for (const s of scenes) {
    sceneMap.set(s.id, s);
  }

  const warningSceneIds = new Set(
    issues.map((i) => i.sceneId).filter((id): id is string => Boolean(id))
  );

  const canvasPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6,
      onPanResponderGrant: () => {
        panStartRef.current = { ...pan };
      },
      onPanResponderMove: (_, gs) => {
        setPan({
          x: panStartRef.current.x + gs.dx,
          y: panStartRef.current.y + gs.dy,
        });
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View {...canvasPanResponder.panHandlers} style={styles.viewport}>
        <View
          style={[
            styles.canvasSurface,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale },
              ],
            },
          ]}
        >
          {/* Directed Bezier Edges */}
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <Marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <Polygon points="0 0, 8 3, 0 6" fill="#6366F1" />
              </Marker>
            </Defs>

            {scenes.map((source) =>
              source.choices.map((choice) => {
                if (!choice.targetSceneId) return null;
                const target = sceneMap.get(choice.targetSceneId);
                if (!target) return null;

                const startX = source.positionX + NODE_WIDTH / 2;
                const startY = source.positionY + NODE_HEIGHT;
                const endX = target.positionX + NODE_WIDTH / 2;
                const endY = target.positionY;

                const midY = (startY + endY) / 2;
                const d =
                  source.id === target.id
                    ? `M ${source.positionX + NODE_WIDTH} ${source.positionY + 30} C ${
                        source.positionX + NODE_WIDTH + 60
                      } ${source.positionY - 20}, ${source.positionX + NODE_WIDTH + 60} ${
                        source.positionY + NODE_HEIGHT + 20
                      }, ${source.positionX + NODE_WIDTH} ${source.positionY + 60}`
                    : `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

                return (
                  <Path
                    key={choice.id}
                    d={d}
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })
            )}
          </Svg>

          {/* Draggable Scene Nodes */}
          {scenes.map((scene) => (
            <DraggableNode
              key={scene.id}
              scene={scene}
              scale={scale}
              isStart={scene.id === startSceneId}
              hasWarning={warningSceneIds.has(scene.id)}
              onSelect={onSelectScene}
              onDragEnd={onUpdateNodePosition}
            />
          ))}
        </View>
      </View>

      {/* Canvas Controls Overlay */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
        >
          <ZoomOut size={18} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setScale((s) => Math.min(1.6, Number((s + 0.15).toFixed(2))))}
        >
          <ZoomIn size={18} color="#334155" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.autoLayoutBtn} onPress={onAutoLayout}>
          <LayoutGrid size={16} color="#4F46E5" />
          <Text style={styles.autoLayoutText}>Auto-Layout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  viewport: { flex: 1 },
  canvasSurface: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#F1F5F9',
  },
  nodeCard: {
    position: 'absolute',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeStart: { borderColor: '#4F46E5', borderWidth: 2 },
  nodeEnding: { borderColor: '#10B981' },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nodeTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', flex: 1 },
  nodePreview: { fontSize: 11, color: '#64748B', lineHeight: 14 },
  nodeFooter: { fontSize: 10, fontWeight: '600', color: '#475569' },
  controlsBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  controlBtn: { padding: 6 },
  zoomText: { fontSize: 12, fontWeight: '600', color: '#334155', minWidth: 40, textAlign: 'center' },
  divider: { width: 1, height: 18, backgroundColor: '#E2E8F0', marginHorizontal: 6 },
  autoLayoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 6 },
  autoLayoutText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
});
