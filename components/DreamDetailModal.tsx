import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Dream } from './DreamCard';
import { updateDream, deleteDream } from '../services/dreamService';
import CustomPopup from './CustomPopup';



interface DreamDetailModalProps {
  visible: boolean;
  dream: Dream | null;
  onClose: () => void;
  onDreamUpdated: () => void;
  onDreamDeleted: () => void;
}

export default function DreamDetailModal({ 
  visible, 
  dream, 
  onClose, 
  onDreamUpdated, 
  onDreamDeleted 
}: DreamDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  useEffect(() => {
    if (dream) {
      setEditedTitle(dream.title);
      setEditedDescription(dream.description);
    }
  }, [dream]);

  if (!dream) return null;

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      showCustomAlert('Error', 'Title cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateDream(dream.id, {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
      });
      setEditing(false);
      showCustomAlert('Success', 'Dream updated successfully!', 'success');
      onDreamUpdated();
    } catch {
      showCustomAlert('Error', 'Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedTitle(dream.title);
    setEditedDescription(dream.description);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const updatedChecklist = [...(dream.checklist || []), { text: newTask.trim(), done: false }];
      await updateDream(dream.id, { checklist: updatedChecklist });
      setNewTask('');
      showCustomAlert('Success', 'Task added successfully!', 'success');
      onDreamUpdated();
    } catch {
      showCustomAlert('Error', 'Failed to add task. Please try again.');
    }
  };

  const removeTask = async (index: number) => {
    try {
      const updatedChecklist = dream.checklist?.filter((_, i) => i !== index) || [];
      await updateDream(dream.id, { checklist: updatedChecklist });
      showCustomAlert('Success', 'Task removed successfully!', 'success');
      onDreamUpdated();
    } catch {
      showCustomAlert('Error', 'Failed to remove task. Please try again.');
    }
  };

  const toggleTask = async (index: number) => {
    try {
      const updatedChecklist = [...(dream.checklist || [])];
      updatedChecklist[index].done = !updatedChecklist[index].done;
      
      // Calculate new progress
      const completedTasks = updatedChecklist.filter(task => task.done).length;
      const totalTasks = updatedChecklist.length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Auto-complete dream if all tasks are done
      const newCompleted = newProgress === 100;
      
      await updateDream(dream.id, { 
        checklist: updatedChecklist, 
        progress: newProgress,
        completed: newCompleted
      });
      
      showCustomAlert('Success', 'Task updated successfully!', 'success');
      onDreamUpdated();
    } catch {
      showCustomAlert('Error', 'Failed to save changes. Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteDream(dream.id);
      showCustomAlert('Success', 'Dream deleted successfully!', 'success');
      setTimeout(() => {
        onDreamDeleted();
        onClose();
      }, 1000);
    } catch {
      showCustomAlert('Error', 'Failed to delete dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = dream.progress || 0;
  const checklist = dream.checklist || [];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dream Details</Text>
            <View style={styles.headerActions}>
              {editing ? (
                <>
                  <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <Feather name="edit-2" size={20} color="#ffd600" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDeletePopup(true)} style={styles.deleteButton}>
                    <Feather name="trash-2" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            {editing ? (
              <TextInput
                style={styles.titleInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Dream title"
                placeholderTextColor="#666"
              />
            ) : (
              <Text style={styles.title}>{dream.title}</Text>
            )}

            {/* Description */}
            {editing ? (
              <TextInput
                style={styles.descriptionInput}
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Dream description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.description}>{dream.description}</Text>
            )}

            {/* Progress */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}% Complete</Text>
            </View>

            {/* Checklist */}
            <View style={styles.checklistSection}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              
              {/* Add new task */}
              <View style={styles.addTaskContainer}>
                <TextInput
                  style={styles.taskInput}
                  value={newTask}
                  onChangeText={setNewTask}
                  placeholder="Add a new task..."
                  placeholderTextColor="#666"
                  onSubmitEditing={addTask}
                />
                <TouchableOpacity onPress={addTask} style={styles.addTaskButton}>
                  <Feather name="plus" size={20} color="#ffd600" />
                </TouchableOpacity>
              </View>

              {/* Task list */}
              {checklist.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <TouchableOpacity
                    style={styles.taskCheckbox}
                    onPress={() => toggleTask(index)}
                  >
                    <Feather
                      name={task.done ? 'check-square' : 'square'}
                      size={20}
                      color={task.done ? '#10b981' : '#666'}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.taskText, task.done && styles.taskTextCompleted]}>
                    {task.text}
                  </Text>
                  <TouchableOpacity onPress={() => removeTask(index)} style={styles.removeTaskButton}>
                    <Feather name="x" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Dream Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>{dream.type}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>{dream.category}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{dream.status}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Days Left:</Text>
                <Text style={styles.infoValue}>{dream.daysLeft} days</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
        message="Are you sure you want to delete this dream? This action cannot be undone."
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeletePopup(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2d',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#232326',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 36,
  },
  titleInput: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  description: {
    color: '#b3b3b3',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  descriptionInput: {
    color: '#b3b3b3',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a2a2d',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2d',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10b981', // Default color, will be overridden by progress value
  },
  progressText: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  checklistSection: {
    marginBottom: 24,
  },
  checklistContainer: {
    gap: 12,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  removeTaskButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChecklist: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  addTaskContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  taskInput: {
    flex: 1,
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  addTaskButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2d',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 