// Mock data for demonstration purposes when real API calls fail

export const mockFigmaFile = {
  name: "Design System Components",
  role: "owner",
  lastModified: "2024-01-15T10:30:00Z",
  editorType: "figma",
  thumbnailUrl: "https://via.placeholder.com/200x150?text=File+Thumbnail",
  version: "1234567890",
  document: {
    id: "0:1",
    name: "Document",
    type: "DOCUMENT",
    children: [
      {
        id: "1:2",
        name: "Cover Page",
        type: "CANVAS",
        children: []
      },
      {
        id: "1:3", 
        name: "Components",
        type: "CANVAS",
        children: []
      },
      {
        id: "1:4",
        name: "Styles Guide", 
        type: "CANVAS",
        children: []
      }
    ]
  },
  components: {},
  componentSets: {},
  schemaVersion: 0,
  styles: {}
};

export const mockUserData = {
  id: "12345",
  email: "demo@example.com",
  handle: "Demo User",
  img_url: "https://via.placeholder.com/80x80?text=User"
};

export const mockComments = [
  {
    id: "comment1",
    text: "This component looks great! Can we make the padding a bit larger?",
    author: {
      id: "user1",
      handle: "designer_jane",
      img_url: "https://via.placeholder.com/40x40?text=DJ"
    },
    created_at: "2024-01-14T15:30:00Z",
    file_key: "demo123",
    client_meta: {
      x: 100,
      y: 200,
      node_id: "1:5"
    }
  },
  {
    id: "comment2", 
    text: "Fixed the spacing issue. Please review when you have a chance.",
    author: {
      id: "user2",
      handle: "dev_alex",
      img_url: "https://via.placeholder.com/40x40?text=DA"
    },
    created_at: "2024-01-15T09:15:00Z",
    resolved_at: "2024-01-15T10:00:00Z",
    file_key: "demo123",
    client_meta: {
      x: 150,
      y: 300,
      node_id: "1:6"
    }
  }
];

export const mockVersions = [
  {
    id: "version1",
    created_at: "2024-01-15T10:30:00Z",
    label: "v2.1 - Component Updates",
    description: "Updated button components with new hover states and improved accessibility",
    user: {
      id: "user1",
      handle: "designer_jane", 
      img_url: "https://via.placeholder.com/40x40?text=DJ"
    },
    thumbnail_url: "https://via.placeholder.com/80x60?text=v2.1"
  },
  {
    id: "version2",
    created_at: "2024-01-12T14:20:00Z", 
    label: "v2.0 - Design System Overhaul",
    description: "Major update to the design system with new color palette and typography",
    user: {
      id: "user2",
      handle: "design_lead",
      img_url: "https://via.placeholder.com/40x40?text=DL"
    },
    thumbnail_url: "https://via.placeholder.com/80x60?text=v2.0"
  }
];

export const mockComponents = [
  {
    key: "comp1",
    file_key: "demo123",
    node_id: "1:10",
    thumbnail_url: "https://via.placeholder.com/120x80?text=Button",
    name: "Primary Button",
    description: "Main call-to-action button component with hover and focus states",
    document_id: "1:2",
    created_at: "2024-01-10T12:00:00Z",
    updated_at: "2024-01-14T16:30:00Z",
    user: {
      id: "user1",
      handle: "designer_jane",
      img_url: "https://via.placeholder.com/40x40?text=DJ"
    }
  },
  {
    key: "comp2",
    file_key: "demo123", 
    node_id: "1:11",
    thumbnail_url: "https://via.placeholder.com/120x80?text=Card",
    name: "Content Card",
    description: "Flexible card component for displaying content with image and text",
    document_id: "1:3",
    created_at: "2024-01-08T09:30:00Z",
    updated_at: "2024-01-13T11:15:00Z",
    user: {
      id: "user2",
      handle: "dev_alex",
      img_url: "https://via.placeholder.com/40x40?text=DA"
    }
  }
];

export const mockStyles = [
  {
    key: "style1",
    file_key: "demo123",
    node_id: "1:20",
    style_type: "FILL" as const,
    thumbnail_url: "https://via.placeholder.com/40x40/007BFF/FFFFFF?text=Fill",
    name: "Primary Blue",
    description: "Main brand color used for primary actions and highlights",
    document_id: "1:4",
    created_at: "2024-01-05T10:00:00Z",
    updated_at: "2024-01-12T14:30:00Z",
    user: {
      id: "user1",
      handle: "designer_jane",
      img_url: "https://via.placeholder.com/40x40?text=DJ"
    },
    sort_position: "1"
  },
  {
    key: "style2", 
    file_key: "demo123",
    node_id: "1:21",
    style_type: "TEXT" as const,
    thumbnail_url: "https://via.placeholder.com/40x40/333333/FFFFFF?text=Aa",
    name: "Heading Large",
    description: "Large heading typography style for page titles and major sections",
    document_id: "1:4",
    created_at: "2024-01-06T11:30:00Z",
    updated_at: "2024-01-10T15:45:00Z",
    user: {
      id: "user2",
      handle: "design_lead",
      img_url: "https://via.placeholder.com/40x40?text=DL"
    },
    sort_position: "2"
  },
  {
    key: "style3",
    file_key: "demo123", 
    node_id: "1:22",
    style_type: "EFFECT" as const,
    thumbnail_url: "https://via.placeholder.com/40x40/F0F0F0/333333?text=FX",
    name: "Card Shadow",
    description: "Subtle drop shadow effect for card components and elevated surfaces",
    document_id: "1:4",
    created_at: "2024-01-07T13:15:00Z",
    updated_at: "2024-01-11T16:20:00Z",
    user: {
      id: "user1",
      handle: "designer_jane",
      img_url: "https://via.placeholder.com/40x40?text=DJ"
    },
    sort_position: "3"
  }
];