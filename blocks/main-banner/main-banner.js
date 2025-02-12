export default function decorate(block) {
  const [bg, fg] = block.children;
  bg.className = 'background';
  fg.className = 'content-holder';

  const [desktop, mobile] = bg.firstElementChild.children;
  desktop.className = 'desktop-image';
  mobile.className = 'mobile-image';

  const images = bg.querySelectorAll('img');
  images.forEach((element) => {
    // dev tools performance tab recommends not lazy loading for LCP candidate.
    element.removeAttribute('loading');
  });

  window.addEventListener('breadcrumbs-rendered', () => {
    const breadcrumbs = document.querySelector('nav.breadcrumbs');

    if (breadcrumbs) {
      block.appendChild(breadcrumbs);
    }
  });
}
