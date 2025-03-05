import { createOptimizedPicture, fetchPlaceholders } from '../../scripts/aem.js';
import { findByPathEnd } from '../../scripts/fetch-index.js';

const PEOPLE_INDEX_PATH = 'our-people-index';
const CONTACT_US = 'contact-us';

function createAuthorProfile(author, placeholders = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'author';

  const profileWrapper = document.createElement('div');
  profileWrapper.className = 'profile';

  const topSection = document.createElement('div');
  topSection.className = 'profile-top';

  if (author.image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'profile-image';
    const optimizedPicture = createOptimizedPicture(author.image, author.name, false, [{ width: '336' }]);
    imageWrapper.appendChild(optimizedPicture);
    topSection.appendChild(imageWrapper);
  }

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'profile-content';

  const infoWrapper = document.createElement('div');
  infoWrapper.className = 'profile-info';

  const name = document.createElement('h2');
  name.className = 'profile-name';
  name.textContent = author.name;
  infoWrapper.appendChild(name);

  if (author.jobRole) {
    const role = document.createElement('p');
    role.className = 'profile-role';
    role.textContent = author.jobRole;
    infoWrapper.appendChild(role);
  }

  contentWrapper.appendChild(infoWrapper);

  if (author.path) {
    const viewProfileWrapper = document.createElement('div');
    viewProfileWrapper.className = 'profile-view';

    const viewProfileLink = document.createElement('a');
    viewProfileLink.className = 'link tertiary';
    viewProfileLink.href = author.path;
    const viewProfileText = placeholders.viewProfile || 'View profile';
    viewProfileLink.innerHTML = `
      ${viewProfileText}
      <span class="icon icon-right"></span>
    `;

    viewProfileWrapper.appendChild(viewProfileLink);
    contentWrapper.appendChild(viewProfileWrapper);
  }

  topSection.appendChild(contentWrapper);
  profileWrapper.appendChild(topSection);

  const contactWrapper = document.createElement('div');
  contactWrapper.className = 'profile-actions';

  const firstName = author.name.split(' ')[0];
  const inquiryTag = author.enquiryCategory.split(':')[1] || '';

  const contactButton = document.createElement('a');
  contactButton.className = 'button secondary';
  contactButton.href = `${CONTACT_US}?etype=${inquiryTag}&profile=${author.name}`;
  contactButton.innerHTML = `
    <span class="icon icon-mail"></span>
    Contact ${firstName}
  `;
  contactWrapper.appendChild(contactButton);

  if (author.phone) {
    const phones = author.phone
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

  profileWrapper.appendChild(contactWrapper);
  wrapper.appendChild(profileWrapper);

  return wrapper;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const [authorIdsDiv] = [...block.children];
  const authorIdsText = authorIdsDiv?.querySelector('p')?.textContent || '';
  const authorIds = authorIdsText
    .split(',')
    .map((id) => {
      const parts = id.trim().split(':');
      return parts.length > 1 ? parts[1].trim() : id.trim();
    });

  const authorPromises = authorIds.map(async (authorId) => {
    const author = await findByPathEnd(PEOPLE_INDEX_PATH, authorId);
    if (!author) return null;
    return createAuthorProfile(author, placeholders);
  });

  const authorProfiles = await Promise.all(authorPromises);

  block.textContent = '';

  authorProfiles.filter((profile) => profile !== null)
    .forEach((profile) => block.appendChild(profile));

  if (authorProfiles.filter((profile) => profile !== null).length === 1) {
    block.classList.add('single-author');
  }
}
