import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { addReflection, getReflections, getStreakData } from '../../services/reflectionService';
import { getDreams } from '../../services/dreamService';
import { Dream } from '../../components/DreamCard';
import CustomPopup from '../../components/CustomPopup';

interface Reflection {
  id: string;
  content: string;
  productivityRating: number;
  linkedDreamId?: string;
  date: string;
  dreamIds?: string[]; // Added dreamIds to the interface
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: string;
  totalReflections: number;
}

export default function ReflectionsScreen() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastReflectionDate: '',
    totalReflections: 0,
  });
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [content, setContent] = useState('');
  const [productivityRating, setProductivityRating] = useState<number | null>(null);
  const [selectedDreamId, setSelectedDreamId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Custom popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  useEffect(() => {
    if (!user) {
      setReflections([]);
      setStreakData({ currentStreak: 0, longestStreak: 0, lastReflectionDate: '', totalReflections: 0 });
      setDreams([]);
      return;
    }

    const reflectionsUnsub = getReflections((r) => setReflections(r));
    const streakUnsub = getStreakData((s) => setStreakData(s));
    const dreamsUnsub = getDreams((d) => setDreams(d));

    return () => {
      if (reflectionsUnsub) reflectionsUnsub();
      if (streakUnsub) streakUnsub();
      if (dreamsUnsub) dreamsUnsub();
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      showCustomAlert('Error', 'Please write your reflection content.');
      return;
    }

    if (content.trim().split(' ').length < 10) {
      showCustomAlert('Error', 'Please write at least 10 words for your reflection.');
      return;
    }

    if (productivityRating === null) {
      showCustomAlert('Error', 'Please select a productivity rating.');
      return;
    }

    try {
      setLoading(true);
      await addReflection({
        content: content.trim(),
        productivityRating,
        dreamIds: selectedDreamId ? [selectedDreamId] : [],
        date: new Date().toISOString(),
      });

      // Reset form
      setContent('');
      setProductivityRating(null);
      setSelectedDreamId('');

      showCustomAlert('Success', 'Reflection saved successfully!', 'success');
    } catch {
      showCustomAlert('Error', 'Failed to save reflection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProductivityColor = (rating: number) => {
    if (rating >= 4) return '#10b981';
    if (rating >= 3) return '#f59e0b';
    return '#ef4444';
  };

  const getProductivityText = (rating: number) => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Good';
    if (rating === 3) return 'Average';
    if (rating === 2) return 'Poor';
    return 'Very Poor';
  };

  const renderReflectionItem = ({ item }: { item: Reflection }) => {
    const linkedDream = (item.dreamIds || []).length > 0 
      ? dreams.find(d => d.id === item.dreamIds![0]) 
      : null;
    
    return (
      <View style={styles.reflectionCard}>
        <View style={styles.reflectionHeader}>
          <View style={styles.ratingContainer}>
            <View style={[styles.ratingBadge, { backgroundColor: getProductivityColor(item.productivityRating) }]}>
              <Text style={styles.ratingText}>{item.productivityRating}</Text>
            </View>
            <Text style={styles.ratingLabel}>{getProductivityText(item.productivityRating)}</Text>
          </View>
          <Text style={styles.reflectionDate}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        <Text style={styles.reflectionContent}>{item.content}</Text>
        
        {linkedDream && (
          <View style={styles.linkedDream}>
            <Feather name="target" size={14} color="#ffd600" />
            <Text style={styles.linkedDreamText}>Linked to: {linkedDream.title}</Text>
          </View>
        )}
      </View>
    );
  };

  const activeDreams = dreams.filter(d => !d.completed);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Reflections</Text>
            <Text style={styles.subtitle}>Track your daily progress and insights</Text>
          </View>
          <View style={styles.streakContainer}>
            <View style={styles.streakBadge}>
              <Feather name="zap" size={16} color="#ffd600" />
              <Text style={styles.streakText}>{streakData.currentStreak}</Text>
            </View>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Daily Reflection Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Today&apos;s Reflection</Text>
            
            <View style={styles.formCard}>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="How was your day? What did you accomplish? What could you improve?"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Productivity Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingTitle}>How productive were you today?</Text>
                <View style={styles.ratingButtons}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        productivityRating === rating && styles.ratingButtonActive
                      ]}
                      onPress={() => setProductivityRating(rating)}
                    >
                      <Text style={[
                        styles.ratingButtonText,
                        productivityRating === rating && styles.ratingButtonTextActive
                      ]}>
                        {rating}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {productivityRating && (
                  <Text style={styles.ratingDescription}>
                    {getProductivityText(productivityRating)}
                  </Text>
                )}
              </View>

              {/* Link to Dream */}
              {activeDreams.length > 0 && (
                <View style={styles.dreamLinkSection}>
                  <Text style={styles.dreamLinkTitle}>Link to a dream (optional)</Text>
                  <View style={styles.dreamSelector}>
                    <TouchableOpacity
                      style={[
                        styles.dreamOption,
                        !selectedDreamId && styles.dreamOptionActive
                      ]}
                      onPress={() => setSelectedDreamId('')}
                    >
                      <Text style={[
                        styles.dreamOptionText,
                        !selectedDreamId && styles.dreamOptionTextActive
                      ]}>
                        No dream linked
                      </Text>
                    </TouchableOpacity>
                    {activeDreams.map((dream) => (
                      <TouchableOpacity
                        key={dream.id}
                        style={[
                          styles.dreamOption,
                          selectedDreamId === dream.id && styles.dreamOptionActive
                        ]}
                        onPress={() => setSelectedDreamId(dream.id)}
                      >
                        <Text style={[
                          styles.dreamOptionText,
                          selectedDreamId === dream.id && styles.dreamOptionTextActive
                        ]}>
                          {dream.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Feather name="save" size={20} color="#000" />
                <Text style={styles.submitButtonText}>
                  {loading ? 'Saving...' : 'Save Reflection'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Reflections */}
          {reflections.length > 0 && (
            <View style={styles.reflectionsSection}>
              <Text style={styles.sectionTitle}>Recent Reflections</Text>
              <FlatList
                data={reflections.slice(0, 5)}
                renderItem={renderReflectionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Empty State */}
          {reflections.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="book-open" size={48} color="#666" />
              <Text style={styles.emptyTitle}>No reflections yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your reflection journey by writing about your day
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Custom Popup */}
      <CustomPopup
        visible={showPopup}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        onConfirm={() => setShowPopup(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
    flexShrink: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  streakContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.2)',
  },
  streakText: {
    color: '#ffd600',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flexShrink: 0,
  },
  streakLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  content: {
    flex: 1,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  contentInput: {
    backgroundColor: '#1a1a1d',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  ratingSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  ratingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1d',
    borderWidth: 1,
    borderColor: '#2a2a2d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#ffd600',
    borderColor: '#ffd600',
  },
  ratingButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  ratingButtonTextActive: {
    color: '#000',
  },
  ratingDescription: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  dreamLinkSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  dreamLinkTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  dreamSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dreamOption: {
    backgroundColor: '#1a1a1d',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  dreamOptionActive: {
    backgroundColor: '#ffd600',
    borderColor: '#ffd600',
  },
  dreamOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 160,
  },
  dreamOptionTextActive: {
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#ffd600',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ffd600',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#b3b3b3',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  reflectionsSection: {
    marginBottom: 16,
  },
  reflectionCard: {
    backgroundColor: '#232326',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingLabel: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '500',
  },
  reflectionDate: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  reflectionContent: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  linkedDream: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  linkedDreamText: {
    color: '#ffd600',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    flexWrap: 'wrap',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  emptySubtitle: {
    color: '#b3b3b3',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
}); 