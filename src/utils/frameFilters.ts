import { FrameWithThumbnail, FrameFilter } from '../types/figma';

/**
 * Generate frame filters based on the properties of the provided frames
 */
export function generateFrameFilters(frames: FrameWithThumbnail[]): FrameFilter[] {
  const filters: FrameFilter[] = [];

  // Always include "All" filter
  filters.push({
    id: 'all',
    label: 'All',
    count: frames.length,
    predicate: () => true
  });

  // Filter by visibility
  const visibleFrames = frames.filter(frame => frame.visible !== false);
  const hiddenFrames = frames.filter(frame => frame.visible === false);
  
  if (hiddenFrames.length > 0) {
    filters.push({
      id: 'visible',
      label: 'Visible',
      count: visibleFrames.length,
      predicate: (frame) => frame.visible !== false
    });
    
    filters.push({
      id: 'hidden',
      label: 'Hidden',
      count: hiddenFrames.length,
      predicate: (frame) => frame.visible === false
    });
  }

  // Filter by lock status
  const lockedFrames = frames.filter(frame => frame.locked === true);
  if (lockedFrames.length > 0) {
    filters.push({
      id: 'unlocked',
      label: 'Unlocked',
      count: frames.length - lockedFrames.length,
      predicate: (frame) => frame.locked !== true
    });
    
    filters.push({
      id: 'locked',
      label: 'Locked',
      count: lockedFrames.length,
      predicate: (frame) => frame.locked === true
    });
  }

  // Filter by size categories based on dimensions
  const sizeCategories = categorizeFramesBySize(frames);
  Object.entries(sizeCategories).forEach(([category, categoryFrames]) => {
    if (categoryFrames.length > 0) {
      filters.push({
        id: `size-${category}`,
        label: getSizeCategoryLabel(category),
        count: categoryFrames.length,
        predicate: (frame) => {
          const size = getFrameSizeCategory(frame);
          return size === category;
        }
      });
    }
  });

  // Filter by content (has children vs empty)
  const framesWithContent = frames.filter(frame => frame.children && frame.children.length > 0);
  const emptyFrames = frames.filter(frame => !frame.children || frame.children.length === 0);
  
  if (framesWithContent.length > 0 && emptyFrames.length > 0) {
    filters.push({
      id: 'with-content',
      label: 'With Content',
      count: framesWithContent.length,
      predicate: (frame) => !!(frame.children && frame.children.length > 0)
    });
    
    filters.push({
      id: 'empty',
      label: 'Empty',
      count: emptyFrames.length,
      predicate: (frame) => !(frame.children && frame.children.length > 0)
    });
  }

  // Filter by name patterns (if there are common prefixes or patterns)
  const nameFilters = generateNameBasedFilters(frames);
  filters.push(...nameFilters);

  // Filter by thumbnail availability
  const framesWithThumbnails = frames.filter(frame => frame.thumbnailUrl && !frame.error);
  const framesWithErrors = frames.filter(frame => frame.error);
  
  if (framesWithErrors.length > 0) {
    filters.push({
      id: 'with-thumbnails',
      label: 'With Thumbnails',
      count: framesWithThumbnails.length,
      predicate: (frame) => !!(frame.thumbnailUrl && !frame.error)
    });
    
    filters.push({
      id: 'errors',
      label: 'Failed to Load',
      count: framesWithErrors.length,
      predicate: (frame) => !!frame.error
    });
  }

  // Only return filters that have meaningful counts (more than 0, less than total)
  // Always include 'all' filter even if empty
  return filters.filter(filter => 
    filter.id === 'all' || // Always include 'all' filter
    (filter.count > 0 && filter.count < frames.length) // Include others only if they create meaningful subsets
  );
}

function categorizeFramesBySize(frames: FrameWithThumbnail[]): Record<string, FrameWithThumbnail[]> {
  const categories: Record<string, FrameWithThumbnail[]> = {
    small: [],
    medium: [],
    large: [],
    xlarge: []
  };

  frames.forEach(frame => {
    const category = getFrameSizeCategory(frame);
    if (category) {
      categories[category].push(frame);
    }
  });

  return categories;
}

function getFrameSizeCategory(frame: FrameWithThumbnail): string | null {
  if (!frame.absoluteBoundingBox) return null;
  
  const { width, height } = frame.absoluteBoundingBox;
  const area = width * height;
  
  if (area < 50000) return 'small';     // < ~224x224
  if (area < 200000) return 'medium';   // < ~447x447
  if (area < 800000) return 'large';    // < ~894x894
  return 'xlarge';                      // >= ~894x894
}

function getSizeCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    small: 'Small',
    medium: 'Medium', 
    large: 'Large',
    xlarge: 'Extra Large'
  };
  return labels[category] || category;
}

function generateNameBasedFilters(frames: FrameWithThumbnail[]): FrameFilter[] {
  const filters: FrameFilter[] = [];
  
  // Look for common prefixes (at least 3 chars, at least 2 frames)
  const prefixCounts = new Map<string, FrameWithThumbnail[]>();
  
  frames.forEach(frame => {
    const name = frame.name.toLowerCase();
    
    // Extract potential prefixes (word boundaries, numbers, common separators)
    const prefixes = extractPrefixes(name);
    
    prefixes.forEach(prefix => {
      if (!prefixCounts.has(prefix)) {
        prefixCounts.set(prefix, []);
      }
      prefixCounts.get(prefix)!.push(frame);
    });
  });

  // Create filters for prefixes with multiple frames
  prefixCounts.forEach((frameList, prefix) => {
    if (frameList.length >= 2 && frameList.length < frames.length) {
      filters.push({
        id: `prefix-${prefix}`,
        label: capitalizePrefix(prefix),
        count: frameList.length,
        predicate: (frame) => {
          const name = frame.name.toLowerCase();
          return extractPrefixes(name).includes(prefix);
        }
      });
    }
  });

  // Limit to top 5 name-based filters to avoid clutter
  return filters
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function extractPrefixes(name: string): string[] {
  const prefixes: string[] = [];
  
  // Look for word-based prefixes (ending with space, dash, underscore, number)
  const wordMatches = name.match(/^[a-z]+(?=[\s\-_\d])/g);
  if (wordMatches) {
    prefixes.push(...wordMatches.filter(p => p.length >= 3));
  }
  
  // Look for number prefixes
  const numberMatches = name.match(/^\d+/g);
  if (numberMatches) {
    prefixes.push(...numberMatches);
  }
  
  return Array.from(new Set(prefixes)); // Remove duplicates
}

function capitalizePrefix(prefix: string): string {
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}