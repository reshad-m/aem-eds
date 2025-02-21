import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

export default function decorate(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'profile';

  const topSection = document.createElement('div');
  topSection.className = 'profile-top';

  const [
    imageSection,
    infoSection,
    socialSection,
    inquirySection,
  ] = [...block.children];

  const picture = imageSection?.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'profile-image';
      const optimizedPicture = createOptimizedPicture(img.src, img.alt, false, [{ width: '336' }]);
      imageWrapper.appendChild(optimizedPicture);
      topSection.appendChild(imageWrapper);
    }
  }

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'profile-content';

  const infoWrapper = document.createElement('div');
  infoWrapper.className = 'profile-info';

  const paragraphs = infoSection?.querySelectorAll('p');
  if (paragraphs?.length) {
    const name = document.createElement('h1');
    name.className = 'profile-name';
    name.textContent = paragraphs[0].textContent;
    infoWrapper.appendChild(name);

    const role = document.createElement('p');
    role.className = 'profile-role';
    role.textContent = paragraphs[1].textContent;
    infoWrapper.appendChild(role);
  }

  contentWrapper.appendChild(infoWrapper);

  if (socialSection) {
    const socialLinks = socialSection.querySelector('p');
    if (socialLinks) {
      const socialWrapper = document.createElement('div');
      socialWrapper.className = 'profile-social';

      const cleanedHTML = socialLinks.innerHTML.replace(/<br\s*\/?>|\s+(?=<a)/g, '');
      socialWrapper.innerHTML = cleanedHTML;

      contentWrapper.appendChild(socialWrapper);
    }
  }

  topSection.appendChild(contentWrapper);
  wrapper.appendChild(topSection);

  const contactWrapper = document.createElement('div');
  contactWrapper.className = 'profile-actions';

  if (inquirySection && paragraphs?.[0]) {
    const firstName = paragraphs[0].textContent.split(' ')[0];
    const inquiryTag = inquirySection.querySelector('p')?.textContent;

    const contactButton = document.createElement('a');
    contactButton.className = 'button secondary';
    contactButton.href = `?${inquiryTag}`;
    contactButton.innerHTML = `
      <span class="icon icon-contact"></span>
      Contact ${firstName}
    `;
    contactWrapper.appendChild(contactButton);
  }

  if (paragraphs?.[2]) {
    const phones = paragraphs[2].textContent
      .split(',')
      .map((phone) => phone.trim())
      .filter(Boolean);

    phones.forEach((phone) => {
      const phoneButton = document.createElement('a');
      phoneButton.className = 'button secondary';
      phoneButton.href = `tel:${phone.replace(/\s/g, '')}`;
      phoneButton.innerHTML = `
        <span class="icon icon-phone"></span>
        ${phone}
      `;
      contactWrapper.appendChild(phoneButton);
    });
  }

  decorateIcons(contactWrapper);
  wrapper.appendChild(contactWrapper);

  block.textContent = '';
  block.appendChild(wrapper);
}
