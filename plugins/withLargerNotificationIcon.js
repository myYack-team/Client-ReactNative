const { withDangerousMod } = require('expo/config-plugins');
const { resolve, join } = require('path');
const fs = require('fs');

/**
 * expo-notifications 플러그인이 24dp 기준으로 아이콘을 생성하는 문제를 해결합니다.
 * 사전 리사이즈된 48dp 기준 아이콘으로 덮어씁니다.
 *
 * 이 플러그인은 반드시 expo-notifications 플러그인 뒤에 위치해야 합니다.
 */

const DENSITY_MAP = {
  'drawable-mdpi': 'notification_icon_mdpi.png',
  'drawable-hdpi': 'notification_icon_hdpi.png',
  'drawable-xhdpi': 'notification_icon_xhdpi.png',
  'drawable-xxhdpi': 'notification_icon_xxhdpi.png',
  'drawable-xxxhdpi': 'notification_icon_xxxhdpi.png',
};

function withLargerNotificationIcon(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iconsDir = resolve(projectRoot, 'assets', 'notification-icons');
      const resDir = join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res'
      );

      for (const [folder, fileName] of Object.entries(DENSITY_MAP)) {
        const srcPath = join(iconsDir, fileName);
        const destDir = join(resDir, folder);
        const destPath = join(destDir, 'notification_icon.png');

        if (!fs.existsSync(srcPath)) {
          console.warn(`[withLargerNotificationIcon] Source not found: ${srcPath}`);
          continue;
        }

        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        fs.copyFileSync(srcPath, destPath);
      }

      return config;
    },
  ]);
}

module.exports = withLargerNotificationIcon;
