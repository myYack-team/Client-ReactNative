import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Typography } from './Typography';
import { Colors } from '../../constants';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../../constants/termsContent';

export type TermsType = 'terms' | 'privacy';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  type: TermsType;
}

const getTitle = (type: TermsType): string => {
  switch (type) {
    case 'terms':
      return '이용약관';
    case 'privacy':
      return '개인정보 처리방침';
    default:
      return '';
  }
};

const getContent = (type: TermsType): string => {
  switch (type) {
    case 'terms':
      return TERMS_OF_SERVICE;
    case 'privacy':
      return PRIVACY_POLICY;
    default:
      return '';
  }
};

export function TermsModal({ visible, onClose, type }: TermsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* 헤더 */}
        <View style={styles.header}>
          <Typography variant="h2" style={styles.title}>
            {getTitle(type)}
          </Typography>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Typography variant="body" color={Colors.primary}>
              닫기
            </Typography>
          </TouchableOpacity>
        </View>

        {/* 콘텐츠 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Typography variant="body" style={styles.content}>
            {getContent(type)}
          </Typography>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    lineHeight: 24,
    color: Colors.textSecondary,
  },
});
