import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { Colors } from '../../constants';
import { AI_DATA_CONSENT } from '../../constants/termsContent';

interface AiConsentModalProps {
  visible: boolean;
  onAgree: () => Promise<void>;
  onCancel: () => void;
}

export function AiConsentModal({ visible, onAgree, onCancel }: AiConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAgree = async () => {
    if (!isChecked || isLoading) return;

    setIsLoading(true);
    try {
      await onAgree();
    } finally {
      setIsLoading(false);
      setIsChecked(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    setIsChecked(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Typography variant="h2" style={styles.title}>
              AI 데이터 분석 동의
            </Typography>
          </View>

          {/* 콘텐츠 */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Typography variant="body" style={styles.content}>
              {AI_DATA_CONSENT}
            </Typography>
          </ScrollView>

          {/* 체크박스 */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsChecked(!isChecked)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Typography style={styles.checkmark}>V</Typography>}
            </View>
            <Typography variant="body" style={styles.checkboxLabel}>
              위 내용을 확인하였으며, AI 데이터 분석에 동의합니다.
            </Typography>
          </TouchableOpacity>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <Button
              title="취소"
              variant="outline"
              onPress={handleCancel}
              disabled={isLoading}
              style={styles.button}
            />
            <Button
              title={isLoading ? '' : '동의'}
              onPress={handleAgree}
              disabled={!isChecked || isLoading}
              style={styles.button}
            >
              {isLoading && <ActivityIndicator color={Colors.white} size="small" />}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 300,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    lineHeight: 22,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginRight: 12,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
