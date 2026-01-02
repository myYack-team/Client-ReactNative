import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Colors } from '../../constants';

interface RecentSearchListProps {
  searches: string[];
  onSelect: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClearAll: () => void;
}

export function RecentSearchList({
  searches,
  onSelect,
  onRemove,
  onClearAll,
}: RecentSearchListProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h4">최근 검색어</Typography>
        <TouchableOpacity onPress={onClearAll}>
          <Typography variant="caption" color={Colors.textSecondary}>
            전체 삭제
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searches.map((keyword) => (
          <View key={keyword} style={styles.chip}>
            <TouchableOpacity onPress={() => onSelect(keyword)} style={styles.chipContent}>
              <Typography variant="bodySmall">{keyword}</Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onRemove(keyword)} style={styles.removeButton}>
              <Ionicons name="close" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
  },
  chipContent: {
    marginRight: 4,
  },
  removeButton: {
    padding: 4,
  },
});
