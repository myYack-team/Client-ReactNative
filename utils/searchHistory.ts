/**
 * 최근 검색어 관리 유틸리티
 * AsyncStorage를 사용하여 검색어를 로컬에 저장합니다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_HISTORY_COUNT = 10;

// 검색어 저장소 키
export const SEARCH_HISTORY_KEYS = {
  MEDICATION: '@search_history_medication',
  SUPPLEMENT: '@search_history_supplement',
} as const;

export type SearchHistoryKey = (typeof SEARCH_HISTORY_KEYS)[keyof typeof SEARCH_HISTORY_KEYS];

/**
 * 최근 검색어 목록을 가져옵니다.
 */
export async function getSearchHistory(key: SearchHistoryKey): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
}

/**
 * 검색어를 최근 검색어 목록에 추가합니다.
 * 이미 존재하면 맨 앞으로 이동, 최대 개수 초과 시 오래된 것 삭제
 */
export async function addSearchHistory(key: SearchHistoryKey, keyword: string): Promise<void> {
  if (!keyword.trim()) return;

  try {
    const history = await getSearchHistory(key);

    // 기존에 있으면 제거
    const filtered = history.filter((item) => item !== keyword.trim());

    // 맨 앞에 추가
    const newHistory = [keyword.trim(), ...filtered];

    // 최대 개수 제한
    const limited = newHistory.slice(0, MAX_HISTORY_COUNT);

    await AsyncStorage.setItem(key, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to add search history:', error);
  }
}

/**
 * 특정 검색어를 삭제합니다.
 */
export async function removeSearchHistory(key: SearchHistoryKey, keyword: string): Promise<void> {
  try {
    const history = await getSearchHistory(key);
    const filtered = history.filter((item) => item !== keyword);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove search history:', error);
  }
}

/**
 * 모든 검색어를 삭제합니다.
 */
export async function clearSearchHistory(key: SearchHistoryKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}
