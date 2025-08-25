import { generateFrameFilters } from './frameFilters';
import { FrameWithThumbnail } from '../types/figma';

const createMockFrame = (overrides: Partial<FrameWithThumbnail> = {}): FrameWithThumbnail => ({
  id: 'frame1',
  name: 'Test Frame',
  type: 'FRAME',
  children: [],
  absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
  ...overrides
});

describe('generateFrameFilters', () => {
  test('always includes "All" filter', () => {
    const frames = [createMockFrame()];
    const filters = generateFrameFilters(frames);
    
    // Should have "All" filter, may have other single-category filters
    expect(filters.length).toBeGreaterThanOrEqual(1);
    expect(filters[0]).toEqual({
      id: 'all',
      label: 'All',
      count: 1,
      predicate: expect.any(Function)
    });
  });

  test('creates visibility filters when hidden frames exist', () => {
    const frames = [
      createMockFrame({ id: 'visible1', visible: true }),
      createMockFrame({ id: 'hidden1', visible: false }),
      createMockFrame({ id: 'visible2' }) // undefined visible defaults to visible
    ];
    
    const filters = generateFrameFilters(frames);
    
    const visibleFilter = filters.find(f => f.id === 'visible');
    const hiddenFilter = filters.find(f => f.id === 'hidden');
    
    expect(visibleFilter).toBeDefined();
    expect(visibleFilter?.count).toBe(2);
    expect(hiddenFilter).toBeDefined();
    expect(hiddenFilter?.count).toBe(1);
  });

  test('creates lock status filters when locked frames exist', () => {
    const frames = [
      createMockFrame({ id: 'unlocked1', locked: false }),
      createMockFrame({ id: 'locked1', locked: true }),
      createMockFrame({ id: 'unlocked2' }) // undefined locked defaults to unlocked
    ];
    
    const filters = generateFrameFilters(frames);
    
    const unlockedFilter = filters.find(f => f.id === 'unlocked');
    const lockedFilter = filters.find(f => f.id === 'locked');
    
    expect(unlockedFilter).toBeDefined();
    expect(unlockedFilter?.count).toBe(2);
    expect(lockedFilter).toBeDefined();
    expect(lockedFilter?.count).toBe(1);
  });

  test('creates size category filters', () => {
    const frames = [
      createMockFrame({ id: 'small', absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 } }), // 10k area = small
      createMockFrame({ id: 'medium', absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 300 } }), // 90k area = medium
      createMockFrame({ id: 'large', absoluteBoundingBox: { x: 0, y: 0, width: 600, height: 600 } }), // 360k area = large
      createMockFrame({ id: 'xlarge', absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 1000 } }) // 1M area = xlarge
    ];
    
    const filters = generateFrameFilters(frames);
    
    const sizeFilters = filters.filter(f => f.id.startsWith('size-'));
    expect(sizeFilters).toHaveLength(4);
    
    const smallFilter = filters.find(f => f.id === 'size-small');
    const mediumFilter = filters.find(f => f.id === 'size-medium');
    const largeFilter = filters.find(f => f.id === 'size-large');
    const xlargeFilter = filters.find(f => f.id === 'size-xlarge');
    
    expect(smallFilter?.count).toBe(1);
    expect(mediumFilter?.count).toBe(1);
    expect(largeFilter?.count).toBe(1);
    expect(xlargeFilter?.count).toBe(1);
  });

  test('creates content filters when both empty and non-empty frames exist', () => {
    const frames = [
      createMockFrame({ id: 'with-content', children: [{ id: 'child1' } as any] }),
      createMockFrame({ id: 'empty1', children: [] }),
      createMockFrame({ id: 'empty2', children: undefined })
    ];
    
    const filters = generateFrameFilters(frames);
    
    const withContentFilter = filters.find(f => f.id === 'with-content');
    const emptyFilter = filters.find(f => f.id === 'empty');
    
    expect(withContentFilter).toBeDefined();
    expect(withContentFilter?.count).toBe(1);
    expect(emptyFilter).toBeDefined();
    expect(emptyFilter?.count).toBe(2);
  });

  test('creates thumbnail status filters when errors exist', () => {
    const frames = [
      createMockFrame({ id: 'success', thumbnailUrl: 'http://example.com/thumb.png' }),
      createMockFrame({ id: 'error1', error: 'Failed to load' }),
      createMockFrame({ id: 'error2', thumbnailUrl: 'http://example.com/thumb.png', error: 'Network error' })
    ];
    
    const filters = generateFrameFilters(frames);
    
    const withThumbnailsFilter = filters.find(f => f.id === 'with-thumbnails');
    const errorsFilter = filters.find(f => f.id === 'errors');
    
    expect(withThumbnailsFilter).toBeDefined();
    expect(withThumbnailsFilter?.count).toBe(1);
    expect(errorsFilter).toBeDefined();
    expect(errorsFilter?.count).toBe(2);
  });

  test('creates name-based filters for common prefixes', () => {
    const frames = [
      createMockFrame({ id: '1', name: 'Header Component' }),
      createMockFrame({ id: '2', name: 'Header Variant' }),
      createMockFrame({ id: '3', name: 'Button Primary' }),
      createMockFrame({ id: '4', name: 'Button Secondary' }),
      createMockFrame({ id: '5', name: 'Footer Section' })
    ];
    
    const filters = generateFrameFilters(frames);
    
    const headerFilter = filters.find(f => f.id === 'prefix-header');
    const buttonFilter = filters.find(f => f.id === 'prefix-button');
    
    expect(headerFilter).toBeDefined();
    expect(headerFilter?.count).toBe(2);
    expect(buttonFilter).toBeDefined();
    expect(buttonFilter?.count).toBe(2);
    
    // Footer should not create a filter because it only has 1 frame
    const footerFilter = filters.find(f => f.id === 'prefix-footer');
    expect(footerFilter).toBeUndefined();
  });

  test('filter predicates work correctly', () => {
    const frames = [
      createMockFrame({ id: 'visible', visible: true }),
      createMockFrame({ id: 'hidden', visible: false })
    ];
    
    const filters = generateFrameFilters(frames);
    
    const visibleFilter = filters.find(f => f.id === 'visible');
    const hiddenFilter = filters.find(f => f.id === 'hidden');
    
    expect(visibleFilter?.predicate(frames[0])).toBe(true);
    expect(visibleFilter?.predicate(frames[1])).toBe(false);
    expect(hiddenFilter?.predicate(frames[0])).toBe(false);
    expect(hiddenFilter?.predicate(frames[1])).toBe(true);
  });

  test('handles empty frames array', () => {
    const filters = generateFrameFilters([]);
    
    expect(filters).toHaveLength(1);
    expect(filters[0]).toEqual({
      id: 'all',
      label: 'All',
      count: 0,
      predicate: expect.any(Function)
    });
  });
});