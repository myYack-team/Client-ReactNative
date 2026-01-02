import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { Typography, Card, RecentSearchList } from '../../components/ui';
import { DrugTypeBadge } from '../../components/ui';
import { Colors } from '../../constants';
import { drugService } from '../../services/drug';
import { DrugInfo } from '../../types';
import {
  SEARCH_HISTORY_KEYS,
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
} from '../../utils';
import debounce from 'lodash/debounce';

export default function MedicationSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drugs, setDrugs] = useState<DrugInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 화면 이탈 시 요청 취소를 위한 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 최근 검색어 로드
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const history = await getSearchHistory(SEARCH_HISTORY_KEYS.MEDICATION);
    setRecentSearches(history);
  };

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const searchDrugs = async (query: string, pageNum: number = 0, append: boolean = false) => {
    if (!query.trim()) {
      setDrugs([]);
      setTotalCount(0);
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 AbortController 생성
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (pageNum === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await drugService.searchDrugs({
        name: query,
        page: pageNum,
        size: 20,
      });

      // 요청이 취소된 경우 상태 업데이트하지 않음
      if (abortController.signal.aborted) {
        return;
      }

      if (append) {
        setDrugs((prev) => [...prev, ...result.drugs]);
      } else {
        setDrugs(result.drugs);
      }
      setPage(result.page);
      setHasNext(result.hasNext);
      setTotalCount(result.totalCount);
    } catch (error) {
      // 요청 취소로 인한 에러는 무시
      if (abortController.signal.aborted) {
        return;
      }
      console.error('약 검색 실패:', error);
    } finally {
      // 현재 controller가 여전히 활성 상태일 때만 로딩 상태 해제
      if (!abortController.signal.aborted) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchDrugs(query, 0, false);
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleLoadMore = () => {
    if (hasNext && !isLoadingMore) {
      searchDrugs(searchQuery, page + 1, true);
    }
  };

  const handleDrugSelect = async (drug: DrugInfo) => {
    // 검색어 저장
    if (searchQuery.trim()) {
      await addSearchHistory(SEARCH_HISTORY_KEYS.MEDICATION, searchQuery.trim());
    }
    // 약 등록 페이지로 이동 (약 정보 전달)
    router.push({
      pathname: '/medication/register',
      params: { itemSeq: drug.itemSeq },
    });
  };

  // 최근 검색어 선택
  const handleRecentSearchSelect = (keyword: string) => {
    setSearchQuery(keyword);
    searchDrugs(keyword, 0, false);
  };

  // 최근 검색어 삭제
  const handleRecentSearchRemove = async (keyword: string) => {
    await removeSearchHistory(SEARCH_HISTORY_KEYS.MEDICATION, keyword);
    loadRecentSearches();
  };

  // 최근 검색어 전체 삭제
  const handleRecentSearchClear = async () => {
    await clearSearchHistory(SEARCH_HISTORY_KEYS.MEDICATION);
    setRecentSearches([]);
  };

  const renderDrugItem = ({ item }: { item: DrugInfo }) => (
    <TouchableOpacity onPress={() => handleDrugSelect(item)} activeOpacity={0.7}>
      <Card style={styles.drugCard}>
        <View style={styles.drugContent}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.drugImage} />
          ) : (
            <View style={styles.drugImagePlaceholder}>
              <Ionicons name="medical" size={24} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.drugInfo}>
            <View style={styles.drugHeader}>
              <Typography variant="body" style={styles.drugName} numberOfLines={2}>
                {item.displayName || item.itemName}
              </Typography>
              {item.drugType && <DrugTypeBadge type={item.drugType} size="small" />}
            </View>
            {item.ingredientKr && (
              <Typography variant="caption" color={Colors.textTertiary}>
                {item.ingredientKr}
              </Typography>
            )}
            <Typography variant="caption" color={Colors.textSecondary}>
              {item.entpName}
            </Typography>
            {item.efficacy && (
              <Typography
                variant="caption"
                color={Colors.textTertiary}
                numberOfLines={2}
                style={styles.efficacy}
              >
                {item.efficacy}
              </Typography>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyWrapper}>
          {/* 최근 검색어 */}
          <RecentSearchList
            searches={recentSearches}
            onSelect={handleRecentSearchSelect}
            onRemove={handleRecentSearchRemove}
            onClearAll={handleRecentSearchClear}
          />
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={Colors.textSecondary} />
            <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
              약 이름을 검색해주세요
            </Typography>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medical-outline" size={48} color={Colors.textSecondary} />
        <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
          검색 결과가 없어요
        </Typography>
        <Typography variant="caption" color={Colors.textTertiary}>
          다른 이름으로 검색해보세요
        </Typography>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 검색 입력 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="약 이름을 검색하세요"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 검색 결과 수 */}
      {totalCount > 0 && (
        <View style={styles.resultCount}>
          <Typography variant="caption" color={Colors.textSecondary}>
            검색 결과 {totalCount.toLocaleString()}개
          </Typography>
        </View>
      )}

      {/* 검색 결과 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={drugs}
          renderItem={renderDrugItem}
          keyExtractor={(item) => item.itemSeq}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  drugCard: {
    padding: 12,
  },
  drugContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugImage: {
    width: 80,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  drugImagePlaceholder: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  drugInfo: {
    flex: 1,
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 2,
  },
  drugName: {
    flex: 1,
    fontWeight: '600',
  },
  efficacy: {
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 4,
  },
});
