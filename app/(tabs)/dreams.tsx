import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getDreams, updateDream, deleteDream } from '../../services/dreamService';
import { Dream } from '../../components/DreamCard';
import AddDreamModal from '../../components/AddDreamModal';
import DreamDetailModal from '../../components/DreamDetailModal';
import CustomPopup from '../../components/CustomPopup';

export default function DreamsScreen() {
  const { user } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Custom popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [dreamToDelete, setDreamToDelete] = useState<Dream | null>(null);

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  useEffect(() => {
    if (!user) {
      setDreams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getDreams((fetchedDreams) => {
      setDreams(fetchedDreams);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleDreamAdded = () => {
    // The dreams will be automatically updated via the real-time listener
    showCustomAlert('Success', 'Dream added successfully!', 'success');
  };

  const handleDreamUpdated = () => {
    // The dreams will be automatically updated via the real-time listener
    showCustomAlert('Success', 'Dream updated successfully!', 'success');
  };

  const handleDreamDeleted = () => {
    // The dreams will be automatically updated via the real-time listener
    showCustomAlert('Success', 'Dream deleted successfully!', 'success');
  };

  const handleToggleCompletion = async (dream: Dream) => {
    try {
      await updateDream(dream.id, { completed: !dream.completed });
      showCustomAlert('Success', `Dream marked as ${!dream.completed ? 'completed' : 'active'}!`, 'success');
    } catch {
      showCustomAlert('Error', 'Failed to update dream status. Please try again.');
    }
  };



  const handleDeleteDream = (dream: Dream) => {
    setDreamToDelete(dream);
    setShowDeletePopup(true);
  };

  const confirmDeleteDream = async () => {
    if (!dreamToDelete) return;
    
    try {
      await deleteDream(dreamToDelete.id);
      setShowDeletePopup(false);
      setDreamToDelete(null);
      showCustomAlert('Success', 'Dream deleted successfully!', 'success');
    } catch {
      showCustomAlert('Error', 'Failed to delete dream. Please try again.');
    }
  };

  const renderDreamItem = ({ item }: { item: Dream }) => (
    <View style={styles.dreamCard}>
      <View style={styles.dreamHeader}>
        <Text style={styles.dreamTitle}>{item.title}</Text>
        <View style={styles.dreamActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleCompletion(item)}
          >
            <Feather
              name={item.completed ? 'check-circle' : 'circle'}
              size={20}
              color={item.completed ? '#10b981' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedDream(item);
              setShowDetailModal(true);
            }}
          >
            <Feather name="eye" size={20} color="#ffd600" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDream(item)}
          >
            <Feather name="trash-2" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.dreamDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.dreamMeta}>
        <View style={styles.metaItem}>
          <Feather name="tag" size={14} color="#666" />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={14} color="#666" />
          <Text style={styles.metaText}>{item.type}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={14} color="#666" />
          <Text style={styles.metaText}>{item.daysLeft} days left</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
      </View>
    </View>
  );

  const activeDreams = dreams.filter(d => !d.completed);
  const completedDreams = dreams.filter(d => d.completed);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dreams...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dreams Log</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Feather name="plus" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Active Dreams */}
          {activeDreams.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Dreams</Text>
              <FlatList
                data={activeDreams}
                renderItem={renderDreamItem}
                keyExtractor={(item) => `active-${item.id}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Completed Dreams */}
          {completedDreams.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed Dreams</Text>
              <FlatList
                data={completedDreams}
                renderItem={renderDreamItem}
                keyExtractor={(item) => `completed-${item.id}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Empty State */}
          {dreams.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="target" size={48} color="#666" />
              <Text style={styles.emptyTitle}>No dreams yet</Text>
              <Text style={styles.emptySubtitle}>
                Start by adding your first dream to begin your journey
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modals */}
      <AddDreamModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onDreamAdded={handleDreamAdded}
      />

      <DreamDetailModal
        visible={showDetailModal}
        dream={selectedDream}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDream(null);
        }}
        onDreamUpdated={handleDreamUpdated}
        onDreamDeleted={handleDreamDeleted}
      />

      {/* Custom Popups */}
      <CustomPopup
        visible={showPopup}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        onConfirm={() => setShowPopup(false)}
      />

      <CustomPopup
        visible={showDeletePopup}
        title="Delete Dream"
        message={`Are you sure you want to delete "${dreamToDelete?.title}"? This action cannot be undone.`}
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteDream}
        onCancel={() => {
          setShowDeletePopup(false);
          setDreamToDelete(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#ffd600',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#ffd600',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dreamCard: {
    backgroundColor: '#232326',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dreamTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  dreamActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  dreamDescription: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dreamMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#666',
    fontSize: 13,
  },
  progressSection: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffd600',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 