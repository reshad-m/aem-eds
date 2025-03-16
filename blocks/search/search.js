import {
  createOptimizedPicture,
  decorateIcons,
  fetchPlaceholders,
} from '../../scripts/aem.js';
import { fetchIndex } from '../../scripts/common/index-utils.js';

const searchParams = new URLSearchParams(window.location.search);

// Global reference to store the current search state
window.searchState = {
  currentSearchTerm: '',
  currentBlock: null,
  currentConfig: null,
};

// Get search fields by category
function getSearchFieldsByCategory(category) {
  switch (category) {
    case 'news':
      return ['title', 'description', 'author', 'tags'];
    case 'our-people':
      return ['name', 'jobRole', 'enquiryCategory'];
    case 'main':
    default:
      return ['title', 'description', 'path'];
  }
}

function findNextHeading(el) {
  let preceedingEl = el.parentElement.previousElement || el.parentElement.parentElement;
  let h = 'H2';
  while (preceedingEl) {
    const lastHeading = [...preceedingEl.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      h = level < 6 ? `H${level + 1}` : 'H6';
      preceedingEl = false;
    } else {
      preceedingEl = preceedingEl.previousElement || preceedingEl.parentElement;
    }
  }
  return h;
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({ offset, term: textContent.substring(offset, offset + term.length) });
        start = offset + term.length;
        offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

function getFacetDisplayName(facetName) {
  const displayNames = {
    news: 'News Categories',
    authors: 'Authors',
    contentType: 'Content Type',
    year: 'Year',
    'inquiry-categories': 'Inquiry Categories',
  };
  return displayNames[facetName] || facetName;
}

function createPageButton(pageNumber, currentPage, onPageChange) {
  const button = document.createElement('button');
  button.className = `pagination-page ${pageNumber === currentPage ? 'active' : ''}`;
  button.textContent = pageNumber;

  // Add event listener directly without checking if page is different
  button.addEventListener('click', () => {
    onPageChange(pageNumber);
  });

  return button;
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data, config) {
  if (!searchTerms || searchTerms.length === 0) return data;

  // Get the search fields based on category
  const searchFields = getSearchFieldsByCategory(config.searchCategory);

  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    // Check primary fields (header/title)
    searchTerms.forEach((term) => {
      const titleField = config.searchCategory === 'our-people' ? 'name' : 'title';
      const content = (result.header || result[titleField] || '').toLowerCase();
      const idx = content.indexOf(term.toLowerCase());
      if (idx < 0) return;
      if (minIdx < 0 || idx < minIdx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    // Build meta content string based on category-specific fields
    const metaParts = searchFields.map((field) => result[field] || '').filter(Boolean);
    const metaContents = metaParts.join(' ').toLowerCase();

    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term.toLowerCase());
      if (idx < 0) return;
      if (minIdx < 0 || idx < minIdx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  if (searchResults) {
    searchResults.innerHTML = '';
  }
}

function clearSearch(block) {
  clearSearchResults(block);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }
}

function getActiveFiltersFromURL() {
  const filters = {};

  searchParams.forEach((value, key) => {
    if (key.startsWith('filter.')) {
      const facetName = key.substring(7); // Remove 'filter.' prefix

      if (!filters[facetName]) {
        filters[facetName] = [];
      }

      // Handle multiple values for the same filter
      value.split(',').forEach((v) => {
        const trimmedValue = v.trim();
        if (trimmedValue && !filters[facetName].includes(trimmedValue)) {
          filters[facetName].push(trimmedValue);
        }
      });
    }
  });

  return filters;
}

function updateURLWithFilters(filters) {
  // Remove existing filter params
  [...searchParams.keys()]
    .filter((key) => key.startsWith('filter.'))
    .forEach((key) => searchParams.delete(key));

  // Add new filter params
  Object.entries(filters).forEach(([facetName, values]) => {
    if (values && values.length > 0) {
      searchParams.set(`filter.${facetName}`, values.join(','));
    }
  });

  // Update URL without reloading page
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }
}

function clearAllFilters() {
  // Get all filter parameters from URL
  const filterKeys = [...searchParams.keys()].filter((key) => key.startsWith('filter.'));

  // Remove all filter parameters
  filterKeys.forEach((key) => searchParams.delete(key));

  // Update URL
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  // Trigger search with cleared filters
  const searchInputEl = document.querySelector('.search-input');
  if (searchInputEl) {
    searchInputEl.dispatchEvent(new Event('input'));
  }
}

function toggleFilter(facetName, value) {
  // Get current filters from URL
  const currentFilters = getActiveFiltersFromURL();

  // Toggle filter
  if (!currentFilters[facetName]) {
    currentFilters[facetName] = [value];
  } else if (currentFilters[facetName].includes(value)) {
    currentFilters[facetName] = currentFilters[facetName].filter((v) => v !== value);
    if (currentFilters[facetName].length === 0) {
      delete currentFilters[facetName];
    }
  } else {
    currentFilters[facetName].push(value);
  }

  // Reset to page 1 when filters change
  searchParams.set('page', '1');

  // Update URL
  updateURLWithFilters(currentFilters);

  // Trigger search with new filters
  const searchInputEl = document.querySelector('.search-input');
  if (searchInputEl) {
    searchInputEl.dispatchEvent(new Event('input'));
  }
}

function applyFilters(data, activeFilters, config) {
  if (Object.keys(activeFilters).length === 0) {
    return data; // No filters active
  }

  // For different categories, we need to check different fields
  if (config.searchCategory === 'our-people') {
    return data.filter((item) => {
      // For people, check the enquiryCategory field
      if (!item.enquiryCategory) return false;

      const categoryParts = item.enquiryCategory.split(',').map((t) => t.trim());

      // Check if item matches ANY of the filter categories
      return Object.entries(activeFilters).some(([facetName, values]) => {
        if (!values || values.length === 0) return false;

        // Check if item matches any value in this category
        return values.some((value) => {
          const searchFor = `${facetName}:${value}`.toLowerCase().trim();
          return categoryParts.some((cat) => cat.toLowerCase().trim() === searchFor);
        });
      });
    });
  }

  // For news or main categories, use tags
  return data.filter((item) => {
    // If we don't have tags, we can't match tag-based filters
    if (!item.tags || typeof item.tags !== 'string') {
      return false;
    }

    const tagParts = item.tags.split(',').map((t) => t.trim());

    // Check if item matches ANY of the filter categories (using OR logic between categories)
    const matchesFilter = Object.entries(activeFilters).some(([facetName, values]) => {
      if (!values || values.length === 0) return false;

      // Check if item matches any value in this category
      return values.some((value) => {
        const searchFor = `${facetName}:${value}`.toLowerCase().trim();
        return tagParts.some((tag) => {
          const normalizedTag = tag.toLowerCase().trim();
          return normalizedTag === searchFor;
        });
      });
    });

    return matchesFilter;
  });
}

function generateFacets(data, config) {
  const facets = {};

  // Initialize facets based on configuration
  (config.facets || []).forEach((facetName) => {
    facets[facetName] = new Map();
  });

  // Count occurrences for each facet value
  data.forEach((item) => {
    // Special handling for people category
    if (config.searchCategory === 'our-people' && item.enquiryCategory) {
      const categoryParts = item.enquiryCategory.split(',').map((t) => t.trim());

      categoryParts.forEach((cat) => {
        if (!cat) return;

        const colonIndex = cat.indexOf(':');
        if (colonIndex > 0) {
          const category = cat.substring(0, colonIndex);
          const value = cat.substring(colonIndex + 1);

          if (facets[category] && value) {
            facets[category].set(value, (facets[category].get(value) || 0) + 1);
          }
        }
      });

      return;
    }

    // Process tags specially since they're in a comma-separated string
    if (item.tags && typeof item.tags === 'string') {
      const tagParts = item.tags.split(',').map((t) => t.trim());

      tagParts.forEach((tag) => {
        if (!tag) return;

        // Check if tag has category format (category:value)
        const colonIndex = tag.indexOf(':');
        if (colonIndex > 0) {
          const category = tag.substring(0, colonIndex);
          const value = tag.substring(colonIndex + 1);

          // Only process this tag if we care about this category
          if (facets[category] && value) {
            facets[category].set(value, (facets[category].get(value) || 0) + 1);
          }
        }
      });
    }
  });

  return facets;
}

function createFacetGroups(facets, container, activeFilters, config) {
  Object.entries(facets).forEach(([facetName, facetValues]) => {
    if (facetValues.size === 0) return;

    const facetGroup = document.createElement('div');
    facetGroup.className = 'facet-group';

    const facetTitle = document.createElement('h3');
    facetTitle.textContent = getFacetDisplayName(facetName);
    facetGroup.appendChild(facetTitle);

    const facetList = document.createElement('ul');
    facetList.className = 'facet-list';

    // Sort facet values by count (descending)
    const sortedValues = [...facetValues.entries()]
      .sort((a, b) => b[1] - a[1]);

    sortedValues.forEach(([value, count]) => {
      const isActive = activeFilters[facetName]?.includes(value);
      const facetItem = document.createElement('li');
      facetItem.className = 'facet-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'facet-checkbox';
      checkbox.checked = isActive;
      checkbox.addEventListener('change', () => {
        toggleFilter(facetName, value);
      });

      const label = document.createElement('label');
      label.textContent = value;

      const countSpan = document.createElement('span');
      countSpan.className = 'facet-count';
      countSpan.textContent = count;

      facetItem.appendChild(checkbox);
      facetItem.appendChild(label);

      if (config.showFilterCount) {
        facetItem.appendChild(countSpan);
      }

      facetList.appendChild(facetItem);
    });

    facetGroup.appendChild(facetList);
    container.appendChild(facetGroup);
  });
}

function createFacetsUI(facets, activeFilters, config) {
  const facetsContainer = document.createElement('div');
  facetsContainer.className = 'search-facets';

  // Mobile toggle for facets
  if (window.innerWidth <= 800) {
    const toggle = document.createElement('div');
    toggle.className = 'facet-toggle';
    toggle.innerHTML = `
      <span>Filters</span>
      <span class="icon icon-chevron-down"></span>
    `;

    const toggleContent = document.createElement('div');
    toggleContent.className = 'facet-toggle-content';

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
    });

    facetsContainer.appendChild(toggle);
    toggle.appendChild(toggleContent);

    // Add facet groups to toggle content
    const facetGroups = document.createElement('div');
    facetGroups.className = 'facet-groups';
    toggleContent.appendChild(facetGroups);

    createFacetGroups(facets, facetGroups, activeFilters, config);
  } else {
    // Desktop view
    const facetGroups = document.createElement('div');
    facetGroups.className = 'facet-groups';
    facetsContainer.appendChild(facetGroups);

    createFacetGroups(facets, facetGroups, activeFilters, config);
  }

  return facetsContainer;
}

function createActiveFiltersUI(activeFilters) {
  const container = document.createElement('div');
  container.className = 'active-filters';

  let hasFilters = false;

  Object.entries(activeFilters).forEach(([facetName, values]) => {
    if (!values || values.length === 0) return;

    values.forEach((value) => {
      hasFilters = true;
      const tag = document.createElement('div');
      tag.className = 'filter-tag';

      const facetDisplay = getFacetDisplayName(facetName);
      tag.textContent = `${facetDisplay}: ${value}`;

      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-filter icon icon-close';
      removeBtn.addEventListener('click', () => {
        toggleFilter(facetName, value);
      });

      tag.appendChild(removeBtn);
      container.appendChild(tag);
    });
  });

  // Add "Clear All" button if there are active filters
  if (hasFilters) {
    const clearAll = document.createElement('div');
    clearAll.className = 'filter-tag clear-all';
    clearAll.textContent = 'Clear All Filters';
    clearAll.addEventListener('click', clearAllFilters);
    container.appendChild(clearAll);
  }

  return hasFilters ? container : null;
}

function createPagination(currentPage, totalPages, onPageChange) {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'search-pagination';

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return paginationContainer;
  }

  // Previous button
  const prevButton = document.createElement('button');
  prevButton.className = 'pagination-nav prev';
  prevButton.innerHTML = '<span>Previous</span>';
  prevButton.disabled = currentPage <= 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });

  // Next button
  const nextButton = document.createElement('button');
  nextButton.className = 'pagination-nav next';
  nextButton.innerHTML = '<span>Next</span>';
  nextButton.disabled = currentPage >= totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  });

  // Page numbers
  const pagesContainer = document.createElement('div');
  pagesContainer.className = 'pagination-pages';

  // Determine which page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  // Adjust start page if we're near the end
  if (endPage === totalPages) {
    startPage = Math.max(1, endPage - 4);
  }

  // Always show page 1
  if (startPage > 1) {
    const pageButton = createPageButton(1, currentPage, onPageChange);
    pagesContainer.appendChild(pageButton);

    // Add ellipsis if there's a gap
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      pagesContainer.appendChild(ellipsis);
    }
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i += 1) {
    const pageButton = createPageButton(i, currentPage, onPageChange);
    pagesContainer.appendChild(pageButton);
  }

  // Always show last page
  if (endPage < totalPages) {
    // Add ellipsis if there's a gap
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      pagesContainer.appendChild(ellipsis);
    }

    const pageButton = createPageButton(totalPages, currentPage, onPageChange);
    pagesContainer.appendChild(pageButton);
  }

  // Assemble pagination
  paginationContainer.appendChild(prevButton);
  paginationContainer.appendChild(pagesContainer);
  paginationContainer.appendChild(nextButton);

  return paginationContainer;
}

// Render functions for different categories
function renderMainResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = result.path;
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    wrapper.append(pic);
    a.append(wrapper);
  }
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    a.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    a.append(description);
  }
  li.append(a);
  return li;
}

function renderNewsResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const newsLink = document.createElement('a'); // Changed variable name from 'a' to 'newsLink'
  newsLink.href = result.path;
  newsLink.className = 'news-result-item';

  // News article image
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    wrapper.append(pic);
    newsLink.append(wrapper);
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'news-result-content';

  // Title
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    title.textContent = result.title;
    highlightTextElements(searchTerms, [title]);
    contentDiv.appendChild(title);
  }

  // Publication date
  if (result.publishedTime) {
    const dateDiv = document.createElement('div');
    dateDiv.className = 'news-result-date';
    const date = new Date(result.publishedTime);
    dateDiv.textContent = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    contentDiv.appendChild(dateDiv);
  }

  // Author info
  if (result.author) {
    const authorDiv = document.createElement('div');
    authorDiv.className = 'news-result-author';
    // Remove "authors:" prefix if present
    const authorNames = result.author.split(',')
      .map((a) => a.trim().replace(/^authors:/, ''));
    authorDiv.textContent = `By ${authorNames.join(', ')}`;
    contentDiv.appendChild(authorDiv);
  }

  // Description
  if (result.description) {
    const description = document.createElement('p');
    description.className = 'news-result-description';
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    contentDiv.appendChild(description);
  }

  newsLink.appendChild(contentDiv);
  li.appendChild(newsLink);
  return li;
}

function renderPeopleResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const personLink = document.createElement('a'); // Changed variable name from 'a' to 'personLink'
  personLink.href = result.path;
  personLink.className = 'people-result-item';

  // Profile image
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'people-result-image';
    const pic = createOptimizedPicture(result.image, result.name || '', false, [{ width: '200' }]);
    wrapper.append(pic);
    personLink.append(wrapper);
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'people-result-content';

  // Name
  if (result.name) {
    const name = document.createElement(titleTag);
    name.className = 'people-result-name';
    name.textContent = result.name;
    highlightTextElements(searchTerms, [name]);
    contentDiv.appendChild(name);
  }

  // Job role
  if (result.jobRole) {
    const roleDiv = document.createElement('div');
    roleDiv.className = 'people-result-role';
    roleDiv.textContent = result.jobRole;
    highlightTextElements(searchTerms, [roleDiv]);
    contentDiv.appendChild(roleDiv);
  }

  // Phone number
  if (result.phone) {
    const phoneDiv = document.createElement('div');
    phoneDiv.className = 'people-result-phone';
    const phoneIcon = document.createElement('span');
    phoneIcon.className = 'icon icon-phone';
    phoneDiv.appendChild(phoneIcon);
    const phoneText = document.createElement('span');
    phoneText.textContent = result.phone;
    phoneDiv.appendChild(phoneText);
    contentDiv.appendChild(phoneDiv);
  }

  // Social links if present
  if (result.socialLinks) {
    const socialDiv = document.createElement('div');
    socialDiv.className = 'people-result-social';

    result.socialLinks.split(',').forEach((link) => {
      if (link.includes('linkedin')) {
        const linkedinLink = document.createElement('a');
        linkedinLink.href = link.trim();
        linkedinLink.className = 'social-link linkedin';
        linkedinLink.setAttribute('target', '_blank');
        linkedinLink.setAttribute('rel', 'noopener noreferrer');
        const icon = document.createElement('span');
        icon.className = 'icon icon-linkedin';
        linkedinLink.appendChild(icon);
        socialDiv.appendChild(linkedinLink);
      } else if (link.includes('x.com') || link.includes('twitter')) {
        const twitterLink = document.createElement('a');
        twitterLink.href = link.trim();
        twitterLink.className = 'social-link twitter';
        twitterLink.setAttribute('target', '_blank');
        twitterLink.setAttribute('rel', 'noopener noreferrer');
        const icon = document.createElement('span');
        icon.className = 'icon icon-twitter';
        twitterLink.appendChild(icon);
        socialDiv.appendChild(twitterLink);
      }
    });

    contentDiv.appendChild(socialDiv);
  }

  personLink.appendChild(contentDiv);
  li.appendChild(personLink);
  return li;
}

function updateSearchUI(
  block,
  config,
  results,
  searchTerms,
  facets,
  activeFilters,
  pagination = {},
) {
  const {
    currentPage = 1, totalPages = 1, totalResults = 0, onPageChange,
  } = pagination;
  const itemsPerPage = 5; // Default items per page

  // Find or create search container
  let searchContainer = block.querySelector('.search-container');
  if (!searchContainer) {
    searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    block.appendChild(searchContainer);
  } else {
    searchContainer.innerHTML = '';
  }

  // Create facets UI
  const facetsUI = createFacetsUI(facets, activeFilters, config);

  // Create main content area
  const mainContent = document.createElement('div');
  mainContent.className = 'search-main';

  // Create active filters UI
  const activeFiltersUI = createActiveFiltersUI(activeFilters);
  if (activeFiltersUI) {
    mainContent.appendChild(activeFiltersUI);
  }

  // Add result count
  const resultCount = document.createElement('div');
  resultCount.className = 'search-result-count';

  // Calculate the range of results being displayed
  const startItem = results.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
  const endItem = Math.min(startItem + results.length - 1, totalResults);

  // Format the result count text with the appropriate range and search term
  let resultCountText = '';
  if (totalResults === 0) {
    resultCountText = 'No results found';
  } else {
    resultCountText = `Showing ${startItem}-${endItem} of ${totalResults} results`;

    // Add search term if present
    if (searchTerms && searchTerms.length > 0) {
      resultCountText += ` for '${searchTerms.join(' ')}'`;
    }
  }

  resultCount.textContent = resultCountText;
  mainContent.appendChild(resultCount);

  // Create results container with category-specific class
  const resultsContainer = document.createElement('ul');
  resultsContainer.className = `search-results search-results-${config.searchCategory}`;
  resultsContainer.dataset.h = findNextHeading(block);

  if (results.length) {
    resultsContainer.classList.remove('no-results');

    // Use the appropriate renderer based on category
    const renderFunction = (() => {
      switch (config.searchCategory) {
        case 'news':
          return renderNewsResult;
        case 'our-people':
          return renderPeopleResult;
        case 'main':
        default:
          return renderMainResult;
      }
    })();

    results.forEach((result) => {
      const li = renderFunction(result, searchTerms, resultsContainer.dataset.h);
      resultsContainer.appendChild(li);
    });
  } else {
    const noResultsMessage = document.createElement('li');
    resultsContainer.classList.add('no-results');
    noResultsMessage.textContent = config.placeholders?.searchNoResults || 'No results found.';
    resultsContainer.appendChild(noResultsMessage);
  }

  mainContent.appendChild(resultsContainer);

  // Add pagination if we have more than one page
  if (totalPages > 1 && onPageChange) {
    const paginationUI = createPagination(currentPage, totalPages, onPageChange);
    mainContent.appendChild(paginationUI);
  }

  // Add elements to container
  searchContainer.appendChild(facetsUI);
  searchContainer.appendChild(mainContent);

  // Add facet layout class
  block.classList.add(config.facetLayout || 'sidebar');

  // Decorate icons for the new content
  decorateIcons(facetsUI);
  decorateIcons(mainContent);
}

// Updated fetchData function to properly handle pagination and category-specific sources
async function fetchData(source, options = {}) {
  const { limit = 5, offset = 0, searchTerm = '' } = options;

  // If we have a search term, fetch the entire dataset
  if (searchTerm && searchTerm.length >= 3) {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        return { data: [], total: 0 };
      }

      const json = await response.json();
      if (!json) {
        return { data: [], total: 0 };
      }

      return { data: json.data, total: json.data.length };
    } catch (error) {
      return { data: [], total: 0 };
    }
  }

  // Otherwise, use paginated fetching
  const indexPath = source.split('/').pop();
  const indexName = indexPath.split('.')[0];

  try {
    const json = await fetchIndex(indexName, { limit, offset });
    if (!json || !json.data) {
      return { data: [], total: 0 };
    }

    return {
      data: json.data,
      total: json.total || json.data.length,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
}

// Modified handleSearch function to properly handle pagination and category-specific search
async function handleSearch(e, block, config) {
  const searchValue = e.target ? e.target.value : e;

  // Store current search state globally
  window.searchState = {
    currentSearchTerm: searchValue,
    currentBlock: block,
    currentConfig: config,
  };

  // Get pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = 5; // Using 5 items per page

  // Update search term in URL
  if (typeof searchValue === 'string') {
    if (e.target) {
      // Reset to page 1 when search term changes via input
      searchParams.set('q', searchValue);
      searchParams.set('page', '1');
    } else {
      // Just update the search term for page changes
      searchParams.set('q', searchValue);
    }
  }

  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  // Get search terms
  const searchTerms = searchValue.toString().toLowerCase().split(/\s+/).filter((term) => !!term);

  // Get active filters
  const activeFilters = getActiveFiltersFromURL();

  // Calculate offset for pagination
  const offset = (page - 1) * itemsPerPage;

  // Fetch data based on whether we have a search term
  const { data, total } = await fetchData(config.source, {
    limit: itemsPerPage,
    offset,
    searchTerm: searchValue && searchValue.length >= 3 ? searchValue : '',
  });

  if (!data || !Array.isArray(data)) {
    return;
  }

  // Apply filters
  let filteredResults = applyFilters(data, activeFilters, config);

  // Apply search term filtering if needed
  if (searchTerms.length > 0) {
    filteredResults = filterData(searchTerms, filteredResults, config);
  }

  // For search with terms, we need to handle pagination client-side
  let paginatedResults = filteredResults;
  let totalResults = total;

  if (searchTerms.length > 0 || Object.keys(activeFilters).length > 0) {
    // For search terms or filters, we need to calculate total from filtered results
    totalResults = filteredResults.length;

    // Apply client-side pagination for search terms
    const startIndex = (page - 1) * itemsPerPage;
    paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);
  }

  // Generate facets from all available data
  const facets = generateFacets(data, config);

  // Calculate pagination info
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

  // Update the UI
  updateSearchUI(block, config, paginatedResults, searchTerms, facets, activeFilters, {
    currentPage: page,
    totalPages,
    totalResults,
    onPageChange: (newPage) => {
      // Update page in URL
      searchParams.set('page', newPage.toString());

      // Update URL
      const url = new URL(window.location.href);
      url.search = searchParams.toString();
      window.history.replaceState({}, '', url.toString());

      // Call handleSearch with the current search term
      if (window.searchState.currentSearchTerm) {
        handleSearch(window.searchState.currentSearchTerm, block, config);
      } else {
        handleSearch('', block, config);
      }
    },
  });
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function createSearchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = config.placeholders?.searchPlaceholder || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('input', (e) => {
    handleSearch(e, block, config);
  });

  input.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      clearSearch(block);
    }
  });

  return input;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchIcon(),
    createSearchInput(block, config),
  );

  return box;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();

  // Extract source, tags, and category from block content
  const [indexSourceDiv, tagsDiv, categoryDiv] = [...block.children];

  // Get index source
  const source = indexSourceDiv.querySelector('a[href]')
    ? indexSourceDiv.querySelector('a[href]').href
    : '/query-index.json';

  // Extract tag categories from tagsDiv
  const tagCategories = [];
  if (tagsDiv) {
    const tagsText = tagsDiv.textContent.trim();
    // Parse tags like "news:,authors:,news:not-for-profit,news:tax"
    const tagParts = tagsText.split(',').map((t) => t.trim());

    // Group tags by category
    tagParts.forEach((tag) => {
      if (!tag) return;

      // Check if tag has category format (category:value)
      const colonIndex = tag.indexOf(':');
      if (colonIndex > 0) {
        const category = tag.substring(0, colonIndex);
        const value = tag.substring(colonIndex + 1);

        // If it's just a category marker with no value, add it to our list
        if (!value && !tagCategories.includes(category)) {
          tagCategories.push(category);
        }
      }
    });
  }

  // Get search category, default to 'main' if not specified
  const searchCategory = categoryDiv && categoryDiv.textContent
    ? categoryDiv.textContent.trim().toLowerCase()
    : 'main';

  // Determine the correct index source based on category
  let categorySource = source;
  if (searchCategory === 'news') {
    categorySource = source.replace('query-index.json', 'news-index.json');
  } else if (searchCategory === 'our-people') {
    categorySource = source.replace('query-index.json', 'our-people-index.json');
  }

  // Config object for search
  const config = {
    source: categorySource,
    placeholders,
    facets: searchCategory === 'our-people' ? ['inquiry-categories'] : tagCategories,
    facetLayout: 'sidebar',
    showFilterCount: true,
    searchCategory, // Add the search category to config
  };

  // Add the search category as a class to the block
  block.classList.add(`search-category-${searchCategory}`);

  // Clear block content
  block.innerHTML = '';

  // Create search box
  const searchBoxElement = searchBox(block, config);

  // Create container for facets and results
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';

  block.appendChild(searchBoxElement);
  block.appendChild(searchContainer);

  // Decorate icons for search box
  decorateIcons(searchBoxElement);

  // If we have a search query or filters, perform search
  if (searchParams.get('q') || Object.keys(getActiveFiltersFromURL()).length > 0) {
    const input = block.querySelector('input');
    input.value = searchParams.get('q') || '';
    input.dispatchEvent(new Event('input'));
  } else {
    // No search term, just show first page of results
    handleSearch('', block, config);
  }
}
