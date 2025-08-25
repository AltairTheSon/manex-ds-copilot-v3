// TypeScript interfaces for Figma API responses

export interface FigmaFile {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: {
    id: string;
    name: string;
    type: string;
    children: FigmaPage[];
  };
  components: any;
  componentSets: any;
  schemaVersion: number;
  styles: any;
}

export interface FigmaPage {
  id: string;
  name: string;
  type: string;
  children?: any[];
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export interface FigmaImageResponse {
  err: string | null;
  images: {
    [key: string]: string;
  };
}

export interface FigmaApiError {
  status: number;
  err: string;
}

export interface PageWithThumbnail extends FigmaPage {
  thumbnailUrl?: string;
  loading?: boolean;
  error?: string;
}

// Layer/Node related interfaces
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  characters?: string;
  style?: any;
}

export interface FigmaNodesResponse {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  nodes: {
    [key: string]: {
      document: FigmaNode;
      components: any;
      schemaVersion: number;
      styles: any;
    };
  };
}

export interface LayerWithThumbnail extends FigmaNode {
  thumbnailUrl?: string;
  loading?: boolean;
  error?: string;
}

export interface FrameWithThumbnail extends FigmaNode {
  thumbnailUrl?: string;
  loading?: boolean;
  error?: string;
}

export interface PageLayersData {
  pageId: string;
  pageName: string;
  layers: LayerWithThumbnail[];
}

export interface PageFramesData {
  pageId: string;
  pageName: string;
  frames: FrameWithThumbnail[];
}