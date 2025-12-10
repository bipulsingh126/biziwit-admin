import express from 'express';
import Report from '../models/Report.js';
import Megatrend from '../models/Megatrend.js';
import Blog from '../models/Blog.js';
import CaseStudy from '../models/CaseStudy.js';

const router = express.Router();

// Public: Resolve slug to content type
// Public: Resolve slug to content type
router.get('/resolve/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const searchSlug = slug.trim();
        const searchRegex = new RegExp(`^${searchSlug}$`, 'i');
        const legacySlug = searchSlug.replace(/-/g, ' ');
        const legacyRegex = new RegExp(`^${legacySlug}$`, 'i');

        // Helper to find document with multiple fallback strategies
        const findDoc = async (Model) => {
            // 1. Exact/Case-insensitive slug
            let doc = await Model.findOne({ slug: searchRegex }).lean();
            if (doc) return doc;

            // 2. Legacy/Space format
            if (slug.includes('-')) {
                doc = await Model.findOne({ slug: legacyRegex }).lean();
            }
            return doc;
        };

        // Check Reports first (most important)
        const report = await findDoc(Report);
        if (report) {
            return res.json({ type: 'report', slug: report.slug, data: report });
        }

        // Check Megatrends
        const megatrend = await findDoc(Megatrend);
        if (megatrend) {
            return res.json({ type: 'megatrend', slug: megatrend.slug, data: megatrend });
        }

        // Check Blogs (using Blog model)
        const blog = await findDoc(Blog);
        if (blog) {
            return res.json({ type: 'blog', slug: blog.slug, data: blog });
        }

        // Check Case Studies
        const caseStudy = await findDoc(CaseStudy);
        if (caseStudy) {
            return res.json({ type: 'case-study', slug: caseStudy.slug, data: caseStudy });
        }

        // Not found
        return res.status(404).json({ error: 'Content not found' });
    } catch (error) {
        console.error('Error resolving slug:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
