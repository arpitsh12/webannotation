// Helper function to insert a single annotation
const insertAnnotation = (annotation) => {
  console.log('Inserting annotation:', annotation);
  const temporaryDiv = document.createElement('div');
  temporaryDiv.innerHTML = annotation.html;
  const newElement = temporaryDiv.firstChild;

  // Create and style the note element
  const noteDiv = document.createElement('div');
  noteDiv.className = 'sticky-note';
  noteDiv.textContent = annotation.note;
  noteDiv.style.position = 'absolute';
  noteDiv.style.backgroundColor = '#ffeb3b';
  noteDiv.style.border = '1px solid #000';
  noteDiv.style.padding = '5px';
  noteDiv.style.zIndex = '9999';
  noteDiv.style.display = 'none';
  noteDiv.style.whiteSpace = 'pre-wrap';

  // Show note on mouse enter and hide on mouse leave
  newElement.addEventListener('mouseenter', () => {
    noteDiv.style.display = 'block';
  });
  newElement.addEventListener('mouseleave', () => {
    noteDiv.style.display = 'none';
  });

  document.body.appendChild(noteDiv);

  // Position the note next to the highlighted text
  const rect = newElement.getBoundingClientRect();
  noteDiv.style.top = `${rect.top + window.scrollY}px`;
  noteDiv.style.left = `${rect.right + window.scrollX}px`;

  // Replace text with annotated element in the document
  const nodes = document.body.querySelectorAll("*");
  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.innerHTML.includes(newElement.textContent)) {
      node.innerHTML = node.innerHTML.replace(newElement.textContent, newElement.outerHTML);
    }
  });
};

// Function to load and apply all annotations for the current page
const loadAllAnnotations = () => {
  console.log('Loading annotations for:', window.location.href);
  chrome.storage.local.get({ annotations: [] }, (data) => {
    const currentPageAnnotations = data.annotations.filter(ann => ann.page === window.location.href);
    console.log('Annotations found:', currentPageAnnotations);
    currentPageAnnotations.forEach(insertAnnotation);
  });
};

// Execute loadAllAnnotations when the page loads
window.addEventListener('load', loadAllAnnotations);

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlightSearchResults') {
    highlightSearchResults(request.query);
  }
});

// Function to highlight search results
const highlightSearchResults = (query) => {
  const annotations = document.querySelectorAll('.highlighted-text');
  annotations.forEach(annotation => {
    if (annotation.getAttribute('data-note').toLowerCase().includes(query) ||
        annotation.getAttribute('data-highlight').toLowerCase().includes(query)) {
      annotation.style.border = '2px solid red';
    } else {
      annotation.style.border = 'none';
    }
  });
};
  