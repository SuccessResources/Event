export default function handler(req, res) {
  // Vercel sets x-vercel-ip-country on every request at the edge
  const country = req.headers['x-vercel-ip-country'] || '';
  res.setHeader('Cache-Control', 'no-store, no-cache');
  res.json({ country_code: country });
}
