import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Formats a date string into localized format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Creates article HTML structure
 * @param {Object} article - Article data
 * @param {boolean} isPrimary - Whether this is the primary article
 * @returns {HTMLElement} Article element
 */
function createArticleElement(article, isPrimary) {
  const element = document.createElement('article');
  element.className = isPrimary ? 'featured-block-primary' : 'featured-block-article';

  const image = createOptimizedPicture(
    article.image,
    article.title,
    false,
    [{ width: isPrimary ? '1200' : '600' }],
  );

  const date = formatDate(article.publishedTime);
  const authors = article.author ? article.author.split(',').map((author) => author.trim()) : [];
  const authorHtml = authors.length ? `<span class="author">${authors.join(', ')}</span>` : '';

  element.innerHTML = `
    <a class="${isPrimary ? 'featured-block-primary-link' : 'featured-block-article-link'}" href="${article.path}">
      <div class="${isPrimary ? 'featured-block-primary-media' : 'featured-block-article-media'}">
        ${image.outerHTML}
      </div>
      <div class="${isPrimary ? 'featured-block-primary-content' : 'featured-block-article-content'}">
        ${isPrimary
    ? `<h3 class="featured-block-primary-title">${article.title}</h3>`
    : `<h4 class="featured-block-article-title">${article.title}</h4>`
}
        <div class="featured-block-meta">
          ${authorHtml}
          ${date ? `<time datetime="${article.publishedTime}">${date}</time>` : ''}
        </div>
      </div>
    </a>
  `;

  return element;
}

/**
 * Decorates the featured block
 * @param {Element} block - The featured block element
 */
export default async function decorate(block) {
  try {
    // Extract configuration values
    const [indexSourceDiv, articlesCountDiv, startingPointDiv, tagsDiv] = [...block.children];
    const config = {
      indexSource: indexSourceDiv?.querySelector('p')?.textContent || 'news-index',
      articlesCount: parseInt(articlesCountDiv?.querySelector('p')?.textContent, 10) || 4,
      startingPoint: parseInt(startingPointDiv?.querySelector('p')?.textContent, 10) || 0,
      selectedTags: tagsDiv?.querySelector('p')?.textContent?.split(',').filter(Boolean) || [],
    };

    // Clear block content
    block.textContent = '';

    // Fetch articles data
    const response = await fetch(`/${config.indexSource}.json?limit=${config.articlesCount}&offset=${config.startingPoint}`);
    if (!response.ok) throw new Error('Failed to fetch articles data');
    const json = await response.json();

    // Filter and sort articles
    const articles = json.data
      .filter((item) => {
        // Base filter for news articles
        if (!item.path.startsWith('/news/') || item.path === '/news/') {
          return false;
        }

        // Tag filtering if tags are selected
        if (config.selectedTags.length > 0 && item.tags) {
          const articleTags = item.tags.split(',').map((tag) => tag.trim());
          return config.selectedTags.some((tag) => articleTags.includes(tag));
        }

        return true;
      })
      .sort((a, b) => new Date(b.publishedTime) - new Date(a.publishedTime));

    if (articles.length === 0) {
      throw new Error('No articles found matching the criteria');
    }

    // Create featured block grid
    const grid = document.createElement('div');
    grid.className = 'featured-block-grid';

    // Add primary article
    const primaryArticle = createArticleElement(articles[0], true);

    // Create secondary articles container
    const secondaryArticles = document.createElement('div');
    secondaryArticles.className = 'featured-block-secondary';

    // Add secondary articles
    articles.slice(1).forEach((article) => {
      const articleElement = createArticleElement(article, false);
      secondaryArticles.appendChild(articleElement);
    });

    // Assemble the block
    grid.appendChild(primaryArticle);
    grid.appendChild(secondaryArticles);
    block.appendChild(grid);
  } catch (error) {
    block.innerHTML = `
      <div class="featured-block-error">
        <p>Unable to load featured content</p>
        ${error.message ? `<p class="error-message">${error.message}</p>` : ''}
      </div>
    `;
  }
}
