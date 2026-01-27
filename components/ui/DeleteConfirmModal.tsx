import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemCount: number;
  itemType: 'medication' | 'prescription';
  firstItemName?: string;
}

export function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  itemCount,
  itemType,
  firstItemName,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getItemTypeText = () => {
    return itemType === 'medication' ? '약' : '처방전';
  };

  const getMessage = () => {
    const typeText = getItemTypeText();
    if (itemCount === 1 && firstItemName) {
      return `${firstItemName}을(를) 정말 삭제하시겠습니까?`;
    }
    if (firstItemName) {
      return `${firstItemName} 외 ${itemCount - 1}개를 정말 삭제하시겠습니까?`;
    }
    return `${itemCount}개의 ${typeText}을(를) 정말 삭제하시겠습니까?`;
  };

  const handleConfirm = async () => {
    if (isDeleting) return; // 중복 클릭 방지

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return; // 삭제 중에는 닫기 방지
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <Text style={styles.message}>{getMessage()}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, isDeleting && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelText, isDeleting && styles.textDisabled]}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, isDeleting && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color={Colors.error} size="small" />
              ) : (
                <Text style={styles.confirmText}>확인</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.error,
    opacity: 0.7,
  },
  textDisabled: {
    opacity: 0.5,
  },
});