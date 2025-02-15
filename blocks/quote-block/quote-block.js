import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // Create wrapper
  const blockWrapper = document.createElement('div');
  blockWrapper.className = 'quote-block-wrapper';

  // Get content divs
  const [imageSection, contentSection] = [...block.children];

  if (imageSection && contentSection) {
    // Create image container
    const picture = imageSection.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimizedPicture = createOptimizedPicture(
          img.src,
          img.alt || '',
          false,
          [{ width: '400' }],
        );
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'quote-image';
        imageWrapper.appendChild(optimizedPicture);
        blockWrapper.appendChild(imageWrapper);
      }
    }

    // Create content container
    const paragraphs = contentSection.querySelectorAll('p');
    if (paragraphs.length) {
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'quote-content';

      // First two paragraphs are name and title
      const authorWrapper = document.createElement('div');
      authorWrapper.className = 'quote-author';

      if (paragraphs[0]) {
        const name = document.createElement('h3');
        name.textContent = paragraphs[0].textContent;
        authorWrapper.appendChild(name);
      }

      if (paragraphs[1]) {
        const title = document.createElement('p');
        title.textContent = paragraphs[1].textContent;
        authorWrapper.appendChild(title);
      }

      contentWrapper.appendChild(authorWrapper);

      // Remaining paragraphs form the quote
      if (paragraphs.length > 2) {
        const quoteText = Array.from(paragraphs)
          .slice(2)
          .map((p) => p.textContent)
          .filter(Boolean)
          .join(' ');

        const quote = document.createElement('blockquote');
        quote.className = 'quote-text';
        quote.innerHTML = `<p>${quoteText}</p>`;
        contentWrapper.appendChild(quote);
      }

      blockWrapper.appendChild(contentWrapper);
    }
  }

  // Clear block and append new structure
  block.textContent = '';
  block.appendChild(blockWrapper);
}
