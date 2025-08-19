import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface CustomPopupProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export default function CustomPopup({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info'
}: CustomPopupProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' };
      case 'warning':
        return { icon: 'alert-triangle', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
      case 'error':
        return { icon: 'x-circle', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
      default:
        return { icon: 'info', color: '#ffd600', bgColor: 'rgba(255, 214, 0, 0.1)' };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: typeStyles.bgColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: typeStyles.color }]}>
              <Feather name={typeStyles.icon as any} size={24} color="#000" />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: typeStyles.color }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popup: {
    backgroundColor: '#232326',
    borderRadius: 20,
    width: screenWidth - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#353535',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  messageContainer: {
    padding: 24,
    paddingTop: 20,
  },
  message: {
    color: '#b3b3b3',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#353535',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  cancelButtonText: {
    color: '#b3b3b3',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
