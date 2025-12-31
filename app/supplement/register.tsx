import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography, Button, Card } from '../../components/ui';
import { Colors } from '../../constants';
import { supplementService } from '../../services';
import {
  SupplementTag,
  SUPPLEMENT_TAG_LABELS,
  SUPPLEMENT_TAG_OPTIONS,
} from '../../types';

export default function SupplementRegisterScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTag, setSelectedTag] = useState<SupplementTag | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '영양제 이름을 입력해주세요.');
      return;
    }
    if (!selectedTag) {
      Alert.alert('알림', '영양제 종류를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const supplement = await supplementService.createSupplementWithImage({
        name: name.trim(),
        description: description.trim() || undefined,
        tag: selectedTag,
        imageUri: imageUri || undefined,
      });

      Alert.alert('등록 완료', '영양제가 등록되었습니다.', [
        {
          text: '복용 정보 설정하기',
          onPress: () => router.replace(`/supplement/add/${supplement.id}`),
        },
        {
          text: '나중에 하기',
          style: 'cancel',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to register supplement:', error);
      Alert.alert('오류', '영양제 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="body" color={Colors.textSecondary} style={styles.description}>
            복용 중인 영양제를 등록하면{'\n'}
            다른 분들도 검색해서 사용할 수 있어요
          </Typography>

          {/* 영양제 이미지 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              영양제 사진 (선택)
            </Typography>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={28} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
                <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.imagePickerText}>
                  사진 추가하기
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          {/* 영양제 이름 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              영양제 이름 *
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="예: 종근당 프로메가 오메가3"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
          </View>

          {/* 설명 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              설명 (선택)
            </Typography>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="영양제에 대한 간단한 설명을 입력해주세요"
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* 종류 선택 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              종류 선택 *
            </Typography>
            <View style={styles.tagGrid}>
              {SUPPLEMENT_TAG_OPTIONS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTag === tag && styles.tagButtonSelected,
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Typography
                    variant="bodySmall"
                    color={selectedTag === tag ? Colors.white : Colors.text}
                  >
                    {SUPPLEMENT_TAG_LABELS[tag]}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 안내 */}
          <Card style={styles.infoCard}>
            <Typography variant="caption" color={Colors.textSecondary}>
              * 등록한 영양제는 다른 사용자들도 검색하고 선택할 수 있습니다.{'\n'}
              * 허위 정보 등록 시 삭제될 수 있습니다.
            </Typography>
          </Card>
        </ScrollView>

        <View style={styles.bottomButton}>
          <Button
            title="영양제 등록하기"
            variant="primary"
            size="large"
            onPress={handleRegister}
            loading={isLoading}
            disabled={!name.trim() || !selectedTag}
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
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  description: {
    marginBottom: 24,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
  },
  bottomButton: {
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
