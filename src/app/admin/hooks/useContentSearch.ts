// src/app/admin/hooks/useContentSearch.ts
import { useState, useMemo } from 'react';

// Generic type for searchable content
type SearchableItem = Record<string, any>;

// Configuration for search functionality
interface SearchConfig<T extends SearchableItem> {
  // Fields to search through (e.g., ['term', 'definition', 'topic'])
  searchFields: (keyof T)[];
  // Field to filter by (e.g., 'subject')
  filterField?: keyof T;
  // Available filter options (e.g., ['Computer Science', 'Mathematics'])
  filterOptions?: string[];
  // Default filter value (e.g., 'all')
  defaultFilter?: string;
}

export function useContentSearch<T extends SearchableItem>(
  items: T[],
  config: SearchConfig<T>
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState(config.defaultFilter || 'all');

  // Filtered and searched items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search logic - check if search term matches any of the specified fields
      const matchesSearch = config.searchFields.some(field => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });

      // Filter logic - check if item matches the selected filter
      const matchesFilter = !config.filterField || 
                           filterValue === 'all' || 
                           item[config.filterField] === filterValue;

      return (searchTerm === '' || matchesSearch) && matchesFilter;
    });
  }, [items, searchTerm, filterValue, config.searchFields, config.filterField]);

  // Clear search and filters
  const clearSearch = () => {
    setSearchTerm('');
    setFilterValue(config.defaultFilter || 'all');
  };

  // Get unique filter options from the items
  const getFilterOptions = () => {
    if (!config.filterField) return [];
    
    const uniqueValues = [...new Set(items.map(item => item[config.filterField] as string))];
    return uniqueValues.filter(Boolean).sort();
  };

  return {
    // Current state
    searchTerm,
    filterValue,
    filteredItems,
    
    // Actions
    setSearchTerm,
    setFilterValue,
    clearSearch,
    
    // Computed values
    totalItems: items.length,
    filteredCount: filteredItems.length,
    hasActiveFilters: searchTerm !== '' || filterValue !== (config.defaultFilter || 'all'),
    availableFilterOptions: config.filterOptions || getFilterOptions(),
    
    // Search stats
    isSearching: searchTerm !== '',
    isFiltering: filterValue !== (config.defaultFilter || 'all'),
    hasResults: filteredItems.length > 0
  };
}