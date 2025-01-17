import { moveInstrumentation as moveAemInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Create grid container for cards
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'people-cards-grid';

  // Process each person card
  [...block.children].forEach((row) => {
    const [imageDiv, infoDiv, profileDiv, contactDiv] = [...row.children];

    // Create article element for the card
    const article = document.createElement('article');
    article.className = 'person-card';
    moveAemInstrumentation(row, article);

    // Image section
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'person-card-image';
    if (imageDiv?.querySelector('picture')) {
      imageWrapper.appendChild(imageDiv.querySelector('picture'));
    }
    article.appendChild(imageWrapper);

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'person-card-content';

    // Profile info section
    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'person-card-info';

    // Extract name and role from info div with safe fallbacks
    const infoTexts = [...(infoDiv?.querySelectorAll('p') || [])].map((p) => p?.textContent || '');
    const [firstName = '', lastName = '', jobRole = ''] = infoTexts;

    // Create name heading
    const nameHeading = document.createElement('h3');
    nameHeading.className = 'person-card-name';
    nameHeading.textContent = `${firstName} ${lastName}`.trim();

    // Create role paragraph
    const roleText = document.createElement('p');
    roleText.className = 'person-card-role';
    roleText.textContent = jobRole;

    infoWrapper.append(nameHeading, roleText);
    contentWrapper.appendChild(infoWrapper);

    // Profile link section
    const profileLink = profileDiv?.querySelector('a');
    if (profileLink) {
      profileLink.className = 'profile-link';

      // Add screen reader text
      const srText = document.createElement('span');
      srText.className = 'sr-only';
      srText.textContent = `of ${firstName} ${lastName}`;

      // Add arrow icon
      const iconSpan = document.createElement('span');
      iconSpan.className = 'profile-link-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = '→';

      profileLink.append(srText, iconSpan);
      contentWrapper.appendChild(profileLink);
    }

    // Contact section
    if (contactDiv) {
      const contactWrapper = document.createElement('div');
      contactWrapper.className = 'person-card-contact';

      const contactTexts = [...(contactDiv.querySelectorAll('p') || [])].map((p) => p?.textContent || '');
      const [email = '', phone = ''] = contactTexts;

      if (email) {
        // Create email link
        const emailLink = document.createElement('a');
        emailLink.className = 'contact-link';
        emailLink.href = `mailto:${email}`;

        const emailIcon = document.createElement('span');
        emailIcon.className = 'contact-icon';
        emailIcon.setAttribute('aria-hidden', 'true');
        emailIcon.textContent = '✉';

        emailLink.append(
          emailIcon,
          document.createTextNode(`Contact ${firstName}`),
        );
        contactWrapper.appendChild(emailLink);
      }

      if (phone) {
        // Create phone link
        const phoneLink = document.createElement('a');
        phoneLink.className = 'phone-link';
        const formattedPhone = phone.replace(/\s+/g, '-').replace(/[()]/g, '');
        phoneLink.href = `tel:${formattedPhone}`;

        const phoneIcon = document.createElement('span');
        phoneIcon.className = 'phone-icon';
        phoneIcon.setAttribute('aria-hidden', 'true');
        phoneIcon.textContent = '📞';

        const srPhone = document.createElement('span');
        srPhone.className = 'sr-only';
        srPhone.textContent = `Call ${firstName} ${lastName}`;

        phoneLink.append(
          phoneIcon,
          document.createTextNode(phone),
          srPhone,
        );
        contactWrapper.appendChild(phoneLink);
      }

      if (email || phone) {
        contentWrapper.appendChild(contactWrapper);
      }
    }

    article.appendChild(contentWrapper);
    cardsContainer.appendChild(article);
  });

  // Replace original content
  block.textContent = '';
  block.appendChild(cardsContainer);
}
