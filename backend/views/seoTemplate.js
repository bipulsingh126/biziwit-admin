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
  author,
}) {
  console.log("received author", author);
  const headScriptsRaw = Array.isArray(scripts) ? scripts.join("\n") : "";
  const bodyScriptsRaw = Array.isArray(bodyScripts)
    ? bodyScripts.join("\n")
    : "";

  const safeTitle = title || "";
  const safeDescription = description || "";
  const safeImage = image || ogImage || "";
  const safeUrl = canonical || "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.png" />
    
    ${safeTitle ? `<title>${safeTitle}</title>` : ""}
    ${safeDescription ? `<meta name="description" content="${safeDescription}" />` : ""}
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ""}
    ${robots ? `<meta name="robots" content="${robots}" />` : ""}
    ${safeUrl ? `<link rel="canonical" href="${safeUrl}" />` : ""}
    ${author ? `<meta name="author" content="${author}" />` : ""}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    ${safeUrl ? `<meta property="og:url" content="${safeUrl}" />` : ""}
    ${(ogTitle || safeTitle) ? `<meta property="og:title" content="${ogTitle || safeTitle}" />` : ""}
    ${(ogDescription || safeDescription) ? `<meta property="og:description" content="${ogDescription || safeDescription}" />` : ""}
    ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ""}

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    ${safeUrl ? `<meta property="twitter:url" content="${safeUrl}" />` : ""}
    ${(twitterTitle || ogTitle || safeTitle) ? `<meta property="twitter:title" content="${twitterTitle || ogTitle || safeTitle}" />` : ""}
    ${(twitterDescription || ogDescription || safeDescription) ? `<meta property="twitter:description" content="${twitterDescription || ogDescription || safeDescription}" />` : ""}
    ${(twitterImage || safeImage) ? `<meta property="twitter:image" content="${twitterImage || safeImage}" />` : ""}

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
