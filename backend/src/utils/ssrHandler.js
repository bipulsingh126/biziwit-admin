import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import seoTemplate from "../../views/seoTemplate.js";

// Import Models
import Report from "../models/Report.js";
import Megatrend from "../models/Megatrend.js";
import Blog from "../models/Blog.js";
import CaseStudy from "../models/CaseStudy.js";
import ServicePage from "../models/ServicePage.js";
import SEOPage from "../models/SEOPage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to look up content by slug across multiple collections
async function findContentBySlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  const variations = [slug, slug.replace(/-/g, " ")];

  // 1. Try finding in Report
  let content = await Report.findOne({ slug: { $in: variations } });
  if (content) return { type: "report", data: content };

  // 2. Try finding in Blog
  content = await Blog.findOne({ slug: { $in: variations } });
  if (content) return { type: "blog", data: content };

  // 3. Try finding in Megatrend
  content = await Megatrend.findOne({ slug: { $in: variations } });
  if (content) return { type: "megatrend", data: content };

  // 4. Try finding in CaseStudy
  content = await CaseStudy.findOne({ slug: { $in: variations } });
  if (content) return { type: "casestudy", data: content };

  // 5. Try finding in ServicePage
  content = await ServicePage.findOne({ slug: { $in: variations } });
  if (content) return { type: "servicepage", data: content };

  // 6. Try finding in SEOPage (Use 'url' instead of 'slug')
  const searchPath = slug.startsWith("/") ? slug : `/${slug}`;
  content = await SEOPage.findOne({
    $or: [{ url: slug }, { url: searchPath }]
  });
  if (content) return { type: "seopage", data: content };

  return null;
}

export const ssrHandler = async (req, res, next) => {
  try {
    const requestPath = req.path.replace(/^\/+/, "").trim(); // Remove leading slashes
    console.log(requestPath, "slug");

    const segments = requestPath.split("/").filter(Boolean);
    const firstSegment = segments[0];
    console.log("👽 firstSegment", firstSegment);
    // Default SEO Data (Cleared to support dynamic-only mode)
    let seoData = {
      title: "",
      description: "",
      canonical: "",
      robots: "",
      keywords: "",
      ogTitle: "",
      ogDescription: "",
      image: "",
      author: "",
      scripts: [],
      bodyScripts: [],
    };

    // --- Dynamic Lookup Logic ---

    // The full path without leading/trailing slashes, and an alternative with a leading slash
    const fullPath = requestPath || "home";

    // 1. Process known models that contain slugs:
    const contentPrefixes = ["ReportStore", "reports", "report-store", "press-release", "report_categories", "blogs", "blog", "case-studies", "case-study", "megatrends", "megatrend"];

    // If we have a second segment, it's a specific item (report, blog, etc.)
    if (firstSegment && contentPrefixes.includes(firstSegment) && segments[1]) {
      const contentSlug = segments[1].trim();
      const content = await findContentBySlug(contentSlug);

      if (content) {
        const { type, data } = content;
        console.log(`✅ ${type} Found for slug: ${contentSlug}`);
        
        seoData = {
          title: data.titleMetaTag || data.metaTitle || data.titleTag || data.title || data.pageName || data.name || seoData.title,
          description: data.metaDescription || data.summary || data.description || data.reportDescription || seoData.description,
          keywords: data.keywords || (Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : data.metaKeywords) || seoData.keywords,
          canonical:
            data.canonical || data.canonicalUrl ||
            `https://www.bizwitresearch.com/${firstSegment}/${(data.slug || contentSlug).toString().replace(/\s+/g, "-")}`,
          image: data.image || data.mainImage || data.heroImage?.url || data.coverImage?.url || data.featuredImage || data.ogImage || "https://www.bizwitresearch.com/assets/logo.png",
          ogTitle: data.ogTitle || data.titleMetaTag || data.metaTitle || data.titleTag || data.title || seoData.title,
          ogDescription: data.ogDescription || data.metaDescription || data.summary || data.reportDescription || seoData.description,
          robots: "index, follow",
          author: data.author || data.authorName || ""
        };
      } else {
        console.log(`❌ Content not found for slug: ${contentSlug} under prefix: ${firstSegment}`);
      }
    } else {
      // 2. Fallback to querying SEOPage using the full string or first segment
      // This handles listing pages like /report-store, /reports, /blogs, etc.
      const searchPath = fullPath.startsWith("/") ? fullPath : `/${fullPath}`;
      const altPath = fullPath.replace(/^\//, "");

      const seoPage = await SEOPage.findOne({
        $or: [
          { url: searchPath },
          { url: altPath },
          { url: firstSegment }
        ]
      });

      console.log("From Seo Database lookup for path:", searchPath, seoPage ? "Found ✅" : "Not Found ❌");

      if (seoPage) {
        seoData = {
          title: seoPage.titleMetaTag,
          description: seoPage.metaDescription,
          keywords: seoPage.keywords,
          canonical:
            seoPage.canonicalUrl || seoPage.canonical ||
            `https://www.bizwitresearch.com${searchPath}`,
          robots: (seoPage.noIndex ? "noindex" : "index") + ", " + (seoPage.noFollow ? "nofollow" : "follow"),
          author: seoPage?.author || "",
          scripts: seoPage.scripts || [],
          bodyScripts: seoPage.bodyScripts || [],
          ogTitle: seoPage.ogTitle || seoPage.titleMetaTag,
          ogDescription: seoPage.ogDescription || seoPage.metaDescription,
          image: seoPage.ogImage || seoPage.featuredImage || "https://www.bizwitresearch.com/assets/logo.png"
        };
      } else {
        // 3. NEW FALLBACK: Try finding in other collections (Report, Blog, CaseStudy, etc.)
        // This handles URLs where the item slug is directly at the root (e.g. /laudantium-hic-nost)
        const dynamicContent = firstSegment ? await findContentBySlug(firstSegment) : null;
        if (dynamicContent) {
          const { type, data } = dynamicContent;
          console.log(`✅ Found dynamic content of type: ${type} for slug: ${firstSegment}`);

          seoData = {
            title: data.titleMetaTag || data.metaTitle || data.titleTag || data.title || data.pageName || data.name || seoData.title,
            description: data.metaDescription || data.summary || data.description || data.reportDescription || seoData.description,
            keywords: data.keywords || (Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : data.metaKeywords) || seoData.keywords,
            canonical: data.canonical || data.canonicalUrl || `https://www.bizwitresearch.com/${firstSegment}`,
            image: data.image || data.mainImage || data.heroImage?.url || data.coverImage?.url || data.featuredImage || data.ogImage || seoData.image,
            ogTitle: data.ogTitle || data.titleMetaTag || data.metaTitle || data.titleTag || data.title || seoData.title,
            ogDescription: data.ogDescription || data.metaDescription || data.summary || data.description || data.reportDescription || seoData.description,
            robots: "index, follow",
            author: data.author || data.authorName || ""
          };
        }
      }
    }
    // --- Template Injection ---

    // Path to the client build's index.html
    // Prioritize environment variable for Production flexibility
    const localDist = path.resolve(__dirname, "../../../../bizwit_code-main/dist");
    const remoteDist = path.resolve(__dirname, "../../../../bizwit_code/dist");

    // Prioritize environment variable for Production flexibility
    const frontendDistPath = process.env.FRONTEND_DIST_PATH
      ? path.resolve(process.env.FRONTEND_DIST_PATH)
      : (fs.existsSync(remoteDist) ? remoteDist : localDist);
    console.log(frontendDistPath, 'frontendDistPath');

    const indexPath = path.join(frontendDistPath, "index.html");
    console.log(indexPath, 'indexPath');

    if (!fs.existsSync(indexPath)) {
      console.error(
        "SSR Error: frontend/dist/index.html not found. Have you built the frontend?",
      );
      return res.status(500).send("Server Error: Frontend build not found.");
    }

    const indexHtml = fs.readFileSync(indexPath, "utf-8");

    // Extract CSS and JS filenames from the built index.html
    // Vite adds hash to filenames, so we scrape them from the HTML
    // Example: <script type="module" crossorigin src="/assets/index-D8...js"></script>
    // Example: <link rel="stylesheet" crossorigin href="/assets/index-C...css">

    const cssMatches = indexHtml.match(/href="(\/assets\/[^"]+\.css)"/g) || [];
    const jsMatches = indexHtml.match(/src="(\/assets\/[^"]+\.js)"/g) || [];

    const cssFiles = cssMatches.map(
      (match) => match.match(/href="([^"]+)"/)[1],
    );
    const jsFiles = jsMatches.map((match) => match.match(/src="([^"]+)"/)[1]);

    // --- Final Robots Override for Action Pages ---
    const noIndexPatterns = ["download-sample", "inquiry", "buy-now"];
    if (noIndexPatterns.some((p) => requestPath.split('/').includes(p))) {
      seoData.robots = "noindex, nofollow";
    }

    const html = seoTemplate({
      ...seoData,
      scripts: seoData.scripts || [],
      bodyScripts: seoData.bodyScripts || [],
      cssFiles,
      jsFiles,
      appHtml: "", // Empty for Client-Side Rendering
    });
    console.log(html, 'html');

    res.send(html);
  } catch (error) {
    console.error("SSR Handler Error:", error);
    // Fallback to sending basic index.html or error
    res.status(500).send("Internal Server Error");
  }
};
