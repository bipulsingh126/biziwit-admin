import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import seoTemplate from '../../views/seoTemplate.js';

// Import Models
import Report from '../models/Report.js';
import Megatrend from '../models/Megatrend.js';
import Blog from '../models/Blog.js';
import CaseStudy from '../models/CaseStudy.js';
import ServicePage from '../models/ServicePage.js';
import SEOPage from '../models/SEOPage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to look up content by slug across multiple collections
async function findContentBySlug(slug) {
    // Try finding in Report
    let content = await Report.findOne({ slug });
    if (content) return { type: 'report', data: content };

    // Try finding in Megatrend
    content = await Megatrend.findOne({ slug });
    if (content) return { type: 'megatrend', data: content };

    // Try finding in Blog
    content = await Blog.findOne({ slug });
    if (content) return { type: 'blog', data: content };

    // Try finding in CaseStudy
    content = await CaseStudy.findOne({ slug });
    if (content) return { type: 'casestudy', data: content };

    // Try finding in ServicePage
    content = await ServicePage.findOne({ slug });
    if (content) return { type: 'servicepage', data: content };

    // Try finding in SEOPage
    content = await SEOPage.findOne({ slug });
    if (content) return { type: 'seopage', data: content };

    return null;
}

export const ssrHandler = async (req, res, next) => {
    // Skip API routes and static assets (should be handled by express.static before this)
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/images')) {
        return next();
    }

    try {
        const requestPath = req.path.replace(/^\/+/, "").trim(); // Remove leading slashes
        const segments = requestPath.split('/').filter(Boolean);
        const firstSegment = segments[0];

        // Default SEO Data
        let seoData = {
            title: "Bizwit Research & Consulting | Market Research Reports",
            description: "Bizwit Research & Consulting is a leading global market research and consulting firm.",
            canonical: `https://www.bizwitresearch.com/${requestPath}`,
            robots: "index, follow",
            keywords: "market research, consulting, business intelligence",
            ogTitle: "",
            ogDescription: "",
            image: "https://www.bizwitresearch.com/assets/logo.png"
        };

        // --- Dynamic Lookup Logic ---

        // 1. Homepage
        if (!firstSegment) {
            // Ideally fetch from HomePage model if it exists and has SEO data
            // For now keep default
        }
        // 2. Specific Static Routes (checking if they map to SEO Pages or have static overrides)
        else if (['about', 'contact', 'career', 'bizchronicles', 'ReportStore'].includes(firstSegment)) {
            // Try looking up in SEOPage model for these static paths if they exist there
            const seoPage = await SEOPage.findOne({ slug: firstSegment });
            if (seoPage) {
                seoData = {
                    title: seoPage.titleTag || seoPage.title,
                    description: seoPage.metaDescription,
                    keywords: seoPage.keywords,
                    canonical: seoPage.canonical || `https://www.bizwitresearch.com/${firstSegment}`,
                    robots: "index, follow"
                };
            }
        }
        // 3. Dynamic Content Lookup (Treat first segment as Slug)
        else {
            // Check if it's a known prefix route like /ReportStore/:slug
            if (firstSegment === 'ReportStore' && segments[1]) {
                const report = await Report.findOne({ slug: segments[1] });
                if (report) {
                    seoData = {
                        title: report.metaTitle || report.title, // Report often has metaTitle
                        description: report.metaDescription,
                        keywords: report.keywords,
                        canonical: report.canonical || `https://www.bizwitresearch.com/ReportStore/${report.slug}`,
                        image: report.image, // Assuming image field exists
                        ogTitle: report.metaTitle || report.title,
                        ogDescription: report.metaDescription
                    };
                }
            } else {
                // "Universal" /:slug lookup
                const result = await findContentBySlug(firstSegment);
                if (result && result.data) {
                    const d = result.data;
                    // Map fields commonly found in our models
                    // Note: Field names might vary slightly (title vs titleTag), we check likely candidates
                    seoData = {
                        title: d.titleTag || d.metaTitle || d.title,
                        description: d.metaDescription,
                        keywords: d.keywords,
                        canonical: d.url ? `https://www.bizwitresearch.com/${d.url}` : `https://www.bizwitresearch.com/${d.slug}`,
                        image: d.mainImage || d.image,
                        ogTitle: d.titleTag || d.title,
                        ogDescription: d.metaDescription
                    };
                }
            }
        }

        // --- Template Injection ---

        // Path to the client build's index.html
        // Prioritize environment variable for Production flexibility
        const frontendDistPath = process.env.FRONTEND_DIST_PATH
            ? path.resolve(process.env.FRONTEND_DIST_PATH)
            : path.resolve(__dirname, '../../../frontend/dist');

        const indexPath = path.join(frontendDistPath, 'index.html');

        if (!fs.existsSync(indexPath)) {
            console.error("SSR Error: frontend/dist/index.html not found. Have you built the frontend?");
            return res.status(500).send("Server Error: Frontend build not found.");
        }

        const indexHtml = fs.readFileSync(indexPath, 'utf-8');

        // Extract CSS and JS filenames from the built index.html
        // Vite adds hash to filenames, so we scrape them from the HTML
        // Example: <script type="module" crossorigin src="/assets/index-D8...js"></script>
        // Example: <link rel="stylesheet" crossorigin href="/assets/index-C...css">

        const cssMatches = indexHtml.match(/href="(\/assets\/[^"]+\.css)"/g) || [];
        const jsMatches = indexHtml.match(/src="(\/assets\/[^"]+\.js)"/g) || [];

        const cssFiles = cssMatches.map(match => match.match(/href="([^"]+)"/)[1]);
        const jsFiles = jsMatches.map(match => match.match(/src="([^"]+)"/)[1]);

        const html = seoTemplate({
            ...seoData,
            cssFiles,
            jsFiles,
            appHtml: "" // Empty for Client-Side Rendering
        });

        res.send(html);

    } catch (error) {
        console.error("SSR Handler Error:", error);
        // Fallback to sending basic index.html or error
        res.status(500).send("Internal Server Error");
    }
};
