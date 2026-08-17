import fs from 'fs';
import path from 'path';

// Load site URL from environment or use a default production fallback
const siteUrl = process.env.VITE_SITE_URL || 'https://healthguard-ai.vercel.app';

const distDir = path.resolve('dist');
const robotsPath = path.join(distDir, 'robots.txt');
const sitemapPath = path.join(distDir, 'sitemap.xml');

console.log(`[Post-Build] Formatting production URL placeholders using siteUrl: ${siteUrl}`);

// 1. Process robots.txt
if (fs.existsSync(robotsPath)) {
  let content = fs.readFileSync(robotsPath, 'utf8');
  content = content.replace(/https:\/\/YOUR-PRODUCTION-DOMAIN\.com/g, siteUrl);
  fs.writeFileSync(robotsPath, content, 'utf8');
  console.log(`[Post-Build] Replaced robots.txt sitemap target URL.`);
} else {
  console.warn(`[Post-Build] robots.txt not found at: ${robotsPath}`);
}

// 2. Process sitemap.xml
if (fs.existsSync(sitemapPath)) {
  let content = fs.readFileSync(sitemapPath, 'utf8');
  content = content.replace(/https:\/\/YOUR-PRODUCTION-DOMAIN\.com/g, siteUrl);
  fs.writeFileSync(sitemapPath, content, 'utf8');
  console.log(`[Post-Build] Replaced sitemap.xml location URLs.`);
} else {
  console.warn(`[Post-Build] sitemap.xml not found at: ${sitemapPath}`);
}
