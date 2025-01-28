import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Extract values from the nested structure
  const [targetDiv, limitDiv] = [...block.children];
  const target = targetDiv?.querySelector('p')?.textContent || '';
  const limit = limitDiv?.querySelector('p')?.textContent || '';

  const targetValue = target || '';
  const limitValue = parseInt(limit, 10) || 3;

  // Remove both configuration divs from the block
  targetDiv?.remove();
  limitDiv?.remove();

  // Fetch and parse news data
  // const response = await fetch('/news-index.json');
  const response = await fetch(`/${targetValue}.json?limit=${limitValue}`);
  const json = await response.json();

  const articles = json.data
    .filter((item) => item.path.startsWith('/news/') && item.path !== '/news/')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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

      const image = createOptimizedPicture(article.image, article.title);

      slide.innerHTML = `
        <a href="${article.path}" class="slide-content">
          ${image.outerHTML}
          <div class="slide-text">
            <h3>${article.title}</h3>
            <p class="author">${article.author || ''}</p>
            <p class="date">${article.date || ''}</p>
          </div>
        </a>
      `;

      slideGroup.appendChild(slide);
    }

    slidesContainer.appendChild(slideGroup);
  }

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.innerHTML = `
    <button class="prev" aria-label="Previous slide group">←</button>
    <div class="dots"></div>
    <button class="next" aria-label="Next slide group">→</button>
  `;

  // Navigation dots (one per group)
  const dots = nav.querySelector('.dots');
  for (let i = 0; i < totalGroups; i += 1) {
    const dot = document.createElement('button');
    dot.className = 'dot';
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

  // Auto advance
  const autoAdvance = setInterval(() => {
    currentGroup = (currentGroup + 1) % totalGroups;
    updateSlides();
  }, 5000);

  carousel.addEventListener('mouseenter', () => clearInterval(autoAdvance));
  carousel.addEventListener('mouseleave', () => {
    setInterval(() => {
      currentGroup = (currentGroup + 1) % totalGroups;
      updateSlides();
    }, 5000);
  });

  carousel.appendChild(slidesContainer);
  carousel.appendChild(nav);
  block.appendChild(carousel);

  updateSlides();
}
