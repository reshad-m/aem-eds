export default function decorate(block) {
  const [imagesWrapper, textWrapper] = block.children;

  imagesWrapper.className = 'images-wrapper';
  textWrapper.className = 'text-wrapper';
  if (textWrapper.children.length === 1) textWrapper.children[0].className = 'text-container';

  if (textWrapper.children.length === 1 && textWrapper.children[0].innerHTML.trim() === '') {
    block.removeChild(textWrapper);
  }

  [...imagesWrapper.children].forEach((div) => {
    if (div.children.length === 1 && div.querySelector('picture')) {
      const picture = div.querySelector('picture');
      const desktopImage = picture;
      desktopImage.className = 'desktop-image';
      imagesWrapper.innerHTML = '';
      imagesWrapper.appendChild(desktopImage);
    }
    if (div.children.length === 2 && div.querySelector('picture')) {
      const desktopImage = div.children[0].querySelector('picture');
      const mobileImage = div.children[1].querySelector('picture');
      desktopImage.className = 'desktop-image';
      mobileImage.className = 'mobile-image';
      imagesWrapper.innerHTML = '';
      imagesWrapper.appendChild(desktopImage);
      imagesWrapper.appendChild(mobileImage);
    }
  });
}
