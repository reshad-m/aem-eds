import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
    [...block.children].map((child) => {
        child.className = 'list-card-row';

        child.querySelectorAll('picture > img').forEach((img) => {
            const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
            moveInstrumentation(img, optimizedPic.querySelector('img'));
            img.closest('div').className = 'list-card-img';
            img.closest('picture').replaceWith(optimizedPic);
        });

        const imgDiv = child.querySelector('.list-card-img');
        const childDivs = Array.from(child.children).filter(div => div !== imgDiv);
        const pDivs = childDivs;
        if (pDivs.length >= 2) {
            const firstP = pDivs[0].querySelector('p');
            const firstText = firstP.textContent.trim();

            const secondP = pDivs[1].querySelector('p');
            const secondText = secondP.textContent.trim();
        
            

            const aTag = child.querySelector('div > p > a');
            const imgTag = child.querySelector('div > p > span');
           
            aTag.textContent = null;
            aTag.appendChild(imgTag)
            const linkDiv = document.createElement('div');
            linkDiv.appendChild(aTag);
            linkDiv.className = 'list-card-action';
        

            // Create the new .optimize div
            const optimizeDiv = document.createElement('div');
            optimizeDiv.className = 'list-card-info';

            // Create the <span> element and assign the secondText
            const span = document.createElement('span');
            span.textContent = firstText;

            // Create the <h3> element and assign the firstText
            const h3 = document.createElement('h3');
            h3.textContent = secondText;

            // Append <span> and <h3> to .optimize div
            optimizeDiv.appendChild(span);
            optimizeDiv.appendChild(h3);

            child.insertBefore(optimizeDiv, imgDiv.nextSibling);
            child.appendChild(linkDiv);
            pDivs.forEach(div => div.remove());
        }
        
        
    })
}