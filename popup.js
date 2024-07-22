document.addEventListener('DOMContentLoaded', () => {
    const colorButtons = document.querySelectorAll('.highlight-color');
    let chosenColor = 'yellow';
    let activeButton = null;
  
    colorButtons.forEach(button => {
      button.addEventListener('click', () => {
        chosenColor = button.getAttribute('data-color');
        console.log('Chosen color:', chosenColor);
  
        // Remove border from the previously active button
        if (activeButton) {
          activeButton.style.border = 'none';
        }
  
        // Add border to the currently active button
        button.style.border = '2px solid black';
        activeButton = button;
      });
    });
  
    document.getElementById('save-note').addEventListener('click', () => {
      const noteContent = document.getElementById('note-text').value;
      console.log('Note content:', noteContent);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (color, note) => {
            console.log('Color:', color, 'Note:', note);
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const span = document.createElement('span');
              span.style.backgroundColor = color;
              span.className = `highlighted-text web-annotator-highlight-${color}`;
              span.setAttribute('data-note', note);
              span.setAttribute('data-highlight', selection.toString());
              range.surroundContents(span);
  
              // Save annotation
              const annotationData = {
                html: span.outerHTML,
                note: note,
                highlight: selection.toString(),
                page: window.location.href,
                color: color,
                timestamp: new Date().toISOString()
              };
  
              chrome.storage.local.get({ annotations: [] }, (data) => {
                const annotationsList = data.annotations;
                annotationsList.push(annotationData);
                chrome.storage.local.set({ annotations: annotationsList }, () => {
                  console.log('Annotation saved:', annotationData);
                });
              });
            }
          },
          args: [chosenColor, noteContent]
        });
      });
    });
  
    document.getElementById('search-annotations').addEventListener('click', () => {
      const searchTerm = document.getElementById('search-query').value.toLowerCase();
      chrome.storage.local.get({ annotations: [] }, (data) => {
        const matchingAnnotations = data.annotations.filter(annotation => 
          annotation.note.toLowerCase().includes(searchTerm) ||
          annotation.highlight.toLowerCase().includes(searchTerm) ||
          annotation.page.toLowerCase().includes(searchTerm)
        );
        showSearchResults(matchingAnnotations);
  
        // Send query to content script to highlight search results
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightSearchResults', query: searchTerm });
        });
      });
    });
  
    const showSearchResults = (results) => {
      const resultsContainer = document.getElementById('search-results');
      resultsContainer.innerHTML = '';
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
        return;
      }
      results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.innerHTML = `<p>${result.note}</p><p><a href="${result.page}" target="_blank">${result.page}</a></p>`;
        resultsContainer.appendChild(resultElement);
      });
    };
  
    // Export annotations to PDF
    document.getElementById('export-pdf').addEventListener('click', () => {
      chrome.storage.local.get({ annotations: [] }, (data) => {
        const annotationsData = data.annotations;
        const doc = new jspdf.jsPDF();
        let y = 10; // Starting y position for the text
        const lineHeight = 10; // Line height for text
  
        annotationsData.forEach((annotation, index) => {
          if (y + lineHeight * 5 > doc.internal.pageSize.height) {
            doc.addPage();
            y = 10; // Reset y position for the new page
          }
          doc.text(`Annotation ${index + 1}`, 10, y);
          y += lineHeight;
          doc.text(`Page: ${annotation.page}`, 10, y);
          y += lineHeight;
          doc.text(`Highlight: ${annotation.highlight}`, 10, y);
          y += lineHeight;
          doc.text(`Note: ${annotation.note}`, 10, y);
          y += lineHeight;
          doc.text(`Timestamp: ${annotation.timestamp}`, 10, y);
          y += lineHeight * 2; // Extra space between annotations
        });
  
        doc.save('annotations.pdf');
      });
    });
  });
     