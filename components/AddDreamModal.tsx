import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addDream } from '../services/dreamService';

import CustomPopup from './CustomPopup';

interface AddDreamModalProps {
  visible: boolean;
  onClose: () => void;
  onDreamAdded: () => void;
}

export default function AddDreamModal({ visible, onClose, onDreamAdded }: AddDreamModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'short term' | 'long term'>('short term');
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState('');
  const [tasks, setTasks] = useState<string[]>(['', '', '']);
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      showCustomAlert('Error', 'Please enter a dream title');
      return;
    }

    if (!targetDate.trim()) {
      showCustomAlert('Error', 'Please select a target date');
      return;
    }

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(targetDate)) {
      showCustomAlert('Error', 'Please enter a valid date (DD/MM/YYYY)');
      return;
    }

    // Validate checklist
    if (tasks.filter(task => task.trim()).length < 3) {
      showCustomAlert(
        'Checklist Required',
        'Please add at least 3 checklist items to break down your dream into actionable steps.'
      );
      return;
    }

    try {
      setLoading(true);
      const dreamData = {
        title: title.trim(),
        description: description.trim(),
        type: (type === 'short term' ? 'short-term' : 'long-term') as 'short-term' | 'long-term',
        category,
        targetDate,
        tasks: tasks.filter(task => task.trim()).join(', '),
        progress: 0,
        daysLeft: 30, // Default to 30 days
        status: 'In progress',
        completed: false,
        checklist: tasks.filter(task => task.trim()).map(task => ({ text: task, done: false })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDream(dreamData);
      showCustomAlert('Success', 'Dream created successfully!', 'success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('short term');
      setCategory('Personal');
      setTargetDate('');
      setTasks(['', '', '']);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
        onDreamAdded();
      }, 1000);
    } catch {
      showCustomAlert('Error', 'Failed to create dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle('');
    setDescription('');
    setType('short term');
    setCategory('Personal');
    setTargetDate('');
    setTasks(['', '', '']);
    onClose();
  };

  const addTask = () => {
    setTasks([...tasks, '']);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 3) {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
    }
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleDateInput = (text: string) => {
    // Auto-add slashes
    let formatted = text.replace(/\D/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }
    if (formatted.length >= 5) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
    }
    setTargetDate(formatted);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Dream</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Dream Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dream Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to achieve?"
                placeholderTextColor="#666"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your dream in detail..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'short term' && styles.typeButtonActive]}
                  onPress={() => setType('short term')}
                >
                  <Text style={[styles.typeButtonText, type === 'short term' && styles.typeButtonTextActive]}>
                    Short Term
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'long term' && styles.typeButtonActive]}
                  onPress={() => setType('long term')}
                >
                  <Text style={[styles.typeButtonText, type === 'long term' && styles.typeButtonTextActive]}>
                    Long Term
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryContainer}>
                {['Personal', 'Career', 'Health', 'Relationships', 'Learning', 'Financial'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Date *</Text>
              <TextInput
                style={styles.input}
                value={targetDate}
                onChangeText={handleDateInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Checklist */}
            <View style={styles.inputGroup}>
              <View style={styles.checklistHeader}>
                <Text style={styles.label}>Checklist * (Min. 3 items)</Text>
                <TouchableOpacity onPress={addTask} style={styles.addTaskButton}>
                  <Feather name="plus" size={16} color="#ffd600" />
                </TouchableOpacity>
              </View>
              {tasks.map((task, index) => (
                <View key={index} style={styles.taskInputContainer}>
                  <TextInput
                    style={styles.taskInput}
                    value={task}
                    onChangeText={(value) => updateTask(index, value)}
                    placeholder={`Task ${index + 1}`}
                    placeholderTextColor="#666"
                  />
                  {tasks.length > 3 && (
                    <TouchableOpacity onPress={() => removeTask(index)} style={styles.removeTaskButton}>
                      <Feather name="x" size={16} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

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
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#ffd600',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#232326',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  typeButtonActive: {
    backgroundColor: '#ffd600',
    borderColor: '#ffd600',
  },
  typeButtonText: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#000',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#232326',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2d',
  },
  categoryButtonActive: {
    backgroundColor: '#ffd600',
    borderColor: '#ffd600',
  },
  categoryButtonText: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#000',
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addTaskButton: {
    padding: 8,
  },
  taskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  taskInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  removeTaskButton: {
    padding: 8,
  },
}); 