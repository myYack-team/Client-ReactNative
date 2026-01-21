import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import { MechanismCard } from './MechanismCard';
import { FoodInteractionCard } from './FoodInteractionCard';
import { FoodSuggestionCard } from './FoodSuggestionCard';
import { LifestyleTipCard } from './LifestyleTipCard';
import { TrendTab } from './tabs/TrendTab';
import {
  MechanismGroup,
  FoodInteraction,
  FoodSuggestion,
  LifestyleTip,
  PatternAnalysis,
} from '../../types';

type TabKey = 'trend' | 'summary' | 'food' | 'tips';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  badge?: number;
}

interface ReportTabViewProps {
  mechanismGroups: MechanismGroup[];
  foodInteractions: FoodInteraction[];
  foodSuggestions?: FoodSuggestion[];
  lifestyleTips?: LifestyleTip[];
  patternAnalysis?: PatternAnalysis;
}

export function ReportTabView({
  mechanismGroups,
  foodInteractions,
  foodSuggestions = [],
  lifestyleTips = [],
  patternAnalysis,
}: ReportTabViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('trend');

  // 탭 아이콘 이미지
  const tabIcons: Record<TabKey, any> = {
    trend: require('../../assets/icons_iamge_processed/LineChart.png'),
    summary: require('../../assets/icons_iamge_processed/03_Clipboard.png'),
    food: require('../../assets/icons_iamge_processed/22_Food_plate.png'),
    tips: require('../../assets/icons_iamge_processed/18_Lightbulb.png'),
  };

  // 탭 정의 (뱃지 포함)
  const tabs: Tab[] = [
    { key: 'trend', label: '추세', icon: '📈' },
    { key: 'summary', label: '요약', icon: '📋' },
    {
      key: 'food',
      label: '음식',
      icon: '🍽️',
      badge: foodInteractions.length > 0 ? foodInteractions.length : undefined,
    },
    {
      key: 'tips',
      label: '팁',
      icon: '💡',
      badge: lifestyleTips.length > 0 ? lifestyleTips.length : undefined,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trend':
        return <TrendTab patternAnalysis={patternAnalysis} />;

      case 'summary':
        return (
          <View>
            {/* 기전 그룹 */}
            {mechanismGroups && mechanismGroups.length > 0 && (
              <View style={styles.section}>
                <Typography variant="h3" style={styles.sectionTitle}>
                  💊 약물 작용 기전
                </Typography>
                <View style={styles.cardList}>
                  {mechanismGroups.map((group, index) => (
                    <MechanismCard key={index} mechanism={group} />
                  ))}
                </View>
              </View>
            )}

            {/* 주의 음식 요약 (HIGH만) */}
            {foodInteractions && foodInteractions.filter(f => f.interactionLevel === 'HIGH').length > 0 && (
              <View style={styles.section}>
                <Typography variant="h3" style={styles.sectionTitle}>
                  ⚠️ 주의할 음식
                </Typography>
                <View style={styles.cardList}>
                  {foodInteractions.filter(f => f.interactionLevel === 'HIGH').slice(0, 2).map((interaction, index) => (
                    <FoodInteractionCard key={index} interaction={interaction} />
                  ))}
                </View>
                {foodInteractions.filter(f => f.interactionLevel === 'HIGH').length > 2 && (
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setActiveTab('food')}
                  >
                    <Typography variant="bodySmall" color={Colors.brand}>
                      더 보기 →
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );

      case 'food':
        return (
          <View>
            {/* 주의 음식 */}
            {foodInteractions && foodInteractions.length > 0 && (
              <View style={styles.section}>
                <Typography variant="h3" style={styles.sectionTitle}>
                  ⚠️ 주의할 음식
                </Typography>
                <View style={styles.cardList}>
                  {foodInteractions.map((interaction, index) => (
                    <FoodInteractionCard key={index} interaction={interaction} />
                  ))}
                </View>
              </View>
            )}

            {/* 도움 되는 음식 */}
            {foodSuggestions && foodSuggestions.length > 0 && (
              <View style={styles.section}>
                <Typography variant="h3" style={styles.sectionTitle}>
                  🥗 도움이 되는 음식
                </Typography>
                <View style={styles.cardList}>
                  {foodSuggestions.map((suggestion, index) => (
                    <FoodSuggestionCard key={index} suggestion={suggestion} />
                  ))}
                </View>
              </View>
            )}

            {/* 데이터 없음 */}
            {foodInteractions.length === 0 && foodSuggestions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Typography variant="h2" style={styles.emptyIcon}>🍽️</Typography>
                <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
                  음식 관련 정보가 없습니다.
                </Typography>
              </View>
            )}
          </View>
        );

      case 'tips':
        return (
          <View>
            {/* 생활 팁 */}
            {lifestyleTips && lifestyleTips.length > 0 ? (
              <View style={styles.section}>
                <Typography variant="h3" style={styles.sectionTitle}>
                  💡 생활 습관 팁
                </Typography>
                <Typography variant="caption" color={Colors.textSecondary} style={styles.sectionSubtitle}>
                  근거가 있는 정보만 제공합니다
                </Typography>
                <View style={styles.cardList}>
                  {lifestyleTips.map((tip, index) => (
                    <LifestyleTipCard key={index} tip={tip} />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Typography variant="h2" style={styles.emptyIcon}>💡</Typography>
                <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
                  현재 복용 중인 약물에 대한 특별한 생활 팁이 없습니다.
                </Typography>
                <Typography variant="caption" color={Colors.textTertiary} style={styles.emptySubText}>
                  일반적인 복약 지침을 따라주세요.
                </Typography>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabContent}>
              <Image
                source={tabIcons[tab.key]}
                style={[
                  styles.tabIconImage,
                  { opacity: activeTab === tab.key ? 1 : 0.6 }
                ]}
                accessibilityLabel={`${tab.label} tab icon`}
                resizeMode="contain"
              />
              <Typography
                variant="caption"
                color={activeTab === tab.key ? Colors.brand : Colors.textSecondary}
                style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}
              >
                {tab.label}
              </Typography>
              {tab.badge && tab.badge > 0 && (
                <View style={styles.tabBadge}>
                  <Typography variant="caption" color={Colors.white} style={styles.tabBadgeText}>
                    {tab.badge}
                  </Typography>
                </View>
              )}
            </View>
            {activeTab === tab.key && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginHorizontal: -20,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    // 활성 탭 스타일
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  tabIconImage: {
    width: 20,
    height: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontWeight: '400',
  },
  activeTabLabel: {
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: Colors.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: Colors.brand,
    borderRadius: 1.5,
  },
  content: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginBottom: 12,
  },
  cardList: {
    gap: 8,
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
