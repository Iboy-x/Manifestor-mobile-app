import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CategoryButtonProps {
  name: string;
  count: number;
  icon: string;
  onPress?: () => void;
  style?: any;
}

export default function CategoryButton({ name, count, icon, onPress, style }: CategoryButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.categoryButton, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Feather name={icon as any} size={14} color="#ffd600" />
      <Text style={styles.categoryText}>
        {name} ({count})
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryButton: {
    backgroundColor: '#232326',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 