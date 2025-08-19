import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
  style?: any;
}

export default function StatCard({ value, label, color = '#fff', style }: StatCardProps) {
  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.statValueContainer}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: '#232326',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#353535',
  },
  statValueContainer: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    color: '#b3b3b3',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 12,
  },
}); 