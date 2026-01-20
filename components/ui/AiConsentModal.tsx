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
              textStyle={styles.buttonText}
            />
            <Button
              title={isLoading ? '' : '동의'}
              onPress={handleAgree}
              disabled={!isChecked || isLoading}
              style={styles.button}
              textStyle={styles.buttonText}
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
    padding: 28,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    width: '100%',
    maxWidth: 300,
    maxHeight: '65%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    padding: 14,
  },
  content: {
    lineHeight: 18,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  button: {
    flex: 1,
    height: 36,
    paddingVertical: 0,
  },
  buttonText: {
    fontSize: 13,
  },
});
