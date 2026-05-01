import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Image, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useAuthStore } from '../../stores';
import { userService } from '../../services';

// 닉네임 유효성 검사: 2~20자, 한글/영문/숫자만 허용 (특수문자, 공백 불가)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]*$/;
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

const validateNickname = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return '이름을 입력해주세요.';
  if (trimmed.length < NICKNAME_MIN) return `이름은 ${NICKNAME_MIN}자 이상이어야 합니다.`;
  if (trimmed.length > NICKNAME_MAX) return `이름은 ${NICKNAME_MAX}자 이하여야 합니다.`;
  if (!NICKNAME_REGEX.test(trimmed)) return '이름에 특수문자나 공백을 사용할 수 없습니다.';
  return null;
};

export default function EditProfileScreen() {
  const { user, fetchUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phone, setPhone] = useState(user?.phone?.replace(/-/g, '') || '');
  const [isLoading, setIsLoading] = useState(false);

  // 이름 입력 핸들러 (특수문자/공백 필터링)
  const handleNameChange = (text: string) => {
    // 공백, 특수문자, 미완성 자모 실시간 제거
    const filtered = text.replace(/[^가-힣a-zA-Z0-9]/g, '');
    setName(filtered);
    if (nameError && filtered.length >= NICKNAME_MIN) {
      setNameError(validateNickname(filtered));
    }
  };

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

  const handleSave = async () => {
    const nicknameError = validateNickname(name);
    if (nicknameError) {
      setNameError(nicknameError);
      Alert.alert('알림', nicknameError);
      return;
    }

    // 전화번호 유효성 검사 (입력된 경우만)
    if (phone && phone.length !== 11) {
      Alert.alert('알림', '전화번호를 올바르게 입력해주세요. (11자리)');
      return;
    }

    if (phone && !phone.startsWith('010')) {
      Alert.alert('알림', '휴대폰 번호는 010으로 시작해야 합니다.');
      return;
    }

    const nameChanged = name.trim() !== user?.name;
    const phoneChanged = phone !== (user?.phone?.replace(/-/g, '') || '');

    if (!nameChanged && !phoneChanged) {
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      // 이름 변경
      if (nameChanged) {
        await userService.updateMe({ name: name.trim() });
      }
      // 전화번호 변경
      if (phoneChanged) {
        await userService.updatePhone(phone);
      }
      // 유저 정보 갱신
      await fetchUser();
      Alert.alert('완료', '프로필이 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const message = error?.message || '프로필 수정에 실패했습니다.';
      // 닉네임 관련 서버 에러는 이름 필드에 에러 표시
      if (message.includes('이름') || message.includes('이미 사용')) {
        setNameError(message);
      }
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* 프로필 이미지 */}
        <Card style={styles.imageCard} variant="elevated">
          <View style={styles.imageContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} resizeMode="cover" />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Image
                  source={require('../../assets/icons_iamge_processed/05_User.png')}
                  style={styles.profilePlaceholderIcon}
                  accessibilityLabel="Profile placeholder"
                  resizeMode="contain"
                />
              </View>
            )}
            <Typography variant="caption" color={Colors.textSecondary} style={styles.imageHint}>
              카카오 프로필 이미지 사용 중
            </Typography>
          </View>
        </Card>

        {/* 이름 입력 */}
        <Card style={styles.inputCard} variant="elevated">
          <Typography variant="body" style={styles.inputLabel}>이름</Typography>
          <TextInput
            style={[styles.textInput, nameError ? styles.textInputError : null]}
            value={name}
            onChangeText={handleNameChange}
            onBlur={() => setNameError(validateNickname(name))}
            placeholder="이름을 입력하세요"
            placeholderTextColor={Colors.textSecondary}
            maxLength={20}
          />
          {nameError ? (
            <Typography variant="caption" color={Colors.error} style={styles.inputHint}>
              {nameError}
            </Typography>
          ) : (
            <Typography variant="caption" color={Colors.textSecondary} style={styles.inputHint}>
              2~20자, 한글/영문/숫자만 사용 가능
            </Typography>
          )}
        </Card>

        {/* 전화번호 입력 */}
        <Card style={styles.inputCard} variant="elevated">
          <Typography variant="body" style={styles.inputLabel}>전화번호</Typography>
          <TextInput
            style={styles.textInput}
            value={getFormattedPhone(phone)}
            onChangeText={handlePhoneChange}
            placeholder="010-1234-5678"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={13}
          />
          <Typography variant="caption" color={Colors.textSecondary} style={styles.inputHint}>
            가족 연동 시 사용됩니다
          </Typography>
        </Card>

        {/* 이메일 (읽기 전용) */}
        <Card style={styles.inputCard} variant="elevated">
          <Typography variant="body" style={styles.inputLabel}>이메일</Typography>
          <View style={styles.readOnlyField}>
            <Typography variant="body" color={Colors.textSecondary}>
              {user?.email || '이메일 없음'}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              (변경 불가)
            </Typography>
          </View>
        </Card>

        {/* 저장 버튼 */}
        <Button
          title={isLoading ? '저장 중...' : '저장하기'}
          variant="primary"
          size="large"
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButton}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageCard: {
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profilePlaceholderIcon: {
    width: 60,
    height: 60,
  },
  imageHint: {
    textAlign: 'center',
  },
  inputCard: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textInputError: {
    borderColor: Colors.error,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundSecondary,
  },
  inputHint: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 24,
  },
});
