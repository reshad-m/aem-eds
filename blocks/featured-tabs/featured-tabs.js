import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const nav = document.createElement('nav');
  const tabList = document.createElement('ul');
  const tabPanels = document.createElement('div');

  nav.setAttribute('aria-label', 'Economic Reports');
  tabList.setAttribute('role', 'tablist');
  tabPanels.className = 'featured-tabs-panels';

  // Process each tab content
  [...block.children].forEach((row, index) => {
    // Use array destructuring for row children
    const [navTitleDiv, contentDiv, imageDiv, enableGradientDiv] = [...row.children];

    // Create tab button
    const tabItem = document.createElement('li');
    const button = document.createElement('button');
    moveInstrumentation(row, button);

    button.textContent = navTitleDiv?.querySelector('p')?.textContent?.trim();
    button.setAttribute('role', 'tab');
    button.id = `tab-${index}`;
    button.setAttribute('aria-controls', `panel-${index}`);
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    if (index !== 0) button.setAttribute('tabindex', '-1');

    tabItem.append(button);
    tabList.append(tabItem);

    // Create panel
    const panel = document.createElement('section');
    moveInstrumentation(row, panel);

    panel.setAttribute('role', 'tabpanel');
    panel.id = `panel-${index}`;
    panel.setAttribute('aria-labelledby', `tab-${index}`);
    if (index !== 0) panel.hidden = true;

    // Move content to panel
    if (contentDiv) {
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'featured-tabs-content';
      
      // Move all elements from contentDiv to contentWrapper
      while (contentDiv.firstChild) {
        if (contentDiv.firstChild.tagName === 'H2') {
          // Move h2 attributes
          const h2 = contentDiv.firstChild;
          contentWrapper.appendChild(h2);
        } else {
          contentWrapper.appendChild(contentDiv.firstChild);
        }
      }
      panel.append(contentWrapper);
    }

    // Handle image
    if (imageDiv) {
      const picture = imageDiv.querySelector('picture');
      if (picture) {
        const pictureWrapper = document.createElement('div');
        pictureWrapper.className = 'featured-tabs-image';
        
        // Add gradient class if enabled
        const enableGradient = enableGradientDiv?.querySelector('p')?.textContent === 'true';
        if (enableGradient) {
          pictureWrapper.classList.add('gradient-overlay');
        }
        
        pictureWrapper.append(picture);
        panel.append(pictureWrapper);
      }
    }

    tabPanels.append(panel);
  });

  // Event handlers
  function switchTab(newTab) {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    tabs.forEach((tab) => {
      const selected = tab === newTab;
      tab.setAttribute('aria-selected', selected);
      tab.setAttribute('tabindex', selected ? '0' : '-1');
    });

    const panels = tabPanels.querySelectorAll('[role="tabpanel"]');
    panels.forEach((panel) => {
      if (panel.id !== newTab.getAttribute('aria-controls')) {
        panel.setAttribute('hidden', '');
      } else {
        panel.removeAttribute('hidden');
      }
    });

    newTab.focus();
  }

  // Click handling
  tabList.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (!tab) return;

    switchTab(tab);
  });

  // Keyboard navigation
  tabList.addEventListener('keydown', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (!tab) return;

    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(tab);

    let newTab;
    switch (e.key) {
      case 'ArrowLeft': {
        const [previousTab = tabs[tabs.length - 1]] = tabs.slice(index - 1, index);
        newTab = previousTab;
        break;
      }
      case 'ArrowRight': {
        const [nextTab = tabs[0]] = tabs.slice(index + 1, index + 2);
        newTab = nextTab;
        break;
      }
      case 'Home': {
        const [firstTab] = tabs;
        newTab = firstTab;
        break;
      }
      case 'End': {
        const [lastTab] = tabs.slice(-1);
        newTab = lastTab;
        break;
      }
      default:
        return;
    }

    e.preventDefault();
    switchTab(newTab);
  });

  nav.append(tabList);
  block.textContent = '';
  block.append(nav);
  block.append(tabPanels);
}