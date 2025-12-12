import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Card } from '../../components/ui';
import { Colors } from '../../constants';

export default function AddMedicationScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Typography variant="h2" style={styles.title}>
          무엇을 추가할까요?
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.subtitle}>
          추가하고 싶은 항목을 선택해주세요
        </Typography>

        <View style={styles.optionsContainer}>
          {/* 사진으로 처방약 추가 */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/scan/camera')}
            activeOpacity={0.8}
          >
            <Card style={styles.cardContent} variant="elevated">
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="camera" size={40} color="#F97316" />
              </View>
              <Typography variant="h3" style={styles.optionTitle}>
                사진으로{'\n'}처방약 추가
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.optionDesc}>
                처방전/약봉투 사진을{'\n'}찍어서 등록해요
              </Typography>
              <View style={styles.tagContainer}>
                <View style={[styles.tag, { backgroundColor: '#F97316' }]}>
                  <Typography variant="caption" color={Colors.white}>전문</Typography>
                </View>
                <View style={[styles.tag, { backgroundColor: '#22C55E' }]}>
                  <Typography variant="caption" color={Colors.white}>일반</Typography>
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          {/* 영양제 추가 */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/supplement/search')}
            activeOpacity={0.8}
          >
            <Card style={styles.cardContent} variant="elevated">
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="nutrition" size={40} color="#3B82F6" />
              </View>
              <Typography variant="h3" style={styles.optionTitle}>
                영양제 추가하기
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.optionDesc}>
                검색하거나 직접 등록해서{'\n'}영양제를 추가해요
              </Typography>
              <View style={styles.tagContainer}>
                <View style={[styles.tag, { backgroundColor: '#3B82F6' }]}>
                  <Typography variant="caption" color={Colors.white}>영양제</Typography>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* 검색해서 등록하기 버튼 */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/medication/search')}
          activeOpacity={0.8}
        >
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={24} color="#22C55E" />
          </View>
          <View style={styles.searchTextContainer}>
            <Typography variant="body" style={styles.searchTitle}>
              검색해서 등록하기
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              약 이름으로 직접 검색해서 등록해요
            </Typography>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* 안내 문구 */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Typography variant="caption" color={Colors.textSecondary} style={styles.infoText}>
            처방전이 없는 일반의약품은 '검색해서 등록하기'에서{'\n'}
            직접 검색하여 등록할 수 있어요
          </Typography>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  optionCard: {
    flex: 1,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    minHeight: 220,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDesc: {
    textAlign: 'center',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
});
