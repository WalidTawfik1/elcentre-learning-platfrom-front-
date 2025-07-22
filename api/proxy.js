// API Proxy to bypass CORS issues
export default async function handler(req, res) {
  // Get the target URL from the request query
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Forward the request to the target URL
    const apiRes = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Get the response data
    const data = await apiRes.text();
    
    // Set the appropriate status code
    res.status(apiRes.status);
    
    // Set the content type header
    res.setHeader('Content-Type', apiRes.headers.get('Content-Type') || 'application/json');
    
    // Send the response
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
}