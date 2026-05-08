"use client";

export function summarizePage() {
  const summaryParts: string[] = [];

  // Title
  summaryParts.push(`This page is titled ${document.title}.`);

  // Headings
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .filter(h => h.getClientRects().length > 0)
    .map(h => h.textContent?.trim());
  
  if (headings.length > 0) {
    summaryParts.push(`It has ${headings.length} main sections including ${headings.slice(0, 3).join(', ')}.`);
  }

  // Interactive Elements
  const buttons = Array.from(document.querySelectorAll('button, a'))
    .filter(el => el.getClientRects().length > 0)
    .length;
  
  if (buttons > 0) {
    summaryParts.push(`There are ${buttons} interactive buttons and links.`);
  }

  // Forms
  const forms = Array.from(document.querySelectorAll('input, select, textarea')).length;
  if (forms > 0) {
    summaryParts.push(`There is an input form with ${forms} fields.`);
  }

  return summaryParts.join(' ');
}

export function extractMeaningfulText() {
  const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, li, span, button, a'))
    .filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
    });

  return elements
    .map(el => el.textContent?.trim())
    .filter(text => text && text.length > 3)
    .join('. ');
}
