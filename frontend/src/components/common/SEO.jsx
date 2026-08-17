import React, { useEffect } from 'react';

/**
 * Reusable SEO component for dynamic page metadata updates in React SPA
 * @param {Object} props
 * @param {string} props.title - Dynamic Page Title
 * @param {string} props.description - Meta Description
 * @param {string} props.keywords - Meta Keywords
 * @param {string} props.canonical - Relative page path (e.g. /dashboard)
 * @param {string} props.robots - Search engine crawler indexing instructions (e.g. noindex,nofollow)
 * @param {string} props.ogType - Open Graph resource type (defaults to 'website')
 * @param {string} props.ogImage - Open Graph image resource URL
 */
export const SEO = ({
  title,
  description = 'HealthGuard AI provides AI-powered preventive health assessments, risk insights, BMI analysis, and personalized health guidance in one platform.',
  keywords = 'HealthGuard AI, AI health assessment, health risk assessment, preventive healthcare, health risk prediction, AI healthcare platform, health monitoring, BMI assessment, diabetes risk assessment, heart risk assessment, stroke risk assessment, personalized health insights, digital health assessment',
  canonical,
  robots = 'index,follow',
  ogType = 'website',
  ogImage
}) => {
  useEffect(() => {
    // 1. Update Document Title
    if (title) {
      document.title = title;
    }

    // Helper to dynamically update/insert head meta tags
    const updateMetaTag = (attributeName, attributeValue, contentValue) => {
      if (!contentValue) return;
      let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attributeName, attributeValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', contentValue);
    };

    // Helper to dynamically update/insert head link tags
    const updateLinkTag = (relValue, hrefValue) => {
      if (!hrefValue) return;
      let link = document.querySelector(`link[rel="${relValue}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', relValue);
        document.head.appendChild(link);
      }
      link.setAttribute('href', hrefValue);
    };

    // 2. Standard Metadata
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    updateMetaTag('name', 'robots', robots);

    // 3. Canonical Link URL Generation
    const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '');
    const currentPath = canonical || window.location.pathname;
    const formattedPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
    const cleanPath = formattedPath.endsWith('/') && formattedPath.length > 1 ? formattedPath.slice(0, -1) : formattedPath;
    const fullCanonicalUrl = `${siteUrl}${cleanPath}`;
    updateLinkTag('canonical', fullCanonicalUrl);

    // 4. Open Graph Social Metadata
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:url', fullCanonicalUrl);
    updateMetaTag('property', 'og:site_name', 'HealthGuard AI');
    updateMetaTag('property', 'og:locale', 'en_US');
    const ogImgUrl = ogImage || `${siteUrl}/og-image.png`;
    updateMetaTag('property', 'og:image', ogImgUrl);

    // 5. Twitter / X Cards Metadata
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImgUrl);
  }, [title, description, keywords, canonical, robots, ogType, ogImage]);

  return null;
};

export default SEO;
