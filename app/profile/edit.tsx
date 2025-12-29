import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useAuthStore } from '../../stores';
import { userService } from '../../services';

export default function EditProfileScreen() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    if (name.trim() === user?.name) {
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      await userService.updateMe({ name: name.trim() });
      Alert.alert('완료', '프로필이 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('오류', '프로필 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* 프로필 이미지 */}
        <Card style={styles.imageCard} variant="elevated">
          <View style={styles.imageContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Typography variant="h1">👤</Typography>
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
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력하세요"
            placeholderTextColor={Colors.textSecondary}
            maxLength={20}
          />
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
  saveButton: {
    marginTop: 'auto',
  },
});
