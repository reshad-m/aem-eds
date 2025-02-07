import { moveInstrumentation as moveAemInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockGrid = document.createElement('div');
  blockGrid.className = 'cta-blocks-grid';

  // Process each CTA block
  [...block.children].forEach((row) => {
    const [
      imageDiv,
      headingDiv,
      descriptionDiv,
      ctaDiv,
      isFullWidthDiv,
      enableGradientDiv,
      isDarkThemeDiv,
    ] = [...row.children];

    // Create individual CTA block article
    const article = document.createElement('article');
    article.className = 'cta-block';
    moveAemInstrumentation(row, article);

    // Set data attributes for toggles
    const isFullWidth = isFullWidthDiv?.querySelector('p')?.textContent === 'true';
    const enableGradient = enableGradientDiv?.querySelector('p')?.textContent === 'true';
    const isDarkTheme = isDarkThemeDiv?.querySelector('p')?.textContent === 'true';

    if (isFullWidth) article.setAttribute('data-full-width', 'true');
    if (enableGradient) article.setAttribute('data-gradient', 'true');
    if (isDarkTheme) article.setAttribute('data-theme', 'dark');

    // Image background wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'cta-block-background';
    if (imageDiv?.querySelector('picture')) {
      imageWrapper.appendChild(imageDiv.querySelector('picture'));
    }
    article.appendChild(imageWrapper);

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'cta-block-content';

    // Heading group
    if (headingDiv) {
      const headingGroup = document.createElement('div');
      headingGroup.className = 'cta-block-headings';

      const [eyebrow, heading] = [...headingDiv.children];

      if (eyebrow) {
        const eyebrowText = document.createElement('p');
        eyebrowText.className = 'cta-block-eyebrow';
        eyebrowText.textContent = eyebrow.textContent;
        headingGroup.appendChild(eyebrowText);
      }

      if (heading) {
        headingGroup.appendChild(heading);
      }

      contentWrapper.appendChild(headingGroup);
    }

    // Description
    if (descriptionDiv?.firstElementChild) {
      const description = descriptionDiv.firstElementChild;
      description.className = 'cta-block-description';
      contentWrapper.appendChild(description);
    }

    // CTA Link
    if (ctaDiv?.firstElementChild) {
      const ctaLink = document.createElement('div');
      ctaLink.className = 'cta-block-link';
      ctaLink.appendChild(ctaDiv.firstElementChild);
      contentWrapper.appendChild(ctaLink);
    }

    article.appendChild(contentWrapper);
    blockGrid.appendChild(article);
  });

  // Replace original content
  block.textContent = '';
  block.appendChild(blockGrid);
}
