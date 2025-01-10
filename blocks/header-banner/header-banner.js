export default function decorate(block) {
  if (!block || block.children.length < 3) return;

  const [imageContainer, contentContainer, variantContainer] = block.children;

  imageContainer.className = 'images-wrapper';
  contentContainer.className = 'text-wrapper';

  if (contentContainer.children.length === 1 && !contentContainer.children[0].innerHTML.trim()) {
    block.removeChild(contentContainer);
  }

  if (contentContainer.children.length === 1) {
    contentContainer.children[0].className = 'text-container';
  }

  if (contentContainer.children.length === 1) {
    const variantValue = variantContainer.querySelector('p')?.textContent.trim().toLowerCase();
    const isVariantTwo = variantValue === 'true';

    if (isVariantTwo) {
      contentContainer.children[0].classList.add('variant-two');
    }

    block.removeChild(variantContainer);
  }

  const imageDivs = [...imageContainer.children];
  if (!imageDivs.length) return;

  imageContainer.innerHTML = '';

  const firstImageDiv = imageDivs[0];
  if (!firstImageDiv) return;

  const pictures = firstImageDiv.querySelectorAll('picture');

  if (pictures.length === 1) {
    const desktopPicture = pictures[0];
    desktopPicture.className = 'desktop-image';
    imageContainer.appendChild(desktopPicture);
  } else if (pictures.length === 2) {
    const [desktopPicture, mobilePicture] = pictures;
    desktopPicture.className = 'desktop-image';
    mobilePicture.className = 'mobile-image';
    imageContainer.appendChild(desktopPicture);
    imageContainer.appendChild(mobilePicture);
  }
}
