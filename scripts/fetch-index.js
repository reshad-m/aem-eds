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

  // Build URL with pagination parameters
  const sourceName = indexSource.endsWith('.json') ? indexSource : `${indexSource}.json`;
  const basePath = window.hlx?.codeBasePath || '';
  const url = `${basePath}/${sourceName}?limit=${limit}&offset=${offset}`;

  // Fetch data
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${indexSource} (${response.status}: ${response.statusText})`);
  }

  const json = await response.json();
  return json;
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
    const json = await fetchIndex(indexSource, options);

    return json.data.find((item) => item.path && item.path.endsWith(id)) || null;
  } catch (error) {
    return null;
  }
}
