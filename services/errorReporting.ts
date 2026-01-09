import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { API_BASE_URL } from '../constants';

interface ErrorLogPayload {
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  stackTrace?: string;
  screen?: string;
  appVersion?: string;
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  additionalInfo?: string;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private queue: ErrorLogPayload[] = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private getDeviceInfo() {
    return {
      appVersion: Constants.expoConfig?.version || 'unknown',
      platform: Platform.OS,
      osVersion: Platform.Version?.toString() || 'unknown',
      deviceModel: Device.modelName || 'unknown',
    };
  }

  async reportError(
    error: Error | string,
    screen?: string,
    additionalInfo?: Record<string, any>
  ): Promise<void> {
    const deviceInfo = this.getDeviceInfo();
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    const payload: ErrorLogPayload = {
      level: 'ERROR',
      message: errorMessage.substring(0, 500),
      stackTrace: stackTrace?.substring(0, 5000),
      screen,
      ...deviceInfo,
      additionalInfo: additionalInfo ? JSON.stringify(additionalInfo) : undefined,
    };

    this.queue.push(payload);
    this.processQueue();
  }

  async reportWarning(
    message: string,
    screen?: string,
    additionalInfo?: Record<string, any>
  ): Promise<void> {
    const deviceInfo = this.getDeviceInfo();

    const payload: ErrorLogPayload = {
      level: 'WARN',
      message: message.substring(0, 500),
      screen,
      ...deviceInfo,
      additionalInfo: additionalInfo ? JSON.stringify(additionalInfo) : undefined,
    };

    this.queue.push(payload);
    this.processQueue();
  }

  async reportInfo(
    message: string,
    screen?: string,
    additionalInfo?: Record<string, any>
  ): Promise<void> {
    const deviceInfo = this.getDeviceInfo();

    const payload: ErrorLogPayload = {
      level: 'INFO',
      message: message.substring(0, 500),
      screen,
      ...deviceInfo,
      additionalInfo: additionalInfo ? JSON.stringify(additionalInfo) : undefined,
    };

    this.queue.push(payload);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      if (payload) {
        try {
          await axios.post(`${API_BASE_URL}/error-log`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
          });
        } catch (e) {
          // 에러 리포팅 실패는 무시 (무한 루프 방지)
          console.warn('[ErrorReporting] Failed to send error log:', e);
        }
      }
    }

    this.isProcessing = false;
  }
}

export const errorReporting = ErrorReportingService.getInstance();
