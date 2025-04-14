import decorateSlider from '../../scripts/common/carousel.js';
import { loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  try {
    const container = document.createElement('div');
    [...block.children].forEach((row) => {
      const testimonial = document.createElement('div');
      const content = document.createElement('div');
      moveInstrumentation(row, testimonial);
      [...row.children].forEach((div) => {
        content.appendChild(div.firstElementChild);
        moveInstrumentation(div, content);

      });
      testimonial.appendChild(content);
      container.appendChild(testimonial);
    });
    console.log('Block:', block);
    console.log('Container:', container);
    block.textContent = '';
    block.append(...container.children);
    await loadCSS(`${window.hlx.codeBasePath}/styles/common/carousel.css`);
    await decorateSlider(block);
  } catch (error) {
    // eslint-disable-next-line no-console
  }
}
