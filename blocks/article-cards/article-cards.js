import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Extract configuration values
  const [indexSourceDiv, itemsToShowDiv, startingPointDiv, tagsDiv] = [...block.children];
  const indexSource = indexSourceDiv?.querySelector('p')?.textContent || 'news-index';
  const itemsToShow = parseInt(itemsToShowDiv?.querySelector('p')?.textContent, 10) || 6;
  const startingPoint = parseInt(startingPointDiv?.querySelector('p')?.textContent, 10) || 0;
  const selectedTags = tagsDiv?.querySelector('p')?.textContent?.split(',') || [];

  // Clear block content
  block.textContent = '';

  // Fetch data
  const response = await fetch(`/${indexSource}.json?limit=${itemsToShow}&offset=${startingPoint}`);
  const json = await response.json();

  // Filter and sort articles
  const articles = json.data
    .filter((item) => {
      // Base filter for news articles
      if (!item.path.startsWith('/news/') || item.path === '/news/') {
        return false;
      }

      // Tag filtering if tags are selected
      if (selectedTags.length > 0 && item.tags) {
        const articleTags = item.tags.split(',');
        return selectedTags.some((tag) => articleTags.includes(tag));
      }

      return true;
    })
    .sort((a, b) => new Date(b.publishedTime) - new Date(a.publishedTime));

  if (articles.length === 0) {
    return;
  }

  // Create grid
  const grid = document.createElement('div');
  grid.className = 'article-cards-grid';

  // Create article cards
  articles.forEach((article) => {
    const card = document.createElement('div');
    card.className = 'article-card';

    const image = createOptimizedPicture(article.image, article.title, false, [
      { width: '750' },
    ]);

    const publishDate = article.publishedTime
      ? new Date(article.publishedTime).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) : '';

    const authorList = article.author ? article.author.split(',').map((author) => author.trim()) : [];
    const authorHtml = authorList.length ? `<p class="author">${authorList.join(', ')}</p>` : '';

    card.innerHTML = `
       <a href="${article.path}" class="article-card-link">
         ${image.outerHTML}
         <div class="article-card-content">
           <h3>${article.title}</h3>
           <div class="article-card-meta">
             ${authorHtml}
             ${publishDate ? `<p class="date">${publishDate}</p>` : ''}
           </div>
         </div>
       </a>
     `;

    grid.appendChild(card);
  });

  block.appendChild(grid);
}
