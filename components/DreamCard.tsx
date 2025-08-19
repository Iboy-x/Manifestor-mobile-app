import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface Dream {
  id: string;
  title: string;
  description: string;
  type: 'short term' | 'long term';
  category: string;
  progress: number;
  daysLeft: number;
  status: string;
  tasks: string;
  subtask?: string;
  completed: boolean;
  createdAt?: Date;
  checklist?: any[];
}

interface DreamCardProps {
  dream: Dream;
  onPress?: () => void;
  style?: any;
}

const DreamCard: React.FC<DreamCardProps> = ({ dream, onPress, style }) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 60) return '#f59e0b';
    if (progress >= 40) return '#f97316';
    return '#ef4444';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Love life': '#ec4899',
      'financial': '#10b981',
      'Career': '#3b82f6',
      'Health': '#f59e0b',
      'everything': '#8b5cf6',
    };
    return colors[category] || '#6b7280';
  };

  // Ensure we have valid data
  const safeDream = {
    id: dream.id || 0,
    title: dream.title || 'Untitled Dream',
    description: dream.description || dream.subtask || 'No description available',
    type: dream.type || 'short term',
    category: dream.category || 'everything',
    progress: typeof dream.progress === 'number' ? Math.max(0, Math.min(100, dream.progress)) : 0,
    daysLeft: typeof dream.daysLeft === 'number' ? Math.max(0, dream.daysLeft) : 0,
    status: dream.status || 'In progress',
    tasks: dream.tasks || '0 of 0 tasks',
    subtask: dream.subtask,
    completed: Boolean(dream.completed),
    createdAt: dream.createdAt,
  };

  return (
    <TouchableOpacity 
      style={[styles.card, safeDream.completed && styles.completedCard, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, safeDream.completed && styles.completedTitle]}>
            {safeDream.title}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(safeDream.category) }]}>
            <Text style={styles.categoryText}>{safeDream.category}</Text>
          </View>
        </View>
        <View style={styles.typeContainer}>
          <Text style={styles.typeText}>{safeDream.type}</Text>
        </View>
      </View>

      <Text 
        style={[styles.description, safeDream.completed && styles.completedDescription]}
        numberOfLines={2}
      >
        {safeDream.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${safeDream.progress}%`,
                  backgroundColor: getProgressColor(safeDream.progress)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{safeDream.progress}%</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Feather name="clock" size={12} color="#b3b3b3" />
            <Text style={styles.statText}>{safeDream.daysLeft} days left</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="check-circle" size={12} color="#b3b3b3" />
            <Text style={styles.statText}>{safeDream.tasks}</Text>
          </View>
        </View>
      </View>

      {safeDream.completed && (
        <View style={styles.completedOverlay}>
          <Feather name="check-circle" size={20} color="#10b981" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#1a1a1d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#b3b3b3',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeContainer: {
    backgroundColor: '#2a2a2d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#b3b3b3',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  description: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  completedDescription: {
    color: '#8a8a8a',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a2d',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 30,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    color: '#b3b3b3',
    fontSize: 11,
    marginLeft: 4,
  },
  completedOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default DreamCard; 