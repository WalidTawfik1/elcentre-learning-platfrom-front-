export default function handler(req, res) {
  // Set the content type to XML
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  
  // Generate sitemap XML with clean format
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<url>
<loc>https://elcentre-learn.vercel.app/</loc>
<lastmod>2025-07-09</lastmod>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/courses</loc>
<lastmod>2025-07-09</lastmod>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/categories</loc>
<lastmod>2025-07-09</lastmod>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/instructors</loc>
<lastmod>2025-07-09</lastmod>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/auth/login</loc>
<lastmod>2025-07-09</lastmod>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/auth/register</loc>
<lastmod>2025-07-09</lastmod>
</url>
</urlset>`;

  res.status(200).end(sitemap);
}
