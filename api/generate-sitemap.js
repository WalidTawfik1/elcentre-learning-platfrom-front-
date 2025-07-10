export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Set headers for XML content and caching
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Robots-Tag', 'noindex');
  
  // Generate sitemap XML with clean format
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://elcentre-learn.vercel.app/</loc>
<lastmod>2025-07-10</lastmod>
<priority>1.0</priority>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/courses</loc>
<lastmod>2025-07-10</lastmod>
<priority>0.9</priority>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/categories</loc>
<lastmod>2025-07-10</lastmod>
<priority>0.8</priority>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/instructors</loc>
<lastmod>2025-07-10</lastmod>
<priority>0.7</priority>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/auth/login</loc>
<lastmod>2025-07-10</lastmod>
<priority>0.3</priority>
</url>
<url>
<loc>https://elcentre-learn.vercel.app/auth/register</loc>
<lastmod>2025-07-10</lastmod>
<priority>0.3</priority>
</url>
</urlset>`;

  res.status(200).end(sitemap);
}
