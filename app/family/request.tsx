import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useFamilyStore, useAuthStore } from '../../stores';

export default function FamilyRequestScreen() {
  const { user } = useAuthStore();
  const { sendLinkRequest, isLoadingStatus } = useFamilyStore();
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 전화번호 포맷팅 (숫자만)
  const handlePhoneChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 11) {
      setPhone(numbersOnly);
    }
  };

  // 전화번호 표시 포맷
  const getFormattedPhone = (phoneNumber: string) => {
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 7) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
  };

  const validatePhone = () => {
    if (phone.length !== 11) {
      Alert.alert('알림', '올바른 전화번호를 입력해주세요.');
      return false;
    }
    if (!phone.startsWith('010')) {
      Alert.alert('알림', '휴대폰 번호는 010으로 시작해야 합니다.');
      return false;
    }
    if (phone === user?.phone?.replace(/-/g, '')) {
      Alert.alert('알림', '본인의 전화번호는 입력할 수 없습니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePhone()) return;

    setIsSubmitting(true);
    try {
      const result = await sendLinkRequest(phone);
      Alert.alert(
        '요청 완료',
        result.message || `${result.targetName}님에게 연동 요청을 보냈습니다.`,
        [{ text: '확인', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('오류', error.message || '연동 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Card style={styles.card} variant="elevated">
            <Typography variant="h3" style={styles.title}>
              가족의 전화번호를 입력하세요
            </Typography>
            <Typography variant="body" color={Colors.textSecondary} style={styles.description}>
              가족에게 연동 요청이 전송됩니다.{'\n'}
              상대방이 수락하면 복약 현황을 확인할 수 있어요.
            </Typography>

            <View style={styles.inputContainer}>
              <Typography variant="body" style={styles.inputLabel}>
                전화번호
              </Typography>
              <TextInput
                style={styles.textInput}
                value={getFormattedPhone(phone)}
                onChangeText={handlePhoneChange}
                placeholder="010-1234-5678"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={13}
                autoFocus
              />
              <Typography variant="caption" color={Colors.textSecondary} style={styles.inputHint}>
                하이픈(-) 없이 숫자만 입력하세요
              </Typography>
            </View>
          </Card>

          <View style={styles.infoCard}>
            <Typography variant="caption" color={Colors.textSecondary}>
              * 상대방이 마이약 앱에 가입되어 있어야 합니다
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              * 상대방의 동의 후 연동이 완료됩니다
            </Typography>
          </View>

          <Button
            title={isSubmitting ? '요청 중...' : '가족 연결 요청'}
            variant="primary"
            size="large"
            onPress={handleSubmit}
            disabled={isSubmitting || phone.length !== 11}
            style={styles.submitButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  inputHint: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    gap: 4,
  },
  submitButton: {
    marginTop: 'auto',
  },
});
