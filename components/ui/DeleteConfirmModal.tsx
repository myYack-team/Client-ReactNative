import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors } from '../../constants';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <Text style={styles.message}>{getMessage()}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.confirmText}>확인</Text>
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
    backgroundColor: Colors.error,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});