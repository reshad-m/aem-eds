import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
    // Extract data before clearing the block
    const cardElements = Array.from(block.children); // Top-level card elements in the block

    // Clear the block content
    block.innerHTML = '';

    // Create a column
    const widthHalf = document.createElement('div');
    widthHalf.classList.add('w-50');

    // Create the list cards section
    const listCardsContainer = document.createElement('div');
    listCardsContainer.classList.add('list-cards-container');

    // Process each card element
    cardElements.forEach((cardElement) => {
        const cardRow = document.createElement('div');
        cardRow.classList.add('list-card');

        // Extract and clone the <picture> element
        const pictureElement = cardElement.querySelector('picture');
        const cardImg = document.createElement('div');
        cardImg.classList.add('list-card-img');
        if (pictureElement) {
            cardImg.appendChild(pictureElement.cloneNode(true)); // Clone the <picture> element
        }

        // Extract the label (second div after <picture>)
        const labelElement = cardElement.querySelector('div:nth-child(2) > p');
        const label = labelElement ? labelElement.textContent : '';

        const cardInfo = document.createElement('div');
        cardInfo.classList.add('list-card-info');

        const span = document.createElement('span');
        span.textContent = label;

        // Extract the title (third div after <picture>)
        const titleElement = cardElement.querySelector('div:nth-child(3) > p');
        const title = titleElement ? titleElement.textContent : '';

        const h3 = document.createElement('h3');
        h3.textContent = title;

        cardInfo.appendChild(span);
        cardInfo.appendChild(h3);

        // Extract the link (fourth div after <picture>)
        const linkElement = cardElement.querySelector('div:nth-child(4) > p > a');
        const linkHref = linkElement ? linkElement.getAttribute('href') : '#';

        // Create the card action section
        const cardAction = document.createElement('div');
        cardAction.classList.add('list-card-action');

        const link = document.createElement('a');
        link.setAttribute('href', linkHref);

        // Extract and clone the SVG from the fifth div
        const svgElement = cardElement.querySelector('div:nth-child(5) > p > span');
        if (svgElement) {
            link.appendChild(svgElement.cloneNode(true)); // Clone the entire span containing the SVG
        }

        cardAction.appendChild(link);

        cardRow.appendChild(cardImg);
        cardRow.appendChild(cardInfo);
        cardRow.appendChild(cardAction);

        listCardsContainer.appendChild(cardRow);
    });

    const allInsightsLink = document.createElement('a');
    allInsightsLink.classList.add('button', 'primary');
    allInsightsLink.setAttribute('href', '#');
    allInsightsLink.textContent = 'All of our insights';

    listCardsContainer.appendChild(allInsightsLink);
    widthHalf.appendChild(listCardsContainer);

    // Append the columns directly to the block
    block.appendChild(widthHalf);
}
