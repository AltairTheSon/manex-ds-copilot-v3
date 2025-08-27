// Utility functions for debugging API issues
export class ApiDebugger {
  private static logs: Array<{
    timestamp: Date;
    type: 'request' | 'response' | 'error';
    endpoint: string;
    data: any;
  }> = [];

  static logRequest(endpoint: string, params: any) {
    this.logs.push({
      timestamp: new Date(),
      type: 'request',
      endpoint,
      data: params
    });
    
    console.log(`🚀 API Request to ${endpoint}:`, params);
  }

  static logResponse(endpoint: string, success: boolean, data: any) {
    this.logs.push({
      timestamp: new Date(),
      type: 'response',
      endpoint,
      data: { success, ...data }
    });
    
    if (success) {
      console.log(`✅ API Success for ${endpoint}:`, data);
    } else {
      console.warn(`⚠️ API Issues for ${endpoint}:`, data);
    }
  }

  static logError(endpoint: string, error: any) {
    this.logs.push({
      timestamp: new Date(),
      type: 'error',
      endpoint,
      data: error
    });
    
    console.error(`❌ API Error for ${endpoint}:`, error);
  }

  static getDebugSummary() {
    const summary = {
      totalRequests: this.logs.filter(log => log.type === 'request').length,
      totalResponses: this.logs.filter(log => log.type === 'response').length,
      totalErrors: this.logs.filter(log => log.type === 'error').length,
      recentLogs: this.logs.slice(-10)
    };
    
    console.table(summary.recentLogs);
    return summary;
  }

  static clearLogs() {
    this.logs = [];
    console.log('🧹 API debug logs cleared');
  }
}

// Helper function to validate node IDs before API calls
export function validateNodeIds(nodeIds: string[]): {
  valid: string[];
  invalid: Array<{ id: string; reason: string }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ id: string; reason: string }> = [];

  nodeIds.forEach(id => {
    if (!id || typeof id !== 'string') {
      invalid.push({ id: String(id), reason: 'Not a string' });
    } else if (id.length < 3) {
      invalid.push({ id, reason: 'Too short' });
    } else if (!id.includes(':')) {
      invalid.push({ id, reason: 'Missing colon separator' });
    } else if (!/^[a-zA-Z0-9:-]+$/.test(id)) {
      invalid.push({ id, reason: 'Invalid characters' });
    } else {
      valid.push(id);
    }
  });

  return { valid, invalid };
}

// Helper to format error messages consistently
export function formatApiError(error: any): string {
  if (error?.response) {
    const status = error.response.status;
    const message = error.response.data?.err || error.response.data?.message || 'Unknown error';
    
    const statusMessages: Record<number, string> = {
      400: 'Invalid request - check parameters',
      401: 'Authentication failed - check token',
      403: 'Access denied - insufficient permissions',
      404: 'Resource not found - check file/node ID',
      429: 'Rate limit exceeded - try again later',
      500: 'Server error - try again later',
      502: 'Gateway error - service unavailable',
      503: 'Service unavailable - try again later',
      504: 'Request timeout - try again later'
    };

    return statusMessages[status] || `API error (${status}): ${message}`;
  } else if (error?.request) {
    return 'Network error - check internet connection';
  } else {
    return error?.message || 'Unknown error occurred';
  }
}