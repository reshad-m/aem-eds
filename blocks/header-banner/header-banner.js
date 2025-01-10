export default function decorate(block) {
  if (!block || block.children.length < 2) return;

  const [imagesWrapper, textWrapper] = block.children;
  imagesWrapper.className = 'images-wrapper';
  textWrapper.className = 'text-wrapper';

  if (textWrapper.children.length === 1 && !textWrapper.children[0].innerHTML.trim()) {
    block.removeChild(textWrapper);
  }

  if (textWrapper.children.length === 1) {
    textWrapper.children[0].className = 'text-container';
  }

  const images = [...imagesWrapper.children];
  if (!images.length) return;

  imagesWrapper.innerHTML = '';

  const firstDiv = images[0];
  if (!firstDiv) return;

  const pictures = firstDiv.querySelectorAll('picture');

  if (pictures.length === 1) {
    const desktopImage = pictures[0];
    desktopImage.className = 'desktop-image';
    imagesWrapper.appendChild(desktopImage);
  } else if (pictures.length === 2) {
    const [desktopImage, mobileImage] = pictures;
    desktopImage.className = 'desktop-image';
    mobileImage.className = 'mobile-image';
    imagesWrapper.appendChild(desktopImage);
    imagesWrapper.appendChild(mobileImage);
  }
}
