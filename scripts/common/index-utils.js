/**
 * Fetches data from an index JSON file with pagination options
 * @param {string} indexSource - The index source (e.g., 'news-index', 'our-people-index')
 * @param {Object} options - Fetch options
 * @param {number} [options.limit=0] - Number of items to fetch (only applied if > 0)
 * @param {number} [options.offset=0] - Starting index
 * @returns {Promise<Object>} - The fetched data
 */
export async function fetchIndex(indexSource, options = {}) {
  const { limit = 0, offset = 0 } = options;

  // Ensure indexSource has .json extension
  const sourceName = indexSource.endsWith('.json') ? indexSource : `${indexSource}.json`;
  const baseUrl = `${window.hlx.codeBasePath}/${sourceName}`;

  // Add query parameters if needed
  const queryParams = new URLSearchParams();
  if (offset > 0) queryParams.append('offset', offset);
  if (limit > 0) queryParams.append('limit', limit);

  // Append query parameters if any exist
  const requestUrl = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch index from ${indexSource}:`, error.message);
    return null;
  }
}

export async function findByPathEnd(itemIds, indexData) {
  const matchedItems = indexData.data.filter((item) => item.path && itemIds.some((id) => item.path.includes(`/${id}`)));
  return matchedItems.length > 0 ? matchedItems : null;
}
