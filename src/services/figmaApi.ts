import axios, { AxiosResponse } from 'axios';
import { FigmaFile, FigmaImageResponse, FigmaNodesResponse } from '../types/figma';

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

  async getPageNodes(fileId: string, pageIds: string[]): Promise<FigmaNodesResponse> {
    try {
      if (!this.token) {
        throw new Error('Access token is required');
      }

      if (!fileId || pageIds.length === 0) {
        throw new Error('File ID and page IDs are required');
      }

      const idsParam = pageIds.join(',');
      const response: AxiosResponse<FigmaNodesResponse> = await axios.get(
        `${FIGMA_API_BASE}/files/${fileId}/nodes`,
        {
          headers: this.getHeaders(),
          params: {
            ids: idsParam,
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getLayerThumbnails(fileId: string, layerIds: string[]): Promise<{ [key: string]: string }> {
    try {
      if (!this.token) {
        throw new Error('Access token is required');
      }

      if (!fileId || layerIds.length === 0) {
        throw new Error('File ID and layer IDs are required');
      }

      // Validate and filter node IDs
      const validLayerIds = layerIds.filter(id => this.validateNodeId(id));
      
      if (validLayerIds.length === 0) {
        console.warn('No valid layer IDs found for thumbnail generation');
        return {};
      }

      if (validLayerIds.length !== layerIds.length) {
        console.warn(`Filtered out ${layerIds.length - validLayerIds.length} invalid layer IDs`);
      }

      const idsParam = validLayerIds.join(',');
      console.log(`Fetching thumbnails for ${validLayerIds.length} layer(s): ${idsParam}`);
      
      const response: AxiosResponse<FigmaImageResponse> = await axios.get(
        `${FIGMA_API_BASE}/images/${fileId}`,
        {
          headers: this.getHeaders(),
          params: {
            ids: idsParam,
            format: 'png',
            scale: 1,
          },
          timeout: 20000,
        }
      );

      if (response.data.err) {
        console.error(`Figma API Error for layers: ${response.data.err}`);
        throw new Error(`Figma API Error: ${response.data.err}`);
      }

      // Log which thumbnails were successfully generated
      const images = response.data.images;
      const successCount = Object.keys(images).length;
      const failedIds = validLayerIds.filter(id => !images[id]);
      
      console.log(`Successfully generated ${successCount} layer thumbnails`);
      if (failedIds.length > 0) {
        console.warn(`Failed to generate thumbnails for layers: ${failedIds.join(', ')}`);
      }

      return images;
    } catch (error) {
      console.error('Error in getLayerThumbnails:', error);
      this.handleApiError(error);
    }
  }

  async getFrameThumbnails(fileId: string, frameIds: string[]): Promise<{ [key: string]: string }> {
    try {
      if (!this.token) {
        throw new Error('Access token is required');
      }

      if (!fileId || frameIds.length === 0) {
        throw new Error('File ID and frame IDs are required');
      }

      // Validate and filter node IDs
      const validFrameIds = frameIds.filter(id => this.validateNodeId(id));
      
      if (validFrameIds.length === 0) {
        console.warn('No valid frame IDs found for thumbnail generation');
        return {};
      }

      if (validFrameIds.length !== frameIds.length) {
        console.warn(`Filtered out ${frameIds.length - validFrameIds.length} invalid frame IDs`);
      }

      const idsParam = validFrameIds.join(',');
      console.log(`Fetching thumbnails for ${validFrameIds.length} frame(s): ${idsParam}`);

      const response: AxiosResponse<FigmaImageResponse> = await axios.get(
        `${FIGMA_API_BASE}/images/${fileId}`,
        {
          headers: this.getHeaders(),
          params: {
            ids: idsParam,
            format: 'png',
            scale: 1,
          },
          timeout: 20000,
        }
      );

      if (response.data.err) {
        console.error(`Figma API Error for frames: ${response.data.err}`);
        throw new Error(`Figma API Error: ${response.data.err}`);
      }

      // Log which thumbnails were successfully generated
      const images = response.data.images;
      const successCount = Object.keys(images).length;
      const failedIds = validFrameIds.filter(id => !images[id]);
      
      console.log(`Successfully generated ${successCount} frame thumbnails`);
      if (failedIds.length > 0) {
        console.warn(`Failed to generate thumbnails for frames: ${failedIds.join(', ')}`);
      }

      return images;
    } catch (error) {
      console.error('Error in getFrameThumbnails:', error);
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

  validateNodeId(nodeId: string): boolean {
    // Figma node IDs are typically in format "123:456" or similar
    // They should contain at least one colon and be alphanumeric with colons/hyphens
    if (!nodeId || typeof nodeId !== 'string') {
      return false;
    }
    
    // Basic format validation - should contain colon and be reasonable length
    const nodeIdRegex = /^[a-zA-Z0-9:-]+$/;
    return nodeIdRegex.test(nodeId) && nodeId.includes(':') && nodeId.length > 2;
  }
}

export const figmaApiService = new FigmaApiService();