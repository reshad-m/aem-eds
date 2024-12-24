export default function decorate(block) {
  const childDivs = [...block.children];

  if (childDivs.length === 0) return; // Ensure there are children to work with

  childDivs.forEach((innerDiv) => {
    const cols = [...innerDiv.children];

    if (cols.length === 0) return; // Ensure there are children to work with

    // Access the last div and get its innerText
    const lastDiv = cols[cols.length - 1];
    const value = lastDiv.innerText.trim(); // Trim to ensure no whitespace issues

    // Set the width of the first child div based on the value
    if (value === '100') {
      innerDiv.style.width = '100%';
    } else if (value === '50') {
      innerDiv.style.width = '50%';
    }

    // Remove the last div from the inner div
    lastDiv.remove();
  });
}
