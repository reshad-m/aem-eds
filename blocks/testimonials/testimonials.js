import decorateSlider from '../../scripts/common/carousel.js';
import { loadCSS } from '../../scripts/aem.js';

export default async function decorate(block) {
  try {
    const newWrapper = document.createElement('div');
    
    [...block.children].forEach((row) => {
      const newRow = document.createElement('div');
      const contentDiv = document.createElement('div');
      [...row.children].forEach((div) => {
        const children = [...div.children];
        children.forEach(child => {
          contentDiv.append(child);
        });
      });
      
      newRow.append(contentDiv);
      newWrapper.append(newRow);
    });
    
    block.textContent = '';
    block.append(...newWrapper.children);
    await loadCSS(`${window.hlx.codeBasePath}/styles/common/carousel.css`);
    await decorateSlider(block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Failed to initialize testimonials carousel', error);
  }
}