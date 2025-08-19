import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getDreams } from '../../services/dreamService';
import { Dream } from '../../components/DreamCard';
import { getStreakData, StreakData } from '../../services/reflectionService';
import { syncNotificationsFromServer, getUserDisplayName } from '../../services/notificationService';

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [dreamsLoading, setDreamsLoading] = useState(true);

  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastReflectionDate: '',
    totalReflections: 0
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch dreams data
  useEffect(() => {
    if (!user) {
      setDreams([]);
      setDreamsLoading(false);
      return;
    }

    setDreamsLoading(true);

    try {
      const unsubscribe = getDreams((fetchedDreams) => {
        setDreams(fetchedDreams);
        setDreamsLoading(false);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error fetching dreams for dashboard:', error);
      setDreamsLoading(false);
    }
  }, [user]);

  // Fetch streak data
  useEffect(() => {
    if (!user) return;

    try {
      const unsubscribe = getStreakData((fetchedStreakData) => {
        setStreakData(fetchedStreakData);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error fetching streak data for dashboard:', error);
    }
  }, [user]);

  // Ensure notifications are scheduled according to user preferences
  useEffect(() => {
    if (!user) return;
    (async () => {
      const displayName = await getUserDisplayName();
      syncNotificationsFromServer(displayName);
    })();
  }, [user]);

  // Calculate dashboard statistics
  const activeDreams = dreams.filter(dream => !dream.completed);
  const completedDreams = dreams.filter(dream => dream.completed);
  const totalProgress = dreams.length > 0 
    ? Math.round(dreams.reduce((sum, dream) => sum + dream.progress, 0) / dreams.length)
    : 0;

  // Get the most important dream (highest priority or most recent)
  const getMostImportantDream = () => {
    if (activeDreams.length === 0) return null;
    
    // Sort by progress (descending) and then by days left (ascending)
    return activeDreams.sort((a, b) => {
      if (a.progress !== b.progress) {
        return b.progress - a.progress;
      }
      return a.daysLeft - b.daysLeft;
    })[0];
  };

  const mostImportantDream = getMostImportantDream();

  // Show loading or redirect if not authenticated
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd600" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {dreams.length === 0 
              ? "Welcome! Start your journey by adding your first dream."
              : "Welcome back! Here's your progress overview."
            }
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Match reflections streak visual: subtle pill with yellow text and icon */}
          <TouchableOpacity style={styles.streakPill}>
            <Feather name="zap" size={12} color="#ffd600" />
            <Text style={styles.streakPillText}>{streakData.currentStreak} days</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reflectionButton}
            onPress={() => router.push('/(tabs)/reflections')}
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text style={styles.reflectionButtonText}>Today&apos;s Reflection</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Focus On Your Next Big Goal */}
      {mostImportantDream ? (
        <View style={styles.bigGoalCard}>
          <Text style={styles.cardTitle}>Focus On Your Next Big Goal</Text>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>{mostImportantDream.title}</Text>
            <Feather name="trending-up" size={16} color="#ffd600" />
          </View>
          <Text style={styles.goalMeta}>
            {mostImportantDream.category} • {mostImportantDream.daysLeft} days left
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${mostImportantDream.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{mostImportantDream.progress}% complete</Text>
        </View>
      ) : (
        <View style={styles.bigGoalCard}>
          <Text style={styles.cardTitle}>Start Your Journey</Text>
          <Text style={styles.emptyGoalText}>You haven&apos;t added any dreams yet.</Text>
          <TouchableOpacity 
            style={styles.addFirstDreamButton}
            onPress={() => router.push('/(tabs)/dreams')}
          >
            <Feather name="plus" size={16} color="#000" />
            <Text style={styles.addFirstDreamText}>Add Your First Dream</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: '#ffd600' }]}>
              <Feather name="target" size={16} color="#000" />
            </View>
          </View>
          <Text style={styles.statValue}>{activeDreams.length}</Text>
          <Text style={styles.statLabel}>Active Dreams</Text>
          <View style={styles.statProgress}>
            <View style={[styles.statProgressBar, { width: `${Math.min(100, (activeDreams.length / 10) * 100)}%` }]} />
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10b981' }]}>
              <Feather name="trending-up" size={16} color="#fff" />
            </View>
          </View>
          <Text style={styles.statValue}>{totalProgress}%</Text>
          <Text style={styles.statLabel}>Avg. Progress</Text>
          <View style={styles.statProgress}>
            <View style={[styles.statProgressBar, { width: `${totalProgress}%`, backgroundColor: '#10b981' }]} />
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' }]}>
              <Feather name="check-circle" size={16} color="#fff" />
            </View>
          </View>
          <Text style={styles.statValue}>{completedDreams.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
          <View style={styles.statProgress}>
            <View style={[styles.statProgressBar, { width: `${Math.min(100, (completedDreams.length / 5) * 100)}%`, backgroundColor: '#3b82f6' }]} />
          </View>
        </View>
      </View>

      {/* Active Dreams Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Dreams</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/dreams')}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Active Dreams Cards */}
      {dreamsLoading ? (
        <View style={styles.loadingDreamsContainer}>
          <ActivityIndicator size="large" color="#ffd600" />
          <Text style={styles.loadingDreamsText}>Loading your dreams...</Text>
        </View>
      ) : activeDreams.length === 0 ? (
        <View style={styles.emptyDreamsContainer}>
          <View style={styles.emptyDreamsIcon}>
            <Feather name="target" size={48} color="#b3b3b3" />
          </View>
          <Text style={styles.emptyDreamsTitle}>No Active Dreams</Text>
          <Text style={styles.emptyDreamsSubtitle}>
            Start your manifestation journey by adding your first dream
          </Text>
          <TouchableOpacity 
            style={styles.addDreamButton}
            onPress={() => router.push('/(tabs)/dreams')}
          >
            <Feather name="plus" size={16} color="#000" />
            <Text style={styles.addDreamButtonText}>Add Your First Dream</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dreamsScroll}
          contentContainerStyle={styles.dreamsContent}
        >
          {activeDreams.slice(0, 5).map((dream) => (
            <TouchableOpacity 
              key={dream.id} 
              style={styles.dreamCard}
              onPress={() => router.push('/(tabs)/dreams')}
            >
              <Text style={styles.dreamCardTitle}>{dream.title}</Text>
              <View style={styles.dreamTag}>
                <Text style={styles.dreamTagText}>{dream.type}</Text>
              </View>
              <Text style={styles.dreamStatus}>
                <Feather name="clock" size={12} color="#b3b3b3" />
                {' '}{dream.status}
              </Text>
              {dream.description && dream.description !== dream.title && (
                <Text style={styles.dreamSubtask} numberOfLines={2}>
                  {dream.description}
                </Text>
              )}
              <View style={styles.dreamProgressBar}>
                <View style={[styles.dreamProgressFill, { width: `${dream.progress}%` }]} />
              </View>
              <Text style={styles.dreamProgressText}>{dream.progress}% complete</Text>
              <Text style={styles.dreamTasks}>
                <Feather name="check" size={12} color="#b3b3b3" />
                {' '}{dream.tasks}
              </Text>
              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Daily Inspiration */}
      <View style={styles.inspirationSection}>
        <Text style={styles.sectionTitle}>Daily Inspiration</Text>
        <View style={styles.quoteCard}>
          <Feather name="message-circle" size={24} color="#ffd600" style={styles.quoteIcon} />
          <Text style={styles.quoteText}>
            {dreams.length === 0 
              ? "The journey of a thousand miles begins with a single step."
              : "The secret of getting ahead is getting started."
            }
          </Text>
          <Text style={styles.quoteAuthor}>
            {dreams.length === 0 ? "— Lao Tzu" : "— Mark Twain"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  reflectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232326',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  reflectionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bigGoalCard: {
    backgroundColor: '#232326',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  goalMeta: {
    color: '#b3b3b3',
    fontSize: 14,
    marginBottom: 12,
  },
  progressBarBg: {
    backgroundColor: '#353535',
    height: 8,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
  },
  progressBar: {
    backgroundColor: '#ffd600',
    height: 8,
    borderRadius: 10,
  },
  progressText: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#232326',
    borderRadius: 20,
    padding: 20,
    flex: 1,
    position: 'relative',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statTrend: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statLabel: {
    color: '#b3b3b3',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statSubtext: {
    color: '#b3b3b3',
    fontSize: 11,
    marginBottom: 6,
  },
  statIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  statProgress: {
    backgroundColor: '#353535',
    height: 6,
    borderRadius: 8,
    width: '100%',
    marginTop: 12,
    overflow: 'hidden',
  },
  statProgressBar: {
    height: 6,
    borderRadius: 8,
    backgroundColor: '#ffd600',
  },
  weekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd600',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  weekButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllButton: {
    backgroundColor: '#232326',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dreamsScroll: {
    marginBottom: 32,
  },
  dreamsContent: {
    paddingRight: 20,
  },
  dreamCard: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: Math.min(300, screenWidth * 0.8),
    minHeight: 180,
  },
  dreamCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  dreamTag: {
    backgroundColor: '#232326',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dreamTagText: {
    color: '#ffd600',
    fontSize: 12,
    fontWeight: '500',
  },
  dreamStatus: {
    color: '#b3b3b3',
    fontSize: 13,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamSubtask: {
    color: '#b3b3b3',
    fontSize: 13,
    marginBottom: 12,
  },
  dreamProgressBar: {
    backgroundColor: '#353535',
    height: 8,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
  },
  dreamProgressFill: {
    backgroundColor: '#ffd600',
    height: 8,
    borderRadius: 10,
  },
  dreamProgressText: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 8,
  },
  dreamTasks: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: '#232326',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inspirationSection: {
    marginBottom: 32,
  },
  quoteCard: {
    backgroundColor: '#232326',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  quoteIcon: {
    marginBottom: 16,
  },
  quoteText: {
    color: '#fff',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  quoteAuthor: {
    color: '#b3b3b3',
    fontSize: 15,
    fontStyle: 'italic',
  },
  loadingDreamsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingDreamsText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyDreamsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDreamsIcon: {
    marginBottom: 16,
  },
  emptyDreamsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDreamsSubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  addDreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd600',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addDreamButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  addFirstDreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd600',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addFirstDreamText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyGoalText: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
});
