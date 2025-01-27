import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  console.log(block);
  // Fetch and parse news data
  const response = await fetch('/news-index.json');
  const json = await response.json();

  const articles = json.data
    .filter((item) => item.path.startsWith('/news/') && item.path !== '/news/')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Create carousel structure
  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'slides-container';

  // Build slides
  articles.forEach((article, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.setAttribute('data-slide', index);

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

    slidesContainer.appendChild(slide);
  });

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.innerHTML = `
    <button class="prev" aria-label="Previous slide">←</button>
    <div class="dots"></div>
    <button class="next" aria-label="Next slide">→</button>
  `;

  // Navigation dots
  const dots = nav.querySelector('.dots');
  articles.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('data-slide', index);
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dots.appendChild(dot);
  });

  // Handle slide changes
  let currentSlide = 0;
  const updateSlides = () => {
    slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.querySelectorAll('.dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  };

  // Event listeners
  nav.querySelector('.prev').addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + articles.length) % articles.length;
    updateSlides();
  });

  nav.querySelector('.next').addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % articles.length;
    updateSlides();
  });

  dots.addEventListener('click', (e) => {
    if (e.target.classList.contains('dot')) {
      currentSlide = parseInt(e.target.dataset.slide, 10);
      updateSlides();
    }
  });

  // Auto advance
  const autoAdvance = setInterval(() => {
    currentSlide = (currentSlide + 1) % articles.length;
    updateSlides();
  }, 5000);

  // Pause auto-advance on hover
  carousel.addEventListener('mouseenter', () => clearInterval(autoAdvance));
  carousel.addEventListener('mouseleave', () => {
    setInterval(() => {
      currentSlide = (currentSlide + 1) % articles.length;
      updateSlides();
    }, 5000);
  });

  // Assemble carousel
  carousel.appendChild(slidesContainer);
  carousel.appendChild(nav);
  block.appendChild(carousel);

  // Initialize
  updateSlides();
}
