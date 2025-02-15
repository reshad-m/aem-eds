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
    const [name, title, quote] = contentSection.querySelectorAll('p');
    if (name && title && quote) {
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'quote-content';

      // Author info
      const authorWrapper = document.createElement('div');
      authorWrapper.className = 'quote-author';

      const nameHeading = document.createElement('h3');
      nameHeading.textContent = name.textContent;
      authorWrapper.appendChild(nameHeading);

      const titlePara = document.createElement('p');
      titlePara.textContent = title.textContent;
      authorWrapper.appendChild(titlePara);

      contentWrapper.appendChild(authorWrapper);

      // Quote text
      const quoteBlock = document.createElement('blockquote');
      quoteBlock.className = 'quote-text';
      const quotePara = document.createElement('p');
      quotePara.textContent = quote.textContent;
      quoteBlock.appendChild(quotePara);
      contentWrapper.appendChild(quoteBlock);

      blockWrapper.appendChild(contentWrapper);
    }
  }

  // Clear block and append new structure
  block.textContent = '';
  block.appendChild(blockWrapper);
}
