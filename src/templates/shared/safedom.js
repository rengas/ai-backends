// Safe DOM manipulation utilities to prevent XSS vulnerabilities

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
if (typeof escapeHtml === 'undefined') {
  window.escapeHtml = function(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

/**
 * Creates a DOM element with safe text content
 * @param {string} tag - The tag name
 * @param {string} text - The text content
 * @param {Object} attrs - Optional attributes
 * @returns {HTMLElement} - The created element
 */
function createElement(tag, text, attrs = {}) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  return element;
}

/**
 * Safely sets the content of an element
 * @param {HTMLElement} element - The element to update
 * @param {string|HTMLElement|HTMLElement[]} content - The content to set
 */
function setContent(element, content) {
  // Clear existing content
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  
  if (typeof content === 'string') {
    element.textContent = content;
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else if (Array.isArray(content)) {
    content.forEach(child => {
      if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
  }
}

/**
 * Creates option elements for a select
 * @param {Array} options - Array of {value, label} objects
 * @returns {HTMLElement[]} - Array of option elements
 */
function createOptions(options) {
  return options.map(opt => {
    const option = createElement('option', opt.label || opt.value);
    option.value = opt.value;
    return option;
  });
}

/**
 * Appends multiple children to a parent element
 * @param {HTMLElement} parent - The parent element
 * @param {HTMLElement[]} children - Array of child elements
 */
function appendChildren(parent, children) {
  children.forEach(child => {
    if (child instanceof HTMLElement) {
      parent.appendChild(child);
    }
  });
}
