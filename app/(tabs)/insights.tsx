import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getDreams } from '../../services/dreamService';
import { getReflections, getStreakData, type Reflection, type StreakData } from '../../services/reflectionService';
import type { Dream } from '../../components/DreamCard';

export default function InsightsScreen() {
  const { user } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [streakData, setStreakDataState] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastReflectionDate: '',
    totalReflections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDreams([]);
      setReflections([]);
      setStreakDataState({ currentStreak: 0, longestStreak: 0, lastReflectionDate: '', totalReflections: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    const dreamsUnsub = getDreams((d) => setDreams(d));
    const reflUnsub = getReflections((r) => setReflections(r));
    const streakUnsub = getStreakData((s) => setStreakDataState(s));

    setLoading(false);
    return () => {
      if (dreamsUnsub) dreamsUnsub();
      if (reflUnsub) reflUnsub();
      if (streakUnsub) streakUnsub();
    };
  }, [user]);

  const totalDreams = dreams.length;
  const completedDreams = dreams.filter(d => d.completed).length;
  const activeDreams = totalDreams - completedDreams;
  const averageProgress = totalDreams > 0
    ? Math.round(dreams.reduce((sum, d) => sum + (typeof d.progress === 'number' ? d.progress : 0), 0) / totalDreams)
    : 0;

  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach(d => {
      const key = (d.category || 'Other').toString();
      counts[key] = (counts[key] || 0) + 1;
    });
    let best: string | null = null;
    Object.keys(counts).forEach(cat => {
      if (best === null || counts[cat] > (counts[best] || 0)) best = cat;
    });
    return best || '—';
  }, [dreams]);

  // Weekly productivity from reflections (last 7 days)
  const weeklyData = useMemo(() => {
    const days: { label: string; date: Date }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d });
    }
    const result = days.map(({ label, date }) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const dayRefl = reflections.filter(r => {
        const rd = new Date(r.date);
        return rd >= start && rd <= end;
      });
      const avg = dayRefl.length > 0 ? dayRefl.reduce((s, r) => s + (r.productivityRating || 0), 0) / dayRefl.length : 0;
      // Scale 0-5 rating to 0-100 for bar height
      const value = Math.round((avg / 5) * 100);
      return { day: label, value, color: '#ffd600' };
    });
    return result;
  }, [reflections]);

  const mostProductiveDay = useMemo(() => {
    // Aggregate by weekday over last 30 days
    const counts: Record<string, { sum: number; n: number }> = {};
    const start = new Date();
    start.setDate(start.getDate() - 30);
    reflections.forEach(r => {
      const rd = new Date(r.date);
      if (rd >= start) {
        const label = rd.toLocaleDateString('en-US', { weekday: 'long' });
        if (!counts[label]) counts[label] = { sum: 0, n: 0 };
        counts[label].sum += r.productivityRating || 0;
        counts[label].n += 1;
      }
    });
    let bestLabel = '—';
    let bestAvg = -1;
    Object.keys(counts).forEach(k => {
      const avg = counts[k].n ? counts[k].sum / counts[k].n : 0;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestLabel = k;
      }
    });
    return bestLabel;
  }, [reflections]);







  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd600" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Insights</Text>
          <Text style={styles.headerSubtitle}>Track your progress and achievements</Text>
        </View>
        <TouchableOpacity style={styles.streakPill}>
          <Feather name="zap" size={12} color="#ffd600" />
          <Text style={styles.streakPillText}>{streakData.currentStreak} days</Text>
        </TouchableOpacity>
      </View>

      {/* Overview Stats */}
      <View style={styles.overviewSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalDreams}</Text>
            <Text style={styles.statLabel}>Total Dreams</Text>
            <Feather name="target" size={16} color="#ffd600" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedDreams}</Text>
            <Text style={styles.statLabel}>Completed</Text>
            <Feather name="check-circle" size={16} color="#10b981" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeDreams}</Text>
            <Text style={styles.statLabel}>Active</Text>
            <Feather name="clock" size={16} color="#f59e0b" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakData.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
            <Feather name="zap" size={16} color="#ffd600" style={styles.statIcon} />
          </View>
        </View>
      </View>

      {/* Weekly Productivity */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Weekly Productivity</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {weeklyData.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(4, item.value * 0.8),
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Key Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        <View style={styles.insightCards}>
          <View style={styles.insightCard}>
            <View style={styles.insightIconCircle}>
              <Feather name="trending-up" size={16} color="#ffd600" />
            </View>
            <View style={styles.insightTextCol}>
              <Text style={styles.insightTitle}>Average Progress</Text>
              <Text style={styles.insightText}>Your dreams are on average {averageProgress}% complete.</Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <View style={styles.insightIconCircle}>
              <Feather name="calendar" size={16} color="#4ecdc4" />
            </View>
            <View style={styles.insightTextCol}>
              <Text style={styles.insightTitle}>Most Productive Day</Text>
              <Text style={styles.insightText}>{mostProductiveDay}</Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <View style={styles.insightIconCircle}>
              <Feather name="award" size={16} color="#ff6b6b" />
            </View>
            <View style={styles.insightTextCol}>
              <Text style={styles.insightTitle}>Top Category</Text>
              <Text style={styles.insightText}>{topCategory}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Monthly Summary removed per request */}

      {/* Quick Overview removed per request */}

      {/* Achievements (last) */}
      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {[
            { id: 1, name: 'First Dream', description: 'Created your first dream', earned: dreams.length >= 1, icon: 'target' },
            { id: 2, name: 'Consistent', description: '7-day reflection streak', earned: streakData.currentStreak >= 7, icon: 'zap' },
            { id: 3, name: 'Dreamer', description: '5 dreams created', earned: dreams.length >= 5, icon: 'star' },
            { id: 4, name: 'Finisher', description: 'Completed 3 dreams', earned: completedDreams >= 3, icon: 'award' },
          ].map((achievement) => (
            <View
              key={achievement.id}
              style={[styles.achievementCard, !achievement.earned && styles.achievementCardLocked]}
            >
              <View style={styles.achievementIconContainer}>
                <Feather 
                  name={achievement.icon as any} 
                  size={28} 
                  color={achievement.earned ? '#ffd600' : '#666'} 
                  style={!achievement.earned && styles.achievementIconLocked}
                />
                {achievement.earned && (
                  <View style={styles.achievementBadge}>
                    <Feather name="check" size={12} color="#000" />
                  </View>
                )}
              </View>
              <Text style={[styles.achievementName, !achievement.earned && styles.achievementNameLocked]}>
                {achievement.name}
              </Text>
              <Text style={[styles.achievementDescription, !achievement.earned && styles.achievementDescriptionLocked]}>
                {achievement.description}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: '#b3b3b3',
    fontSize: 15,
    lineHeight: 20,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.2)',
  },
  streakPillText: {
    color: '#ffd600',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  overviewSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsGridResponsive: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '24%',
    position: 'relative',
    minHeight: 90,
    minWidth: 0,
  },
  statCardResponsive: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    position: 'relative',
    minHeight: 90,
    width: '48%',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#b3b3b3',
    fontSize: 11,
    textAlign: 'center',
  },
  statIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  chartSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#232326',
    borderRadius: 20,
    padding: 24,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    fontWeight: '500',
  },
  insightsSection: {
    marginBottom: 32,
  },
  insightCards: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightText: {
    color: '#b3b3b3',
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
  insightIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1f1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTextCol: {
    flex: 1,
    flexShrink: 1,
  },
  achievementsSection: {
    marginBottom: 120,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementCard: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#353535',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementCardLocked: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    opacity: 0.7,
  },
  achievementIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  achievementBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ffd600',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  achievementName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  achievementNameLocked: {
    color: '#666',
  },
  achievementDescription: {
    color: '#b3b3b3',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
  achievementDescriptionLocked: {
    color: '#666',
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#232326',
    borderRadius: 20,
    padding: 24,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryStatLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    textAlign: 'center',
  },
}); 