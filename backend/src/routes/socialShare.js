import express from 'express';
import Blog from '../models/Blog.js';
import Megatrend from '../models/Megatrend.js';

const router = express.Router();

// Frontend URL (from environment or default to localhost)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper function to generate HTML with OG tags
const generateShareHTML = ({ title, description, image, url, type = 'article' }) => {
    // Ensure image URL is absolute
    const absoluteImageUrl = image?.startsWith('http')
        ? image
        : `https://api.bizwitresearch.com${image?.startsWith('/') ? image : '/' + image}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Bizwit Research'}</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="${title || 'Bizwit Research'}">
    <meta name="description" content="${description || 'Leading provider of market research reports'}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title || 'Bizwit Research'}">
    <meta property="og:description" content="${description || 'Leading provider of market research reports'}">
    <meta property="og:image" content="${absoluteImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Bizwit Research">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${title || 'Bizwit Research'}">
    <meta name="twitter:description" content="${description || 'Leading provider of market research reports'}">
    <meta name="twitter:image" content="${absoluteImageUrl}">
    
    <!-- Redirect to React app after 1 second (for real users, not bots) -->
    <meta http-equiv="refresh" content="1;url=${url}">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 { margin: 0 0 1rem; font-size: 1.5rem; }
        p { margin: 0; opacity: 0.9; }
    </style>
    
    <script>
        // Immediately redirect for browsers (social crawlers won't execute this)
        window.location.replace('${url}');
    </script>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Redirecting to Bizwit Research...</h1>
        <p>If you are not redirected automatically, <a href="${url}" style="color: white;">click here</a>.</p>
    </div>
</body>
</html>
  `.trim();
};

// Route for sharing blog posts
router.get('/blog/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Fetch blog from database (case-insensitive lookup)
        const blog = await Blog.findOne({ slug: { $regex: new RegExp(`^${slug}$`, 'i') } })
            .select('title subTitle mainImage slug');

        if (!blog) {
            // Fallback: If not found in DB, redirect to frontend anyway so user isn't stuck
            return res.redirect(`${FRONTEND_URL}/${slug}`);
        }

        // Generate the actual frontend URL
        const frontendUrl = `${FRONTEND_URL}/${blog.slug}`; // Use canonical slug from DB

        // Generate and send HTML with OG tags
        const html = generateShareHTML({
            title: blog.title,
            description: blog.subTitle || blog.title,
            image: blog.mainImage,
            url: frontendUrl,
            type: 'article'
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error generating share page for blog:', error);
        // Fallback to frontend on error
        res.redirect(`${FRONTEND_URL}/${req.params.slug}`);
    }
});

// Route for sharing megatrends
router.get('/megatrend/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Fetch megatrend from database (case-insensitive lookup)
        const megatrend = await Megatrend.findOne({ slug: { $regex: new RegExp(`^${slug}$`, 'i') } })
            .select('title subtitle heroImage slug');

        if (!megatrend) {
            // Fallback: If not found in DB, redirect to frontend anyway
            return res.redirect(`${FRONTEND_URL}/${slug}`);
        }

        // Generate the actual frontend URL
        const frontendUrl = `${FRONTEND_URL}/${megatrend.slug}`; // Use canonical slug

        // Get the hero image URL
        const imageUrl = megatrend.heroImage?.url || '';

        // Generate and send HTML with OG tags
        const html = generateShareHTML({
            title: megatrend.title,
            description: megatrend.subtitle || megatrend.title,
            image: imageUrl,
            url: frontendUrl,
            type: 'article'
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error generating share page for megatrend:', error);
        res.redirect(`${FRONTEND_URL}/${req.params.slug}`);
    }
});

export default router;
