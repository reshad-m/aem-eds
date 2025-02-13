import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Extract author tags
  const authorTags = block.querySelector('p')?.textContent || '';
  const authorNames = authorTags
    .split(',')
    .map((tag) => tag.replace('authors:', '').trim())
    .filter(Boolean);

  if (!authorNames.length) return;

  // Clear block content
  block.textContent = '';

  try {
    // Fetch author data
    const response = await fetch('/our-people-index.json');
    const json = await response.json();

    // Create authors grid
    const grid = document.createElement('div');
    grid.className = 'authors-grid';

    // Filter and map author data
    const authors = authorNames
      .map((authorName) => json.data.find(
        (person) => person.path && person.path.endsWith(authorName),
      ))
      .filter(Boolean);

    authors.forEach((author) => {
      const authorCard = document.createElement('div');
      authorCard.className = 'author-card';

      // Create image
      const image = createOptimizedPicture(
        author.image,
        author.name,
        false,
        [{ width: '400' }],
      );
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'author-image';
      imageWrapper.appendChild(image);

      // Create content section
      const content = document.createElement('div');
      content.className = 'author-content';

      // Split name if available
      const fullName = author.name || '';

      content.innerHTML = `
        <h3 class="author-name">${fullName}</h3>
        ${author.jobRole ? `<p class="author-role">${author.jobRole}</p>` : ''}
        ${author.path ? `<a href="${author.path}" class="author-profile-link">View profile</a>` : ''}
        <div class="author-contact">
          ${author.phone ? `
            <a href="tel:${author.phone.split(',')[0].trim()}" class="author-phone">
              <span class="icon-phone" aria-hidden="true">📞</span>
              ${author.phone.split(',')[0].trim()}
            </a>
          ` : ''}
          ${author.socialLinks ? `
            <a href="mailto:${author.socialLinks}" class="author-email">
              <span class="icon-email" aria-hidden="true">✉</span>
              Contact ${fullName.split(' ')[0]}
            </a>
          ` : ''}
        </div>
      `;

      // Assemble card
      authorCard.appendChild(imageWrapper);
      authorCard.appendChild(content);
      grid.appendChild(authorCard);
    });

    block.appendChild(grid);
  } catch (error) {
    console.error('Error loading authors:', error);
  }
}
