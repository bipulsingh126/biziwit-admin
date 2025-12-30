/**
 * SEO Template for Server-Side Rendering
 * Generates dynamic HTML with SEO meta tags from database
 */

function seoTemplate({
    title,
    description,
    keywords,
    canonical,
    image,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    twitterImage,
    scripts,
    bodyScripts,
    appHtml, // Currently empty for Client-Side Hydration
    cssFiles,
    jsFiles,
}) {
    const headScriptsRaw = Array.isArray(scripts) ? scripts.join("\n") : "";
    const bodyScriptsRaw = Array.isArray(bodyScripts) ? bodyScripts.join("\n") : "";

    // Defaults
    const defaultTitle = "Bizwit Research & Consulting";
    const defaultDescription = "Bizwit Research & Consulting provides comprehensive market research and consulting services.";
    const defaultImage = "https://admin.bizwitresearch.com/assets/logo.png"; // Adjust path as needed
    const siteUrl = "https://www.bizwitresearch.com";

    const safeTitle = title || defaultTitle;
    const safeDescription = description || defaultDescription;
    const safeImage = image || ogImage || defaultImage;
    const safeUrl = canonical || siteUrl;

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.png" />
    
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ""}
    <meta name="robots" content="${robots || "index, follow"}" />
    <link rel="canonical" href="${safeUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:title" content="${ogTitle || safeTitle}" />
    <meta property="og:description" content="${ogDescription || safeDescription}" />
    <meta property="og:image" content="${safeImage}" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${safeUrl}" />
    <meta property="twitter:title" content="${twitterTitle || ogTitle || safeTitle}" />
    <meta property="twitter:description" content="${twitterDescription || ogDescription || safeDescription}" />
    <meta property="twitter:image" content="${twitterImage || safeImage}" />

    <!-- Injected Styles -->
    ${cssFiles
            .map((css) => `<link rel="stylesheet" crossorigin href="${css}">`)
            .join("\n    ")}
    
    <!-- User Scripts -->
    ${headScriptsRaw}
    
  </head>
  <body>
    ${bodyScriptsRaw}
    <div id="root">${appHtml}</div>
    
    <!-- Injected Scripts -->
    ${jsFiles
            .map((js) => `<script type="module" crossorigin src="${js}"></script>`)
            .join("\n    ")}
  </body>
</html>`;
}

export default seoTemplate;
