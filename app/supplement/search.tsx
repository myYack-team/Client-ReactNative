import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Card, SupplementTagBadge } from '../../components/ui';
import { Colors } from '../../constants';
import { supplementService } from '../../services';
import {
  Supplement,
  SupplementTag,
  SUPPLEMENT_TAG_LABELS,
  SUPPLEMENT_TAG_OPTIONS,
} from '../../types';

export default function SupplementSearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<SupplementTag | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [showPopular, setShowPopular] = useState(true);

  // 초기 로드: 인기 영양제
  useEffect(() => {
    loadPopularSupplements();
  }, []);

  const loadPopularSupplements = async () => {
    setIsLoading(true);
    try {
      const result = await supplementService.getPopularSupplements({ page: 0, size: 20 });
      setSupplements(result.supplements);
      setHasNext(result.hasNext);
      setShowPopular(true);
    } catch (error) {
      console.error('Failed to load popular supplements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchSupplements = async (reset: boolean = false) => {
    if (!searchText.trim() && !selectedTag) {
      loadPopularSupplements();
      return;
    }

    const newPage = reset ? 0 : page;
    setIsLoading(true);
    try {
      const result = await supplementService.searchSupplements({
        keyword: searchText.trim() || undefined,
        tag: selectedTag || undefined,
        page: newPage,
        size: 10,
      });

      if (reset) {
        setSupplements(result.supplements);
      } else {
        setSupplements((prev) => [...prev, ...result.supplements]);
      }
      setHasNext(result.hasNext);
      setPage(newPage + 1);
      setShowPopular(false);
    } catch (error) {
      console.error('Failed to search supplements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    searchSupplements(true);
  };

  const handleTagSelect = (tag: SupplementTag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  useEffect(() => {
    if (selectedTag !== null) {
      setPage(0);
      searchSupplements(true);
    }
  }, [selectedTag]);

  const handleLoadMore = () => {
    if (!isLoading && hasNext && !showPopular) {
      searchSupplements(false);
    }
  };

  const renderSupplementItem = ({ item }: { item: Supplement }) => (
    <TouchableOpacity
      onPress={() => router.push(`/supplement/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.supplementCard} variant="elevated">
        <View style={styles.supplementContent}>
          <View style={styles.supplementInfo}>
            <SupplementTagBadge tag={item.tag} />
            <Typography variant="h4" style={styles.supplementName} numberOfLines={1}>
              {item.name}
            </Typography>
            {item.description && (
              <Typography variant="bodySmall" color={Colors.textSecondary} numberOfLines={2}>
                {item.description}
              </Typography>
            )}
            <View style={styles.metaRow}>
              <Typography variant="caption" color={Colors.textSecondary}>
                {item.createdByName}님 등록
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                {item.selectionCount}명 복용 중
              </Typography>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 검색바 */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="영양제 이름으로 검색"
            placeholderTextColor={Colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 태그 필터 */}
        <FlatList
          data={SUPPLEMENT_TAG_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tagChip,
                selectedTag === item && styles.tagChipSelected,
              ]}
              onPress={() => handleTagSelect(item)}
            >
              <Typography
                variant="caption"
                color={selectedTag === item ? Colors.white : Colors.textSecondary}
              >
                {SUPPLEMENT_TAG_LABELS[item]}
              </Typography>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tagList}
        />
      </View>

      {/* 섹션 제목 */}
      <View style={styles.sectionHeader}>
        <Typography variant="h4">
          {showPopular ? '인기 영양제' : '검색 결과'}
        </Typography>
        <TouchableOpacity onPress={() => router.push('/supplement/register')}>
          <Typography variant="body" color={Colors.primary}>
            + 직접 등록하기
          </Typography>
        </TouchableOpacity>
      </View>

      {/* 영양제 목록 */}
      <FlatList
        data={supplements}
        renderItem={renderSupplementItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color={Colors.textSecondary} />
              <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
                검색 결과가 없어요
              </Typography>
              <TouchableOpacity onPress={() => router.push('/supplement/register')}>
                <Typography variant="body" color={Colors.primary}>
                  직접 등록하기
                </Typography>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  tagList: {
    paddingVertical: 12,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    marginRight: 8,
  },
  tagChipSelected: {
    backgroundColor: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  supplementCard: {
    marginBottom: 12,
  },
  supplementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplementInfo: {
    flex: 1,
    gap: 4,
  },
  supplementName: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    marginTop: 8,
  },
});
