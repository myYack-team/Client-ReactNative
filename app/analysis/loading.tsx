import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // for bottom padding
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useAnalysisStore } from '../../stores';

// SVG 애니메이션 HTML
const SVG_ANIMATION_HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    display: flex; justify-content: center; align-items: center;
    height: 100vh; background-color: transparent; margin: 0;
    overflow: hidden;
  }

  @keyframes moveRobotSequence {
    0%, 20%   { transform: translate(-90px, -200px); }
    25%, 45%  { transform: translate(-90px, 200px); }
    50%, 70%  { transform: translate(90px, 200px); }
    75%, 95%  { transform: translate(90px, -200px); }
    100%      { transform: translate(-90px, -200px); }
  }

  @keyframes showMagnifier {
    0%, 70%   { opacity: 1; }
    75%, 95%  { opacity: 0; }
    100%      { opacity: 1; }
  }
  @keyframes showPen {
    0%, 70%   { opacity: 0; }
    75%, 95%  { opacity: 1; }
    100%      { opacity: 0; }
  }

  @keyframes armActionSequence {
    0%, 20%, 25%, 45%, 50%, 70% { transform: rotate(-15deg); }
    10%, 35%, 60% { transform: rotate(15deg); }
    75%      { transform: rotate(5deg) translate(0px, 0px); }
    77%      { transform: rotate(5deg) translate(3px, 2px); }
    79%      { transform: rotate(5deg) translate(-2px, -1px); }
    81%      { transform: rotate(5deg) translate(2px, 2px); }
    83%      { transform: rotate(5deg) translate(0px, 0px); }
    85%      { transform: rotate(5deg) translate(3px, -2px); }
    87%      { transform: rotate(5deg) translate(-1px, 1px); }
    89%, 95% { transform: rotate(5deg) translate(0px, 0px); }
    100%     { transform: rotate(-15deg); }
  }

  @keyframes blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }

  @keyframes writeText {
    0%, 75%  { opacity: 0; stroke-dashoffset: 50; }
    80%      { opacity: 1; stroke-dashoffset: 40; }
    85%      { stroke-dashoffset: 20; }
    90%      { stroke-dashoffset: 0; }
    95%, 100% { opacity: 1; stroke-dashoffset: 0; }
  }

  @keyframes highlightPill {
    0%, 20%   { filter: drop-shadow(0 0 8px #26C6DA); transform: scale(1.1); }
    25%, 100% { filter: none; transform: scale(1); }
  }
  @keyframes highlightPrescription {
    0%, 20%  { filter: none; transform: scale(1); }
    25%, 45% { filter: drop-shadow(0 0 8px #90CAF9); transform: scale(1.1); }
    50%, 100% { filter: none; transform: scale(1); }
  }
  @keyframes highlightSearch {
    0%, 45%  { filter: none; transform: scale(1); }
    50%, 70% { filter: drop-shadow(0 0 8px #7E57C2); transform: scale(1.1); }
    75%, 100% { filter: none; transform: scale(1); }
  }
  @keyframes highlightPanel {
    0%, 70%  { filter: none; transform: scale(1); }
    75%, 95% { filter: drop-shadow(0 0 8px #FFB74D); transform: scale(1.1); }
    100%     { filter: none; transform: scale(1); }
  }

  .robot-wrapper { animation: moveRobotSequence 8s ease-in-out infinite; }
  .eye { transform-origin: center 80px; animation: blink 3.5s infinite; }
  .arm-action-group { transform-origin: 118px 123px; animation: armActionSequence 8s linear infinite; }
  .tool-magnifier-group { animation: showMagnifier 8s linear infinite; }
  .tool-pen-group { animation: showPen 8s linear infinite; }

  .pill-group { transform-origin: center; animation: highlightPill 8s ease-in-out infinite; }
  .prescription-group { transform-origin: center; animation: highlightPrescription 8s ease-in-out infinite; }
  .search-group { transform-origin: center; animation: highlightSearch 8s ease-in-out infinite; }
  .panel-group { transform-origin: center; animation: highlightPanel 8s ease-in-out infinite; }

  .panel-text { stroke-dasharray: 50; animation: writeText 8s ease-in-out infinite; }
</style>
</head>
<body>

<svg width="320" height="640" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="640" fill="transparent" rx="20"/>
  <g stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6,6" fill="none" opacity="0.3">
    <path d="M 70 120 L 70 520" />
    <path d="M 70 520 L 250 520" />
    <path d="M 250 520 L 250 120" />
  </g>

  <g transform="translate(70, 120)">
    <g class="pill-group" transform="translate(-16, -22)">
      <rect x="0" y="12" width="32" height="45" rx="6" fill="#E0F7FA" stroke="#26C6DA" stroke-width="2"/>
      <rect x="5" y="5" width="22" height="9" rx="2" fill="#26C6DA"/>
      <rect x="9" y="0" width="14" height="7" rx="2" fill="#00ACC1"/>
      <text x="16" y="42" font-size="16" text-anchor="middle">💊</text>
      <text x="16" y="75" font-size="10" text-anchor="middle" fill="#00ACC1" font-weight="bold">약물 확인</text>
    </g>
  </g>

  <g transform="translate(70, 520)">
    <g class="prescription-group" transform="translate(-27, -35)">
      <rect x="0" y="0" width="55" height="70" fill="white" stroke="#90CAF9" stroke-width="2" rx="4"/>
      <rect x="5" y="5" width="28" height="7" fill="#E3F2FD" rx="1"/>
      <line x1="5" y1="20" x2="50" y2="20" stroke="#E0E0E0" stroke-width="2"/>
      <line x1="5" y1="30" x2="50" y2="30" stroke="#E0E0E0" stroke-width="2"/>
      <line x1="5" y1="40" x2="38" y2="40" stroke="#E0E0E0" stroke-width="2"/>
      <text x="43" y="64" font-size="12" fill="#64B5F6" font-weight="bold">Rx</text>
      <text x="27" y="90" font-size="10" text-anchor="middle" fill="#64B5F6" font-weight="bold">처방전 분석</text>
    </g>
  </g>

  <g transform="translate(250, 520)">
    <g class="search-group" transform="translate(-30, -25)">
      <rect x="0" y="0" width="60" height="50" fill="white" stroke="#7E57C2" stroke-width="2" rx="4"/>
      <rect x="2" y="2" width="56" height="10" fill="#EDE7F6" rx="2"/>
      <circle cx="8" cy="7" r="2" fill="#B39DDB"/> <rect x="14" y="5" width="30" height="4" fill="white" rx="1"/> <line x1="10" y1="20" x2="50" y2="20" stroke="#B39DDB" stroke-width="2" stroke-linecap="round"/>
      <line x1="10" y1="28" x2="40" y2="28" stroke="#D1C4E9" stroke-width="2" stroke-linecap="round"/>
      <line x1="10" y1="36" x2="45" y2="36" stroke="#D1C4E9" stroke-width="2" stroke-linecap="round"/>
      <text x="30" y="70" font-size="10" text-anchor="middle" fill="#7E57C2" font-weight="bold">자료 조사</text>
    </g>
  </g>

  <g transform="translate(250, 120)">
    <g class="panel-group" transform="translate(-35, -40)">
      <rect x="0" y="0" width="70" height="80" fill="white" stroke="#FFB74D" stroke-width="2" rx="4"/>
      <rect x="0" y="0" width="70" height="16" fill="#FFE0B2" rx="4"/>
      <text x="35" y="12" font-size="9" text-anchor="middle" fill="#F57C00" font-weight="bold">REPORT</text>
      <line class="panel-text" x1="10" y1="30" x2="60" y2="30" stroke="#FFB74D" stroke-width="2" stroke-linecap="round"/>
      <line class="panel-text" x1="10" y1="45" x2="50" y2="45" stroke="#FFB74D" stroke-width="2" stroke-linecap="round" style="animation-delay: 0.1s"/>
      <line class="panel-text" x1="10" y1="60" x2="40" y2="60" stroke="#FFB74D" stroke-width="2" stroke-linecap="round" style="animation-delay: 0.2s"/>
      <text x="35" y="100" font-size="10" text-anchor="middle" fill="#F57C00" font-weight="bold">결과 정리</text>
    </g>
  </g>

  <g transform="translate(160, 320)"> <g class="robot-wrapper"> <g transform="translate(-100, -100)">
        <g class="robot-body">
          <line x1="100" y1="45" x2="100" y2="58" stroke="#546E7A" stroke-width="3"/>
          <circle cx="100" cy="42" r="5" fill="#FF5252">
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
          <rect x="68" y="58" width="64" height="52" rx="18" fill="#ffffff" stroke="#546E7A" stroke-width="3"/>
          <g class="eye">
            <ellipse cx="88" cy="78" rx="5" ry="6" fill="#37474F"/>
            <ellipse cx="112" cy="78" rx="5" ry="6" fill="#37474F"/>
            <circle cx="86" cy="76" r="2" fill="white" opacity="0.8"/>
            <circle cx="110" cy="76" r="2" fill="white" opacity="0.8"/>
          </g>
          <ellipse cx="82" cy="92" rx="5" ry="3" fill="#FFCDD2" opacity="0.7"/>
          <ellipse cx="118" cy="92" rx="5" ry="3" fill="#FFCDD2" opacity="0.7"/>
          <path d="M 94 95 Q 100 100 106 95" fill="none" stroke="#78909C" stroke-width="2" stroke-linecap="round"/>
        </g>

        <g class="arm-action-group">
          <g class="tool-magnifier-group">
            <g transform="translate(85, 125) rotate(-15)">
              <line x1="18" y1="0" x2="50" y2="0" stroke="#8D6E63" stroke-width="5" stroke-linecap="round"/>
              <circle cx="0" cy="0" r="18" fill="none" stroke="#546E7A" stroke-width="4"/>
              <circle cx="0" cy="0" r="15" fill="#B3E5FC" opacity="0.6"/>
              <path d="M -10 -8 Q -4 -14 4 -10" fill="none" stroke="white" stroke-width="2.5" opacity="0.9" stroke-linecap="round"/>
            </g>
          </g>
          <g class="tool-pen-group" opacity="0">
            <g transform="translate(115, 120) rotate(35)">
              <rect x="0" y="-4" width="35" height="8" rx="2" fill="#FFB74D"/>
              <polygon points="35,-3 35,3 45,0" fill="#546E7A"/>
              <rect x="2" y="-3" width="8" height="6" fill="#FFA726" rx="1"/>
            </g>
          </g>
          <circle cx="118" cy="123" r="9" fill="#78909C" stroke="#546E7A" stroke-width="2"/>
        </g>
      </g>
    </g>
  </g>
</svg>

</body>
</html>
`;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SVG_WIDTH = SCREEN_WIDTH; // 좌우 꽉 차게
const SVG_HEIGHT = SVG_WIDTH * 2;

export default function AnalysisLoadingScreen() {
  const { startAnalysisInBackground, pendingAnalysis, completedResult } = useAnalysisStore();
  const isRequestedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const insets = useSafeAreaInsets();

  // 분석 요청 시작
  useEffect(() => {
    // 중복 호출 방지
    if (isRequestedRef.current) return;
    isRequestedRef.current = true;

    console.log('[AnalysisLoading] Starting background analysis...');
    startAnalysisInBackground();
  }, []);

  // 분석 완료 시 자동으로 탭으로 돌아가기 (자동 이동 없이 알림만)
  useEffect(() => {
    if (completedResult) {
      console.log('[AnalysisLoading] Analysis completed, going back to tab...');
      router.back();
    }
  }, [completedResult]);

  // 진행률 업데이트
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.15, 99));
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* SVG 애니메이션 - 좌우 꽉 차게 */}
      <View style={[styles.svgContainer, { width: SVG_WIDTH, height: SVG_HEIGHT }]}>
        <WebView
          source={{ html: SVG_ANIMATION_HTML }}
          style={styles.webview}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>

      {/* 하단 영역 */}
      <View style={[styles.bottomContainer, { paddingBottom: 24 + insets.bottom }]}>
        {/* 진행바 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Typography variant="caption" color={Colors.textSecondary} style={styles.progressText}>
            {Math.round(progress)}%
          </Typography>
        </View>

        {/* 안내 문구 */}
        <Typography variant="caption" color={Colors.textSecondary} style={styles.hint}>
          AI가 약물 정보를 분석하고 있습니다.{'\n'}
          화면을 이동해도 분석은 계속됩니다.
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  svgContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
  },
  hint: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
