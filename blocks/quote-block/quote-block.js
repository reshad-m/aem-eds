import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Create quote figure container
  const figure = document.createElement('figure');
  figure.className = 'quote-block-figure';

  // Extract content from block
  const [quoteContent, authorContent] = [...block.children];

  // Create and populate blockquote
  if (quoteContent) {
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'quote-block-quote';
    const quoteText = quoteContent.querySelector('p');
    if (quoteText) {
      moveInstrumentation(quoteContent, blockquote);
      blockquote.appendChild(quoteText);
    }
    figure.appendChild(blockquote);
  }

  // Create and populate author figcaption
  if (authorContent) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'quote-block-author';

    const authorInfo = authorContent.querySelector('div');
    if (authorInfo) {
      // Handle author image
      const picture = authorInfo.querySelector('picture');
      if (picture) {
        const img = picture.querySelector('img');
        if (img) {
          const imageWrapper = document.createElement('div');
          imageWrapper.className = 'quote-block-author-image';
          const optimizedPicture = createOptimizedPicture(
            img.src,
            img.alt,
            false,
            [{ width: '400' }]
          );
          moveInstrumentation(picture, optimizedPicture);
          imageWrapper.appendChild(optimizedPicture);
          figcaption.appendChild(imageWrapper);
        }
      }

      // Handle author information
      const authorDetails = document.createElement('div');
      authorDetails.className = 'quote-block-author-info';

      // Get author paragraphs (skip the first one as it contains the picture)
      const [, authorName, authorTitle] = [...authorInfo.querySelectorAll('p')];

      if (authorName) {
        const cite = document.createElement('cite');
        cite.className = 'quote-block-author-name';
        cite.textContent = authorName.textContent;
        authorDetails.appendChild(cite);
      }

      if (authorTitle) {
        const title = document.createElement('p');
        title.className = 'quote-block-author-title';
        title.textContent = authorTitle.textContent;
        authorDetails.appendChild(title);
      }

      figcaption.appendChild(authorDetails);
    }

    figure.appendChild(figcaption);
  }

  // Clear and append new structure
  block.textContent = '';
  block.appendChild(figure);
}