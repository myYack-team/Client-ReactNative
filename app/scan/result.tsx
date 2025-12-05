import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors, TIMING_OPTIONS, TimingOption } from '../../constants';
import { useMedicationStore } from '../../stores';
import { ScannedMedication } from '../../types';

export default function ResultScreen() {
  const { currentScanResult, addMedication, clearScanResult, isLoading } = useMedicationStore();
  const [medications, setMedications] = useState<ScannedMedication[]>(
    currentScanResult?.medications || []
  );

  const updateMedication = (index: number, field: keyof ScannedMedication, value: any) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const toggleTiming = (index: number, timing: TimingOption) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med;
        const newTiming = med.timing.includes(timing)
          ? med.timing.filter((t) => t !== timing)
          : [...med.timing, timing];
        return { ...med, timing: newTiming };
      })
    );
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (medications.length === 0) {
      Alert.alert('오류', '등록할 약이 없어요.');
      return;
    }

    try {
      for (const med of medications) {
        await addMedication({
          name: med.name,
          dosage: med.dosage,
          frequency: parseInt(med.frequency) || 1,
          timing: med.timing,
          durationDays: med.durationDays,
          totalCount: med.totalCount,
          remainingCount: med.totalCount,
          startDate: new Date().toISOString(),
        });
      }

      clearScanResult();
      Alert.alert('등록 완료', '약이 성공적으로 등록되었어요!', [
        { text: '확인', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      Alert.alert('오류', '약 등록에 실패했어요. 다시 시도해주세요.');
    }
  };

  if (!currentScanResult || medications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContent}>
          <Typography variant="body">인식된 약이 없어요</Typography>
          <Button
            title="다시 촬영하기"
            variant="primary"
            onPress={() => router.back()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {currentScanResult.confidence === 'medium' && (
          <Card style={styles.warningCard}>
            <Typography variant="bodySmall" color={Colors.warning}>
              일부 정보가 명확하지 않아요.{'\n'}정보를 확인하고 수정해주세요.
            </Typography>
          </Card>
        )}

        <Typography variant="h3" style={styles.sectionTitle}>
          인식된 약 정보
        </Typography>

        {medications.map((med, index) => (
          <Card key={index} style={styles.medicationCard} variant="elevated">
            <View style={styles.cardHeader}>
              <Typography variant="h3">약 {index + 1}</Typography>
              {medications.length > 1 && (
                <TouchableOpacity onPress={() => removeMedication(index)}>
                  <Typography variant="body" color={Colors.error}>
                    삭제
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                약 이름
              </Typography>
              <TextInput
                style={styles.input}
                value={med.name}
                onChangeText={(text) => updateMedication(index, 'name', text)}
                placeholder="약 이름을 입력하세요"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  1회 복용량
                </Typography>
                <TextInput
                  style={styles.input}
                  value={med.dosage}
                  onChangeText={(text) => updateMedication(index, 'dosage', text)}
                  placeholder="예: 1정"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  하루 횟수
                </Typography>
                <TextInput
                  style={styles.input}
                  value={med.frequency}
                  onChangeText={(text) => updateMedication(index, 'frequency', text)}
                  keyboardType="numeric"
                  placeholder="예: 2"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                복용 시점
              </Typography>
              <View style={styles.timingGrid}>
                {TIMING_OPTIONS.map((timing) => (
                  <TouchableOpacity
                    key={timing}
                    style={[
                      styles.timingButton,
                      med.timing.includes(timing) && styles.timingButtonActive,
                    ]}
                    onPress={() => toggleTiming(index, timing)}
                  >
                    <Typography
                      variant="caption"
                      color={med.timing.includes(timing) ? Colors.white : Colors.textPrimary}
                    >
                      {timing}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  처방 일수
                </Typography>
                <TextInput
                  style={styles.input}
                  value={String(med.durationDays)}
                  onChangeText={(text) =>
                    updateMedication(index, 'durationDays', parseInt(text) || 0)
                  }
                  keyboardType="numeric"
                  placeholder="예: 7"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  총 개수
                </Typography>
                <TextInput
                  style={styles.input}
                  value={String(med.totalCount)}
                  onChangeText={(text) =>
                    updateMedication(index, 'totalCount', parseInt(text) || 0)
                  }
                  keyboardType="numeric"
                  placeholder="예: 14"
                />
              </View>
            </View>
          </Card>
        ))}

        <Typography variant="caption" color={Colors.textSecondary} style={styles.notice}>
          정보가 맞지 않으면 터치해서 수정해주세요
        </Typography>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="확인하고 등록"
          variant="primary"
          size="large"
          onPress={handleSubmit}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderColor: Colors.warning,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  medicationCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  timingButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  notice: {
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
