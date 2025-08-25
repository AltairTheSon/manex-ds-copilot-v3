import axios, { AxiosResponse } from 'axios';
import { FigmaFile, FigmaImageResponse } from '../types/figma';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

class FigmaApiService {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'X-Figma-Token': this.token,
    };
  }

  private handleApiError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.err || error.response.data?.message || 'Unknown error';
      
      if (status === 401) {
        throw new Error('Invalid access token. Please check your Figma token.');
      } else if (status === 403) {
        throw new Error('Access denied. Please check your token permissions.');
      } else if (status === 404) {
        throw new Error('File not found. Please check the file ID.');
      } else {
        throw new Error(`API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }

  async getFile(fileId: string): Promise<FigmaFile> {
    try {
      if (!this.token) {
        throw new Error('Access token is required');
      }

      if (!fileId) {
        throw new Error('File ID is required');
      }

      const response: AxiosResponse<FigmaFile> = await axios.get(
        `${FIGMA_API_BASE}/files/${fileId}`,
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getPageThumbnails(fileId: string, pageIds: string[]): Promise<{ [key: string]: string }> {
    try {
      if (!this.token) {
        throw new Error('Access token is required');
      }

      if (!fileId || pageIds.length === 0) {
        throw new Error('File ID and page IDs are required');
      }

      const idsParam = pageIds.join(',');
      const response: AxiosResponse<FigmaImageResponse> = await axios.get(
        `${FIGMA_API_BASE}/images/${fileId}`,
        {
          headers: this.getHeaders(),
          params: {
            ids: idsParam,
            format: 'png',
            scale: 2,
          },
          timeout: 15000,
        }
      );

      if (response.data.err) {
        throw new Error(`Figma API Error: ${response.data.err}`);
      }

      return response.data.images;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  validateToken(token: string): boolean {
    // Basic token validation - Figma personal access tokens are typically 76 characters
    const tokenRegex = /^figd_[a-zA-Z0-9_-]{71}$/;
    return tokenRegex.test(token) || token.length >= 20; // Allow other token formats
  }

  validateFileId(fileId: string): boolean {
    // Figma file IDs are typically alphanumeric with some special characters
    const fileIdRegex = /^[a-zA-Z0-9]+$/;
    return fileIdRegex.test(fileId) && fileId.length > 10;
  }
}

export const figmaApiService = new FigmaApiService();