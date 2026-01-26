import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export class ApiConfig {
  private configList: string[] = [];

  constructor() {
    const configEnv = process.env.NBA_API_CONFIG || process.env.NBA_API_PROXY || '';
    if (configEnv) {
      this.configList = configEnv.split(',').map(p => p.trim()).filter(p => p);
    }
  }

  getConfig(): string | null {
    if (!this.configList.length) {
      return null;
    }

    if (this.configList.length === 1) {
      return this.configList[0];
    }

    return this.configList[Math.floor(Math.random() * this.configList.length)];
  }

  getConfigDict(): { http?: string; https?: string } | null {
    const config = this.getConfig();
    if (!config) {
      return null;
    }

    return {
      http: config,
      https: config,
    };
  }
}

// Global configuration instance
export const apiConfig = new ApiConfig();

export function getApiConfig(): ApiConfig {
  return apiConfig;
}

export function getApiKwargs(): { proxy?: string } {
  const config = apiConfig.getConfig();
  if (config) {
    return { proxy: config };
  }
  return {};
}

export function getApiProxyConfig(): string | null {
  return apiConfig.getConfig();
}

export const config = {
  getApiProxyConfig,
};