import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: any;
}

export default function FilterButton({ label, isActive, onPress, style }: FilterButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && styles.filterButtonActive,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        isActive && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    backgroundColor: '#232326',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: '#ffd600',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#000',
  },
}); 