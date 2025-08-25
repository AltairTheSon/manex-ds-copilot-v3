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