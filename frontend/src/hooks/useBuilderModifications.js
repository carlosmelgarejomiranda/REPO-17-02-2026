import { useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// This hook loads and applies saved modifications from the website builder
export const useBuilderModifications = (pageId) => {
  useEffect(() => {
    // Only apply modifications on the actual page, not in the builder
    const isBuilder = new URLSearchParams(window.location.search).get('builder');
    if (isBuilder) return;

    const applyModifications = async () => {
      try {
        const response = await fetch(`${API_URL}/api/builder/modifications/${pageId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const mods = data.modifications || {};
        
        // Wait for DOM to be ready
        setTimeout(() => {
          Object.entries(mods).forEach(([key, value]) => {
            try {
              if (key.startsWith('text:')) {
                // Text modifications - match by content or position
                const editId = key.replace('text:', '');
                const index = parseInt(editId.split('-').pop());
                const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, li');
                let textIndex = 0;
                textElements.forEach((el) => {
                  let hasText = false;
                  for (const node of el.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                      hasText = true;
                      break;
                    }
                  }
                  if (!hasText && el.textContent.trim() && el.children.length === 0) hasText = true;
                  if (hasText && el.textContent.trim().length > 0 && el.textContent.trim().length < 500) {
                    if (textIndex === index) {
                      el.textContent = value;
                    }
                    textIndex++;
                  }
                });
              } else if (key.startsWith('img:')) {
                // Image modifications
                const editId = key.replace('img:', '');
                const index = parseInt(editId.split('-').pop());
                const images = document.querySelectorAll('img');
                let imgIndex = 0;
                images.forEach((img) => {
                  // Skip carousel images
                  const isCarousel = img.className.includes('absolute') && 
                    img.parentElement?.querySelectorAll('img[class*="absolute"]').length >= 2;
                  if (!isCarousel) {
                    if (imgIndex === index) {
                      img.src = value;
                    }
                    imgIndex++;
                  }
                });
              } else if (key.startsWith('imgpos:')) {
                // Image position modifications
                const editId = key.replace('imgpos:', '');
                const index = parseInt(editId.split('-').pop());
                const images = document.querySelectorAll('img');
                let imgIndex = 0;
                images.forEach((img) => {
                  const isCarousel = img.className.includes('absolute') && 
                    img.parentElement?.querySelectorAll('img[class*="absolute"]').length >= 2;
                  if (!isCarousel) {
                    if (imgIndex === index) {
                      img.style.objectPosition = value;
                    }
                    imgIndex++;
                  }
                });
              } else if (key === 'carousel:hero') {
                // Carousel modifications
                const urls = JSON.parse(value);
                // Find carousel container (div with multiple absolute images)
                document.querySelectorAll('div').forEach((container) => {
                  const absImgs = container.querySelectorAll(':scope > img[class*="absolute"]');
                  if (absImgs.length >= 2) {
                    urls.forEach((url, idx) => {
                      if (absImgs[idx]) {
                        absImgs[idx].src = url;
                      }
                    });
                  }
                });
              }
            } catch (err) {
              console.error('Error applying modification:', key, err);
            }
          });
        }, 500);
      } catch (err) {
        console.error('Error loading modifications:', err);
      }
    };

    applyModifications();
  }, [pageId]);
};

export default useBuilderModifications;
