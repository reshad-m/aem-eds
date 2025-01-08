export default function decorate(block) {
  const [imagesWrapper, textWrapper] = block.children;

  imagesWrapper.className = 'images-wrapper';
  textWrapper.className = 'text-wrapper';

  const pictureElements = imagesWrapper.querySelectorAll('p picture');
  const desktopImage = pictureElements[0];
  const mobileImage = pictureElements[1];

  desktopImage.classList.add('desktop-image-wrapper');
  mobileImage.classList.add('mobile-image-wrapper');

  imagesWrapper.innerHTML = '';
  imagesWrapper.appendChild(desktopImage);
  imagesWrapper.appendChild(mobileImage);
}
