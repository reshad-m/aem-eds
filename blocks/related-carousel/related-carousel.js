import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Extract configuration values
  const [
    enableAutoPopulateDiv,
    indexSourceDiv,
    itemsPerPageDiv,
    startIndexDiv,
    tagsDiv,
  ] = [...block.children];
  const enableAutoPopulate = enableAutoPopulateDiv?.querySelector('p')?.textContent || false;
  console.log(enableAutoPopulate);
  const indexSource = indexSourceDiv?.querySelector('p')?.textContent || 'news-index';
  const itemsPerPage = parseInt(itemsPerPageDiv?.querySelector('p')?.textContent, 10) || 3;
  const startIndex = parseInt(startIndexDiv?.querySelector('p')?.textContent, 10) || 0;
  const selectedTags = tagsDiv?.querySelector('p')?.textContent?.split(',') || [];

  // Clear block content
  block.textContent = '';

  // Fetch data
  const response = await fetch(`/${indexSource}.json?limit=${itemsPerPage}&offset=${startIndex}`);
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

  const SLIDES_PER_VIEW = 3;
  const totalGroups = Math.ceil(articles.length / SLIDES_PER_VIEW);

  // Create carousel structure
  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'slides-container';

  // Create slide groups
  for (let i = 0; i < articles.length; i += SLIDES_PER_VIEW) {
    const slideGroup = document.createElement('div');
    slideGroup.className = 'slide-group';

    // Add slides to group
    for (let j = i; j < i + SLIDES_PER_VIEW && j < articles.length; j += 1) {
      const article = articles[j];
      const slide = document.createElement('div');
      slide.className = 'slide';

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

      slide.innerHTML = `
          <a href="${article.path}" class="slide-content">
            ${image.outerHTML}
            <div class="slide-text">
              <h3>${article.title}</h3>
              <div class="slide-meta">
                ${authorHtml}
                ${publishDate ? `<p class="date">${publishDate}</p>` : ''}
              </div>
            </div>
          </a>
        `;

      slideGroup.appendChild(slide);
    }
    slidesContainer.appendChild(slideGroup);
  }

  // Only create navigation if there are multiple groups
  if (totalGroups > 1) {
    const nav = document.createElement('div');
    nav.className = 'carousel-nav';
    nav.innerHTML = `
        <button class="prev" aria-label="Previous slide group">←</button>
        <div class="dots"></div>
        <button class="next" aria-label="Next slide group">→</button>
      `;

    // Navigation dots
    const dots = nav.querySelector('.dots');
    for (let i = 0; i < totalGroups; i += 1) {
      const dot = document.createElement('button');
      dot.className = i === 0 ? 'dot active' : 'dot';
      dot.setAttribute('data-group', i);
      dot.setAttribute('aria-label', `Go to slide group ${i + 1}`);
      dots.appendChild(dot);
    }

    let currentGroup = 0;

    const updateSlides = () => {
      slidesContainer.style.transform = `translateX(-${currentGroup * 100}%)`;
      dots.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentGroup);
      });
    };

    // Event listeners
    nav.querySelector('.prev').addEventListener('click', () => {
      currentGroup = (currentGroup - 1 + totalGroups) % totalGroups;
      updateSlides();
    });

    nav.querySelector('.next').addEventListener('click', () => {
      currentGroup = (currentGroup + 1) % totalGroups;
      updateSlides();
    });

    dots.addEventListener('click', (e) => {
      if (e.target.classList.contains('dot')) {
        currentGroup = parseInt(e.target.dataset.group, 10);
        updateSlides();
      }
    });

    carousel.appendChild(slidesContainer);
    carousel.appendChild(nav);
    updateSlides();
  } else {
    // Single group, no navigation needed
    carousel.appendChild(slidesContainer);
  }

  block.appendChild(carousel);
}
