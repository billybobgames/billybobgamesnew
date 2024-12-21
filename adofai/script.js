function loadCSS() {
  const stylesheets = [
    "style1.css"
  ];

  stylesheets.forEach(stylesheet => {
    fetch(stylesheet)
      .then(response => response.text())
      .then(css => {
        const styleTag = document.createElement('style');
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
      });
  });
}

// Reload CSS every second for 60 seconds
const intervalId = setInterval(loadCSS, 5000);
setTimeout(() => clearInterval(intervalId), 60000); // Stop after 60 seconds