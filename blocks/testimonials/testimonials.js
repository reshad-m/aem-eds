import decorateSlider from '../../scripts/common/carousel.js';
import { loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function restructureTestimonials(block) {
  [...block.children].forEach((slide) => {
    const wrapper = document.createElement('div');
    moveInstrumentation(slide, wrapper);

    const divs = [...slide.children];
    divs.forEach((div, index) => {
      const children = [...div.children];
      if (index === 0) {
        // first div contains the heading
        children.forEach((child) => wrapper.append(child));
      } else {
        // other divs contain paragraphs
        children.forEach((child) => wrapper.append(child));
      }
    });

    // Clear original and add new structure
    slide.innerHTML = '';
    slide.append(wrapper);
  });
}

export default async function decorate(block) {
  try {
    restructureTestimonials(block);
    await loadCSS(`${window.hlx.codeBasePath}/styles/common/carousel.css`);
    await decorateSlider(block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Failed to initialize testimonials carousel', error);
  }
}
