import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography, Button } from '../components/ui';
import { Colors } from '../constants';
import { userService } from '../services';
import { useAuthStore } from '../stores';
import {
  Gender,
  SignupPurpose,
  GENDER_LABELS,
  AGE_RANGE_OPTIONS,
  SIGNUP_PURPOSE_LABELS,
  SIGNUP_PURPOSE_OPTIONS,
  AgeRange,
} from '../types';

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RadioOption({ label, selected, onSelect }: RadioOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.radioOption, selected && styles.radioOptionSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Typography
        variant="body"
        style={[styles.radioLabel, selected && styles.radioLabelSelected]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

interface CheckboxOptionProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

function CheckboxOption({ label, checked, onToggle }: CheckboxOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.checkboxOption, checked && styles.checkboxOptionSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Typography style={styles.checkmark}>✓</Typography>}
      </View>
      <Typography
        variant="body"
        style={[styles.checkboxLabel, checked && styles.checkboxLabelSelected]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [signupPurposes, setSignupPurposes] = useState<SignupPurpose[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const togglePurpose = (purpose: SignupPurpose) => {
    setSignupPurposes((prev) =>
      prev.includes(purpose)
        ? prev.filter((p) => p !== purpose)
        : [...prev, purpose]
    );
  };

  const isFormValid = gender && ageRange && signupPurposes.length > 0;

  const handleSubmit = async () => {
    if (!gender || !ageRange || signupPurposes.length === 0) {
      Alert.alert('알림', '모든 항목을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await userService.setupProfile({
        gender,
        ageRange,
        signupPurposes,
      });
      completeOnboarding();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('기본정보 설정 실패:', error);
      Alert.alert('오류', '기본정보 설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            기본정보 입력
          </Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            더 나은 서비스를 위해 기본정보를 입력해주세요.
          </Typography>
        </View>

        {/* 성별 선택 */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            성별
          </Typography>
          <View style={styles.optionsRow}>
            {(['MALE', 'FEMALE'] as Gender[]).map((g) => (
              <View key={g} style={styles.optionHalf}>
                <RadioOption
                  label={GENDER_LABELS[g]}
                  selected={gender === g}
                  onSelect={() => setGender(g)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* 연령대 선택 */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            연령대
          </Typography>
          <View style={styles.optionsGrid}>
            {AGE_RANGE_OPTIONS.map((age) => (
              <View key={age} style={styles.optionHalf}>
                <RadioOption
                  label={age}
                  selected={ageRange === age}
                  onSelect={() => setAgeRange(age)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* 가입 목적 선택 */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            가입 목적
          </Typography>
          <Typography
            variant="caption"
            color={Colors.textSecondary}
            style={styles.sectionSubtitle}
          >
            복수 선택 가능
          </Typography>
          <View style={styles.optionsColumn}>
            {SIGNUP_PURPOSE_OPTIONS.map((purpose) => (
              <CheckboxOption
                key={purpose}
                label={SIGNUP_PURPOSE_LABELS[purpose]}
                checked={signupPurposes.includes(purpose)}
                onToggle={() => togglePurpose(purpose)}
              />
            ))}
          </View>
        </View>

        <Button
          title={isLoading ? '' : '시작하기'}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
          style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
        >
          {isLoading && <ActivityIndicator color={Colors.white} />}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionSubtitle: {
    marginBottom: 12,
    marginTop: -8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionHalf: {
    width: '48%',
  },
  optionsColumn: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  radioOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLightest,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    flex: 1,
    fontSize: 16,
  },
  radioLabelSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  checkboxOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLightest,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
  },
  checkboxLabelSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  submitButton: {
    marginTop: 24,
    height: 56,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
