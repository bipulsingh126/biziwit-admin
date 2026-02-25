import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import slugify from "slugify";
import SEOPage from "../models/SEOPage.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import CaseStudy from "../models/CaseStudy.js";
import Megatrend from "../models/Megatrend.js";

const router = Router();

// Storage config for image uploads
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const CreateSlug = (text) => {
  if (!text) return "";
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "")
      //   .replace(/[0-9%]+/g, '-') // replace numbers and % with -
      //   .replace(/--+/g, '-') // replace multiple dashes with single -
      // Remove all non-word chars
      .replace(/\-\-+/g, "-")
  ); // Replace multiple - with single -
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const stamp = Date.now().toString(36);
    cb(
      null,
      `seo-${slugify(base, { lower: true, strict: true })}-${stamp}${ext}`,
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// RBAC: admin and editor
router.use(authenticate, requireRole("super_admin", "admin", "editor"));

// Get all SEO pages with filtering and search
router.get("/", async (req, res, next) => {
  try {
    const {
      q = "",
      isActive,
      minSeoScore,
      maxSeoScore,
      sort = "pageName",
      order = "asc",
      limit = 50,
      offset = 0,
    } = req.query;

    const query = {};

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = String(isActive) === "true";
    }

    // SEO score range filter
    if (minSeoScore || maxSeoScore) {
      query.seoScore = {};
      if (minSeoScore) query.seoScore.$gte = Number(minSeoScore);
      if (maxSeoScore) query.seoScore.$lte = Number(maxSeoScore);
    }

    // Full-text search
    const useText = q && q.trim().length > 0;
    const findCond = useText ? { $text: { $search: q }, ...query } : query;
    const projection = useText ? { score: { $meta: "textScore" } } : undefined;

    // Sorting
    let sortSpec = { [sort]: order === "desc" ? -1 : 1 };
    if (useText) {
      sortSpec = { score: { $meta: "textScore" }, ...sortSpec };
    }

    const items = await SEOPage.find(findCond, projection)
      .sort(sortSpec)
      .skip(Number(offset))
      .limit(Math.min(100, Number(limit)));

    const total = await SEOPage.countDocuments(findCond);

    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

// Get single SEO page by ID
router.get("/:id", async (req, res, next) => {
  try {
    const page = await SEOPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: "SEO page not found" });
    }
    res.json(page);
  } catch (e) {
    next(e);
  }
});

// Create new SEO page
router.post("/", async (req, res, next) => {
  try {
    const pageData = req.body;

    // Check if URL already exists
    const existingPage = await SEOPage.findOne({ url: pageData.url });
    if (existingPage) {
      return res.status(400).json({ error: "URL already exists" });
    }

    const page = new SEOPage(pageData);
    await page.save();

    res.status(201).json(page);
  } catch (e) {
    next(e);
  }
});

// Update SEO page
router.patch("/:id", async (req, res, next) => {
  try {
    const updateData = req.body;
    // If URL is being updated, check for conflicts
    if (updateData.url) {
      var slugifiedUrl = CreateSlug(updateData.url);
      const existingPage = await SEOPage.findOne({
        url: slugifiedUrl,
        _id: { $ne: req.params.id },
      });
      if (existingPage) {
        return res.status(400).json({ error: "URL already exists" });
      }
    }
    const previousSeoData = await SEOPage.findById(req.params.id);
    const page = await SEOPage.findByIdAndUpdate(
      req.params.id,
      { ...updateData, url: slugifiedUrl },
      {
        new: true,
        runValidators: true,
      },
    );
    console.log("previousSeoData", previousSeoData)
    if(previousSeoData.pageName === "Case Studies"){
      let CaseStudyUpdateData = {
        titleTag: page.titleMetaTag,
        slug: page.url,
        metaDescription: page.metaDescription,
        keywords: page.keywords,
      };
      console.log("CaseStudyUpdateData", CaseStudyUpdateData)
      const updatedCaseStudy = await CaseStudy.findOneAndUpdate(
        { slug: previousSeoData.url },
        CaseStudyUpdateData,
        { new: true, runValidators: true },
      );
      console.log("updatedCaseStudy", updatedCaseStudy)
    }
    if(previousSeoData.pageName === "MegaTrends"){
      let MegaTrendUpdateData = {
        metaTitle: page.titleMetaTag,
        slug: page.url,
        metaDescription: page.metaDescription,
        metaKeywords: page.keywords.split(","),
      };
      await Megatrend.findOneAndUpdate(
        { slug: previousSeoData.url },
        MegaTrendUpdateData,
        { new: true, runValidators: true },
      );
    }
    if (!page) {
      return res.status(404).json({ error: "SEO page not found" });
    }

    res.json(page);
  } catch (e) {
    next(e);
  }
});

// Delete SEO page
router.delete("/:id", async (req, res, next) => {
  try {
    const page = await SEOPage.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ error: "SEO page not found" });
    }
    res.json({ message: "SEO page deleted successfully" });
  } catch (e) {
    next(e);
  }
});

// Upload featured image for SEO page
router.post(
  "/:id/upload-image",
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageUrl = `/uploads/${path.basename(req.file.path)}`;

      const page = await SEOPage.findByIdAndUpdate(
        req.params.id,
        { featuredImage: imageUrl },
        { new: true },
      );

      if (!page) {
        return res.status(404).json({ error: "SEO page not found" });
      }

      res.json({
        message: "Image uploaded successfully",
        imageUrl,
        page,
      });
    } catch (e) {
      next(e);
    }
  },
);

// Bulk update SEO pages
router.patch("/bulk/update", async (req, res, next) => {
  try {
    const { ids, updateData } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }

    const result = await SEOPage.updateMany({ _id: { $in: ids } }, updateData, {
      runValidators: true,
    });

    res.json({
      message: `Updated ${result.modifiedCount} SEO pages`,
      modifiedCount: result.modifiedCount,
    });
  } catch (e) {
    next(e);
  }
});

// Run SEO audit on a page
router.post("/:id/audit", async (req, res, next) => {
  try {
    const page = await SEOPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: "SEO page not found" });
    }

    // Simulate SEO audit (in production, this would use actual SEO tools)
    const auditResults = {
      seoScore: page.calculateSEOScore(),
      performanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
      accessibilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
      issues: [],
      recommendations: [],
    };

    // Add some sample issues and recommendations
    if (page.titleMetaTag.length < 30) {
      auditResults.issues.push("Title tag is too short");
      auditResults.recommendations.push("Expand title tag to 30-60 characters");
    }

    if (!page.metaDescription) {
      auditResults.issues.push("Missing meta description");
      auditResults.recommendations.push("Add a compelling meta description");
    }

    // Update page with audit results
    page.seoScore = auditResults.seoScore;
    page.performanceScore = auditResults.performanceScore;
    page.accessibilityScore = auditResults.accessibilityScore;
    page.lastAuditDate = new Date();
    page.auditedBy = req.user.email;

    await page.save();

    res.json({
      message: "SEO audit completed",
      auditResults,
      page,
    });
  } catch (e) {
    next(e);
  }
});

// Get SEO analytics summary
router.get("/analytics/summary", async (req, res, next) => {
  try {
    const totalPages = await SEOPage.countDocuments();
    const activePages = await SEOPage.countDocuments({ isActive: true });
    const avgSeoScore = await SEOPage.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$seoScore" } } },
    ]);

    const scoreDistribution = await SEOPage.aggregate([
      {
        $bucket: {
          groupBy: "$seoScore",
          boundaries: [0, 25, 50, 75, 100],
          default: "Other",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const topPerformingPages = await SEOPage.find()
      .sort({ seoScore: -1 })
      .limit(5)
      .select("pageName titleMetaTag seoScore url");

    const lowPerformingPages = await SEOPage.find()
      .sort({ seoScore: 1 })
      .limit(5)
      .select("pageName titleMetaTag seoScore url");

    res.json({
      summary: {
        totalPages,
        activePages,
        avgSeoScore: avgSeoScore[0]?.avgScore || 0,
        scoreDistribution,
        topPerformingPages,
        lowPerformingPages,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
