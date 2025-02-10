import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Create outer and inner wrappers
  const outerWrapper = document.createElement('div');
  outerWrapper.className = 'multi-link-block-outer';

  const innerWrapper = document.createElement('div');
  innerWrapper.className = 'multi-link-block-inner';

  // Process text content and image sections
  const [textContent, imageContent] = block.children;

  // Text content section
  if (textContent) {
    const textSection = document.createElement('div');
    textSection.className = 'multi-link-block-text';

    // Move and structure content
    const textContainer = textContent.querySelector('div');
    if (textContainer) {
      // Title - already an h2
      const title = textContainer.querySelector('h2');
      if (title) {
        moveInstrumentation(title.parentElement, title);
        textSection.appendChild(title);
      }

      // Description
      const description = textContainer.querySelector('p');
      if (description) {
        moveInstrumentation(description.parentElement, description);
        textSection.appendChild(description);
      }

      // Links
      const linksList = textContainer.querySelector('ul');
      if (linksList) {
        const nav = document.createElement('nav');
        nav.className = 'multi-link-block-nav';
        nav.setAttribute('aria-label', 'Related links');

        moveInstrumentation(linksList.parentElement, nav);
        nav.appendChild(linksList);
        textSection.appendChild(nav);
      }
    }

    innerWrapper.appendChild(textSection);
  }

  // Image section
  if (imageContent) {
    const imageSection = document.createElement('div');
    imageSection.className = 'multi-link-block-image';

    const picture = imageContent.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimizedPicture = createOptimizedPicture(
          img.src,
          img.alt,
          false,
          [{ width: '750' }],
        );
        moveInstrumentation(picture, optimizedPicture);
        imageSection.appendChild(optimizedPicture);
      }
    }

    innerWrapper.appendChild(imageSection);
  }

  // Clear and append new structure
  outerWrapper.appendChild(innerWrapper);
  block.textContent = '';
  block.appendChild(outerWrapper);
}
