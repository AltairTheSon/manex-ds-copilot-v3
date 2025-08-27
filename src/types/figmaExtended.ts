// Extended TypeScript interfaces for comprehensive Figma API responses

export interface FigmaComment {
  id: string;
  text: string;
  author: {
    id: string;
    handle: string;
    img_url: string;
  };
  created_at: string;
  resolved_at?: string;
  file_key: string;
  parent_id?: string;
  client_meta: {
    x: number;
    y: number;
    node_id?: string;
    node_offset?: {
      x: number;
      y: number;
    };
  };
}

export interface FigmaCommentsResponse {
  comments: FigmaComment[];
}

export interface FigmaVersion {
  id: string;
  created_at: string;
  label: string;
  description: string;
  user: {
    id: string;
    handle: string;
    img_url: string;
  };
  thumbnail_url: string;
}

export interface FigmaVersionsResponse {
  versions: FigmaVersion[];
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface FigmaTeamProjectsResponse {
  projects: FigmaProject[];
}

export interface FigmaProjectFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

export interface FigmaProjectFilesResponse {
  files: FigmaProjectFile[];
}

export interface FigmaComponent {
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  name: string;
  description: string;
  component_set_id?: string;
  document_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    handle: string;
    img_url: string;
  };
}

export interface FigmaFileComponentsResponse {
  meta: {
    components: FigmaComponent[];
  };
}

export interface FigmaComponentSet {
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  name: string;
  description: string;
  document_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    handle: string;
    img_url: string;
  };
}

export interface FigmaComponentSetResponse {
  meta: {
    component_set: FigmaComponentSet;
  };
}

export interface FigmaComponentResponse {
  meta: {
    component: FigmaComponent;
  };
}

export interface FigmaStyle {
  key: string;
  file_key: string;
  node_id: string;
  style_type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  thumbnail_url: string;
  name: string;
  description: string;
  document_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    handle: string;
    img_url: string;
  };
  sort_position: string;
}

export interface FigmaFileStylesResponse {
  meta: {
    styles: FigmaStyle[];
  };
}

export interface FigmaStyleResponse {
  meta: {
    style: FigmaStyle;
  };
}

export interface FigmaUser {
  id: string;
  email: string;
  handle: string;
  img_url: string;
}

export interface FigmaUserResponse {
  id: string;
  email: string;
  handle: string;
  img_url: string;
}

// Comprehensive data structure for organized Figma data
export interface ComprehensiveFigmaData {
  file: {
    info: any; // FigmaFile from existing types
    comments: FigmaComment[];
    versions: FigmaVersion[];
    components: FigmaComponent[];
    styles: FigmaStyle[];
  };
  user: FigmaUser | null;
  teams?: {
    [teamId: string]: {
      projects: FigmaProject[];
      files: {
        [projectId: string]: FigmaProjectFile[];
      };
    };
  };
  organized: {
    fileStructure: {
      pages: any[]; // Existing page structure
      frames: any[]; // Existing frame structure  
      layers: any[]; // Existing layer structure
    };
    components: {
      sets: FigmaComponentSet[];
      individuals: FigmaComponent[];
      byType: {
        [type: string]: FigmaComponent[];
      };
    };
    styles: {
      fill: FigmaStyle[];
      text: FigmaStyle[];
      effect: FigmaStyle[];
      grid: FigmaStyle[];
    };
    comments: {
      resolved: FigmaComment[];
      unresolved: FigmaComment[];
      byDate: FigmaComment[];
    };
    versions: {
      chronological: FigmaVersion[];
      recent: FigmaVersion[];
    };
  };
}

// Connection method types
export type ConnectionMethod = 'token' | 'mcp';

export interface ConnectionConfig {
  method: ConnectionMethod;
  token?: string;
  mcpConfig?: {
    serverUrl?: string;
    timeout?: number;
  };
}

// API progress tracking
export interface ApiProgress {
  file: boolean;
  comments: boolean;
  versions: boolean;
  components: boolean;
  styles: boolean;
  user: boolean;
  teams?: boolean;
}

export interface ApiLoadingState {
  [key: string]: boolean;
}

export interface ApiErrorState {
  [key: string]: string | null;
}