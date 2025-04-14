import decorateSlider from '../../scripts/common/carousel.js';
import { loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function restructureTestimonials(block) {
  [...block.children].forEach((slide) => {
    const wrapper = document.createElement('div');
    moveInstrumentation(slide, wrapper);

    const divs = [...slide.children];
    divs.forEach((div) => {
      const children = [...div.children];
      children.forEach((child) => wrapper.append(child));
    });

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
