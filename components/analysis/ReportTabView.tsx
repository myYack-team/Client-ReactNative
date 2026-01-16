import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '../ui';
import { SummaryTab, FoodTab, SupplementTab, TipsTab } from './tabs';
import { Colors } from '../../constants';
import { AnalysisResult } from '../../types';

interface ReportTabViewProps {
  result: AnalysisResult;
}

type TabKey = 'summary' | 'food' | 'supplement' | 'tips';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { key: 'summary', label: '요약', icon: String.fromCodePoint(0x1F4CB) },
  { key: 'food', label: '음식', icon: String.fromCodePoint(0x1F37D) },
  { key: 'supplement', label: '영양제', icon: String.fromCodePoint(0x1F48A) },
  { key: 'tips', label: '팁', icon: String.fromCodePoint(0x1F4A1) },
];

export function ReportTabView({ result }: ReportTabViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab result={result} />;
      case 'food':
        return <FoodTab result={result} />;
      case 'supplement':
        return <SupplementTab result={result} />;
      case 'tips':
        return <TipsTab result={result} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Typography
                variant="bodySmall"
                color={isActive ? Colors.brand : Colors.textSecondary}
                style={styles.tabIcon}
              >
                {tab.icon}
              </Typography>
              <Typography
                variant="caption"
                color={isActive ? Colors.brand : Colors.textSecondary}
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Typography>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 탭 콘텐츠 */}
      <View style={styles.tabContent}>
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
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {
    // active styles handled by indicator
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: Colors.brand,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabContent: {
    flex: 1,
  },
});
