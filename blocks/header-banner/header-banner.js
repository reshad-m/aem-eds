export default function decorate(block) {
  if (!block) return;
  const [imagesWrapper, textWrapper] = block.children;

  if (!imagesWrapper || !textWrapper) return;

  imagesWrapper.className = 'images-wrapper';
  textWrapper.className = 'text-wrapper';

  if (textWrapper.children.length === 1 && textWrapper.children[0].innerHTML.trim() === '') {
    block.removeChild(textWrapper);
  }

  if (textWrapper.children.length === 1) {
    textWrapper.children[0].className = 'text-container';
  }

  const imageDivs = [...imagesWrapper.children];

  imageDivs.forEach((div) => {
    if (div.children.length === 1 && div.querySelector('picture')) {
      const picture = div.querySelector('picture');
      picture.className = 'desktop-image';

      imagesWrapper.innerHTML = '';
      imagesWrapper.appendChild(picture);
    }

    if (div.children.length === 2 && div.querySelector('picture')) {
      const desktopImage = div.children[0].querySelector('picture');
      const mobileImage = div.children[1].querySelector('picture');

      if (desktopImage) desktopImage.className = 'desktop-image';
      if (mobileImage) mobileImage.className = 'mobile-image';

      imagesWrapper.innerHTML = '';
      if (desktopImage) imagesWrapper.appendChild(desktopImage);
      if (mobileImage) imagesWrapper.appendChild(mobileImage);
    }
  });
}
