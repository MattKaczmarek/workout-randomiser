export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);

  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.type) element.type = options.type;
  if (options.id) element.id = options.id;
  if (options.disabled !== undefined) element.disabled = Boolean(options.disabled);
  if (options.value !== undefined) element.value = options.value;
  if (options.title) element.title = options.title;

  Object.entries(options.dataset || {}).forEach(([key, value]) => {
    element.dataset[key] = value;
  });

  Object.entries(options.attrs || {}).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (typeof options.onClick === 'function') {
    element.addEventListener('click', options.onClick);
  }

  children.filter(Boolean).forEach(child => {
    element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });

  return element;
}

export function renderEmpty(element, text) {
  clearElement(element);
  element.appendChild(createElement('div', { className: 'empty-state', text }));
}

export function setVisible(element, visible) {
  element.hidden = !visible;
}
