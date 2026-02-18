import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Card, SupplementTagBadge, RecentSearchList } from '../../components/ui';
import { Colors } from '../../constants';
import { supplementService } from '../../services';
import { useAuthStore } from '../../stores';
import {
  Supplement,
  SupplementTag,
  SUPPLEMENT_TAG_LABELS,
  SUPPLEMENT_TAG_OPTIONS,
} from '../../types';
import {
  SEARCH_HISTORY_KEYS,
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
} from '../../utils';

export default function SupplementSearchScreen() {
  const user = useAuthStore((state) => state.user);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<SupplementTag | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [showPopular, setShowPopular] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 초기 로드: 인기 영양제 + 최근 검색어
  useEffect(() => {
    loadPopularSupplements();
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const history = await getSearchHistory(SEARCH_HISTORY_KEYS.SUPPLEMENT);
    setRecentSearches(history);
  };

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

  const searchSupplements = async (reset: boolean = false, keyword?: string) => {
    const searchKeyword = keyword !== undefined ? keyword : searchText;
    if (!searchKeyword.trim() && !selectedTag) {
      loadPopularSupplements();
      return;
    }

    const newPage = reset ? 0 : page;
    setIsLoading(true);
    try {
      const result = await supplementService.searchSupplements({
        keyword: searchKeyword.trim() || undefined,
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
    setPage(0);
    if (selectedTag !== null) {
      searchSupplements(true);
    } else {
      if (searchText.trim()) {
        searchSupplements(true);
      } else {
        loadPopularSupplements();
      }
    }
  }, [selectedTag]);

  const handleLoadMore = () => {
    if (!isLoading && hasNext && !showPopular) {
      searchSupplements(false);
    }
  };

  // 영양제 선택 시 검색어 저장
  const handleSupplementSelect = async (item: Supplement) => {
    if (searchText.trim()) {
      await addSearchHistory(SEARCH_HISTORY_KEYS.SUPPLEMENT, searchText.trim());
    }
    router.push(`/supplement/${item.id}`);
  };

  // 최근 검색어 선택
  const handleRecentSearchSelect = (keyword: string) => {
    setSearchText(keyword);
    setPage(0);
    searchSupplements(true, keyword);
  };

  // 최근 검색어 삭제
  const handleRecentSearchRemove = async (keyword: string) => {
    await removeSearchHistory(SEARCH_HISTORY_KEYS.SUPPLEMENT, keyword);
    loadRecentSearches();
  };

  // 최근 검색어 전체 삭제
  const handleRecentSearchClear = async () => {
    await clearSearchHistory(SEARCH_HISTORY_KEYS.SUPPLEMENT);
    setRecentSearches([]);
  };

  const renderSupplementItem = ({ item }: { item: Supplement }) => {
    const isCreatedByMe = user && item.createdById === user.id;

    return (
      <TouchableOpacity
        onPress={() => handleSupplementSelect(item)}
        activeOpacity={0.8}
      >
        <Card style={styles.supplementCard} variant="elevated">
          <View style={styles.supplementContent}>
            <View style={styles.imageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.supplementImage} resizeMode="cover" />
              ) : (
                <View style={styles.supplementImagePlaceholder}>
                  <Ionicons name="leaf" size={24} color={Colors.textSecondary} />
                </View>
              )}
              {isCreatedByMe && (
                <View style={styles.myBadge}>
                  <Typography variant="caption" color={Colors.white} style={styles.myBadgeText}>
                    내가 등록 ⭐
                  </Typography>
                </View>
              )}
            </View>
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
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
          {item.selectionCount > 0 && (
            <View style={styles.selectionCountBadge}>
              <Ionicons name="people-outline" size={12} color={Colors.primary} />
              <Typography variant="caption" color={Colors.primary}>
                {item.selectionCount}명 복용 중
              </Typography>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

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

      {/* 최근 검색어 (인기 영양제 화면일 때만) */}
      {showPopular && recentSearches.length > 0 && (
        <RecentSearchList
          searches={recentSearches}
          onSelect={handleRecentSearchSelect}
          onRemove={handleRecentSearchRemove}
          onClearAll={handleRecentSearchClear}
        />
      )}

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
    position: 'relative',
  },
  supplementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  supplementImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  supplementImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myBadge: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 2,
    alignItems: 'center' as const,
  },
  myBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  selectionCountBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  supplementInfo: {
    flex: 1,
    gap: 4,
  },
  supplementName: {
    marginTop: 4,
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
