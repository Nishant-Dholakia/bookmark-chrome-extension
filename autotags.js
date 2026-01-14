// Auto-generate tags based on URL and title

/**
 * Generate tags automatically from URL and title
 * @param {string} url - The bookmark URL
 * @param {string} title - The bookmark title
 * @returns {Array} Array of generated tags
 */
function autoGenerateTags(url, title) {
  const tags = new Set();
  
  // Extract from URL
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Add domain-based tags
    const domainTags = {
      'github.com': ['github', 'code', 'dev'],
      'stackoverflow.com': ['stackoverflow', 'dev', 'qa'],
      'medium.com': ['article', 'blog'],
      'youtube.com': ['video', 'youtube'],
      'twitter.com': ['social', 'twitter'],
      'x.com': ['social', 'twitter'],
      'reddit.com': ['reddit', 'social'],
      'linkedin.com': ['linkedin', 'professional'],
      'docs.google.com': ['docs', 'google'],
      'notion.so': ['notes', 'notion'],
      'figma.com': ['design', 'figma'],
      'dribbble.com': ['design', 'inspiration'],
      'behance.net': ['design', 'portfolio'],
      'dev.to': ['dev', 'article'],
      'hackernews.com': ['news', 'tech'],
      'producthunt.com': ['products', 'startup'],
      'wikipedia.org': ['wiki', 'reference'],
      'coursera.org': ['course', 'learning'],
      'udemy.com': ['course', 'learning'],
      'npmjs.com': ['npm', 'package', 'javascript'],
      'pypi.org': ['python', 'package']
    };
    
    if (domainTags[domain]) {
      domainTags[domain].forEach(tag => tags.add(tag));
    }
    
    // Extract path-based tags
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    pathParts.forEach(part => {
      const cleaned = part.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (cleaned.length > 2 && cleaned.length < 20) {
        const words = cleaned.split(' ');
        words.forEach(word => {
          if (isCommonTechWord(word)) {
            tags.add(word);
          }
        });
      }
    });
  } catch (e) {
    // Invalid URL, skip
  }
  
  // Extract from title
  const titleWords = title.toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(' ')
    .filter(w => w.length > 3 && w.length < 15);
  
  titleWords.forEach(word => {
    if (isCommonTechWord(word)) {
      tags.add(word);
    }
  });
  
  // Return max 5 tags
  return Array.from(tags).slice(0, 5);
}

/**
 * Check if a word is a common tech/relevant term
 * @param {string} word - Word to check
 * @returns {boolean}
 */
function isCommonTechWord(word) {
  const techWords = new Set([
    // Programming languages
    'javascript', 'python', 'java', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'rust', 'go', 'golang', 'typescript',
    
    // Frameworks & Libraries
    'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'django', 'flask', 'express', 'fastapi', 'rails', 'laravel',
    'spring', 'node', 'nodejs', 'tailwind', 'bootstrap', 'jquery', 'redux', 'graphql',
    
    // Concepts
    'api', 'rest', 'tutorial', 'guide', 'docs', 'documentation', 'blog', 'article', 'course', 'video',
    'frontend', 'backend', 'fullstack', 'devops', 'database', 'auth', 'security', 'testing',
    'design', 'ui', 'ux', 'css', 'html', 'style', 'animation', 'responsive',
    'machine', 'learning', 'data', 'science', 'cloud', 'aws', 'azure', 'docker', 'kubernetes',
    
    // General
    'tool', 'tools', 'resource', 'reference', 'cheatsheet', 'snippet', 'example', 'demo',
    'open', 'source', 'github', 'repo', 'repository', 'project', 'package', 'library',
    'news', 'tech', 'startup', 'product', 'portfolio', 'inspiration'
  ]);
  
  return techWords.has(word);
}