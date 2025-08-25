import axios, { AxiosResponse } from 'axios';
import { FigmaFile, FigmaImageResponse, FigmaNodesResponse, ThumbnailResult } from '../types/figma';

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

  async getLayerThumbnails(fileId: string, layerIds: string[]): Promise<ThumbnailResult> {
    if (!this.token) {
      throw new Error('Access token is required');
    }

    if (!fileId || layerIds.length === 0) {
      throw new Error('File ID and layer IDs are required');
    }

    // Validate and filter node IDs
    const validationResults = layerIds.map(id => ({
      id,
      valid: this.validateNodeId(id),
      error: this.validateNodeId(id) ? null : `Invalid node ID format: ${id}`
    }));

    const validLayerIds = validationResults.filter(r => r.valid).map(r => r.id);
    const invalidIds = validationResults.filter(r => !r.valid);
    
    const result: ThumbnailResult = {
      images: {},
      errors: {},
      retried: []
    };

    // Add validation errors
    invalidIds.forEach(invalid => {
      result.errors[invalid.id] = invalid.error || 'Invalid node ID';
    });

    if (validLayerIds.length === 0) {
      console.warn('No valid layer IDs found for thumbnail generation');
      return result;
    }

    if (validLayerIds.length !== layerIds.length) {
      console.warn(`Filtered out ${layerIds.length - validLayerIds.length} invalid layer IDs`);
    }

    // Try to get thumbnails for valid IDs
    await this.fetchThumbnailsBatch(fileId, validLayerIds, result, 'layers');
    
    return result;
  }

  async getFrameThumbnails(fileId: string, frameIds: string[]): Promise<ThumbnailResult> {
    if (!this.token) {
      throw new Error('Access token is required');
    }

    if (!fileId || frameIds.length === 0) {
      throw new Error('File ID and frame IDs are required');
    }

    // Validate and filter node IDs
    const validationResults = frameIds.map(id => ({
      id,
      valid: this.validateNodeId(id),
      error: this.validateNodeId(id) ? null : `Invalid node ID format: ${id}`
    }));

    const validFrameIds = validationResults.filter(r => r.valid).map(r => r.id);
    const invalidIds = validationResults.filter(r => !r.valid);
    
    const result: ThumbnailResult = {
      images: {},
      errors: {},
      retried: []
    };

    // Add validation errors
    invalidIds.forEach(invalid => {
      result.errors[invalid.id] = invalid.error || 'Invalid node ID';
    });

    if (validFrameIds.length === 0) {
      console.warn('No valid frame IDs found for thumbnail generation');
      return result;
    }

    if (validFrameIds.length !== frameIds.length) {
      console.warn(`Filtered out ${frameIds.length - validFrameIds.length} invalid frame IDs`);
    }

    // Try to get thumbnails for valid IDs
    await this.fetchThumbnailsBatch(fileId, validFrameIds, result, 'frames');
    
    return result;
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

  private async fetchThumbnailsBatch(
    fileId: string, 
    nodeIds: string[], 
    result: ThumbnailResult, 
    type: 'frames' | 'layers',
    retryCount: number = 0
  ): Promise<void> {
    const maxRetries = 2;
    const batchSize = 20; // Limit batch size to avoid API limits
    
    console.log(`Fetching thumbnails for ${nodeIds.length} ${type} (attempt ${retryCount + 1})`);
    
    try {
      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < nodeIds.length; i += batchSize) {
        const batch = nodeIds.slice(i, i + batchSize);
        const idsParam = batch.join(',');
        
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} ${type}`);
        
        try {
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
            console.error(`Figma API Error for ${type} batch: ${response.data.err}`);
            // Mark all items in this batch as failed
            batch.forEach(id => {
              result.errors[id] = `API Error: ${response.data.err}`;
            });
            continue;
          }

          // Process successful thumbnails
          const images = response.data.images || {};
          const successfulIds: string[] = [];
          const failedIds: string[] = [];

          batch.forEach(id => {
            if (images[id]) {
              result.images[id] = images[id];
              successfulIds.push(id);
            } else {
              failedIds.push(id);
            }
          });

          console.log(`Batch results: ${successfulIds.length} successful, ${failedIds.length} failed`);

          // Handle failed IDs in this batch
          if (failedIds.length > 0 && retryCount < maxRetries) {
            console.log(`Retrying ${failedIds.length} failed ${type} from batch`);
            result.retried.push(...failedIds);
            // Retry failed IDs with a delay
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            await this.fetchThumbnailsBatch(fileId, failedIds, result, type, retryCount + 1);
          } else if (failedIds.length > 0) {
            // Mark as permanently failed after max retries
            failedIds.forEach(id => {
              result.errors[id] = `Failed to generate thumbnail after ${maxRetries + 1} attempts`;
            });
          }

        } catch (batchError) {
          console.error(`Error processing batch of ${type}:`, batchError);
          
          // If this is a network/timeout error and we haven't exceeded retries, try individual requests
          if (retryCount < maxRetries && this.isRetryableError(batchError)) {
            console.log(`Retrying batch individually due to error: ${batchError}`);
            await this.retryIndividualNodes(fileId, batch, result, type, retryCount + 1);
          } else {
            // Mark entire batch as failed
            batch.forEach(id => {
              result.errors[id] = this.getErrorMessage(batchError);
            });
          }
        }
      }
    } catch (error) {
      console.error(`Fatal error in fetchThumbnailsBatch for ${type}:`, error);
      // Mark all remaining nodes as failed
      nodeIds.forEach(id => {
        if (!result.images[id] && !result.errors[id]) {
          result.errors[id] = this.getErrorMessage(error);
        }
      });
    }
  }

  private async retryIndividualNodes(
    fileId: string,
    nodeIds: string[],
    result: ThumbnailResult,
    type: 'frames' | 'layers',
    retryCount: number
  ): Promise<void> {
    console.log(`Trying individual requests for ${nodeIds.length} ${type}`);
    
    for (const nodeId of nodeIds) {
      try {
        const response: AxiosResponse<FigmaImageResponse> = await axios.get(
          `${FIGMA_API_BASE}/images/${fileId}`,
          {
            headers: this.getHeaders(),
            params: {
              ids: nodeId,
              format: 'png',
              scale: 1,
            },
            timeout: 10000, // Shorter timeout for individual requests
          }
        );

        if (response.data.err) {
          result.errors[nodeId] = `API Error: ${response.data.err}`;
        } else if (response.data.images && response.data.images[nodeId]) {
          result.images[nodeId] = response.data.images[nodeId];
          result.retried.push(nodeId);
        } else {
          result.errors[nodeId] = 'No thumbnail generated by API';
        }
        
        // Small delay between individual requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed individual request for ${type} ${nodeId}:`, error);
        result.errors[nodeId] = this.getErrorMessage(error);
      }
    }
  }

  private isRetryableError(error: any): boolean {
    // Check if error is retryable (network, timeout, 5xx server errors)
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors or rate limiting
    }
    return false;
  }

  private getErrorMessage(error: any): string {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.err || error.response.data?.message || 'Unknown error';
      return `HTTP ${status}: ${message}`;
    } else if (error.request) {
      return 'Network error: Unable to reach Figma API';
    } else {
      return `Request error: ${error.message || 'Unknown error'}`;
    }
  }
}

export const figmaApiService = new FigmaApiService();