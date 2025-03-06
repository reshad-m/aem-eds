/**
 * Fetches data from an index JSON file with pagination options
 * @param {string} indexSource - The index source (e.g., 'news-index', 'our-people-index')
 * @param {Object} options - Fetch options
 * @param {number} [options.limit=10] - Number of items to fetch
 * @param {number} [options.offset=0] - Starting index
 * @returns {Promise<Object>} - The fetched data
 */
export async function fetchIndex(indexSource, options = {}) {
  const {
    limit = 10,
    offset = 0,
  } = options;

  // Ensure indexSource has .json extension if not provided
  const sourceName = indexSource.endsWith('.json') ? indexSource : `${indexSource}.json`;

  // Use window.hlx.codeBasePath if available to get the correct base path
  const basePath = window.hlx?.codeBasePath || '';

  // Build the full URL with the correct base path
  const url = `${basePath}/${sourceName}`;

  try {
    // Fetch data
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error loading data from ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    if (!json) {
      console.error(`Empty response from ${url}`);
      return null;
    }

    // Apply pagination in memory
    if (json.data && Array.isArray(json.data)) {
      const paginatedData = {
        ...json,
        data: json.data.slice(offset, offset + limit),
        total: json.data.length,
        offset,
        limit,
      };
      return paginatedData;
    }

    return json;
  } catch (error) {
    console.error(`Failed to fetch data from ${url}`, error);
    return null;
  }
}

/**
 * Finds a single item by ID in the specified index
 * @param {string} indexSource - The index source
 * @param {string} id - ID to find (will match against end of path)
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object|null>} - The found item or null
 */
export async function findByPathEnd(indexSource, id, options = {}) {
  try {
    // Set high limit to ensure we get all data for searching
    const fetchOptions = { ...options, limit: 1000 };
    const json = await fetchIndex(indexSource, fetchOptions);

    if (!json || !json.data) return null;

    return json.data.find((item) => item.path && item.path.endsWith(id)) || null;
  } catch (error) {
    console.error(`Error finding path ending with ${id} in ${indexSource}`, error);
    return null;
  }
}
