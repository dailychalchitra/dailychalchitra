/* ==========================================================
   Daily Chalchitra ePaper
   epaper-assets.js
   Asset / Image / Path Manager
   ========================================================== */

(function (window, document) {
  "use strict";

  const DCAssets = {};

  const DEFAULTS = {
    basePath: "/",
    imagePath: "/assets/images/",
    epaperImagePath: "/assets/images/epaper/",
    logoPath: "/assets/images/",
    fallbackImage:
      "/assets/images/epaper/epaper-placeholder.jpg"
  };

  let config = Object.assign({}, DEFAULTS);

  function cleanPath(path) {
    if (!path) return "";

    return String(path)
      .replace(/\\/g, "/")
      .replace(/\/{2,}/g, "/");
  }

  function normalizeUrl(path) {
    if (!path) {
      return "";
    }

    path = String(path).trim();

    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("//") ||
      path.startsWith("data:") ||
      path.startsWith("blob:")
    ) {
      return path;
    }

    return cleanPath(path);
  }

  function joinPath() {
    const parts = Array.from(arguments)
      .filter(function (part) {
        return part !== undefined &&
               part !== null &&
               String(part).trim() !== "";
      })
      .map(function (part) {
        return String(part)
          .replace(/^\/+|\/+$/g, "");
      });

    if (!parts.length) {
      return "/";
    }

    return "/" + parts.join("/") + "/";
  }

  function getBasePath() {
    return config.basePath || "/";
  }

  function resolve(path, fallback) {
    const value = normalizeUrl(path);

    if (value) {
      return value;
    }

    return fallback || "";
  }

  function image(path, fallback) {
    const value = normalizeUrl(path);

    if (!value) {
      return fallback || config.fallbackImage;
    }

    return value;
  }

  function cover(path) {
    return image(
      path,
      config.fallbackImage
    );
  }

  function issueImage(path) {
    const value = normalizeUrl(path);

    if (!value) {
      return config.fallbackImage;
    }

    return value;
  }

  function logo(path) {
    const value = normalizeUrl(path);

    if (!value) {
      return joinPath(
        config.logoPath,
        "logo.png"
      );
    }

    return value;
  }

  function pageImage(path) {
    return image(
      path,
      config.fallbackImage
    );
  }

  function isValidImageUrl(url) {
    if (!url) {
      return false;
    }

    const value = String(url).trim();

    return (
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("//") ||
      value.startsWith("data:image/") ||
      value.startsWith("blob:")
    );
  }

  function setImage(img, src, fallback) {
    if (!img) {
      return;
    }

    const finalSrc = image(src, fallback);

    img.onerror = function () {
      if (
        fallback &&
        img.src !== fallback
      ) {
        img.onerror = null;
        img.src = fallback;
      }
    };

    img.src = finalSrc;
  }

  function preload(src) {
    return new Promise(function (resolve) {
      if (!src) {
        resolve(false);
        return;
      }

      const img = new Image();

      img.onload = function () {
        resolve(true);
      };

      img.onerror = function () {
        resolve(false);
      };

      img.src = src;
    });
  }

  function preloadMany(urls) {
    if (!Array.isArray(urls)) {
      return Promise.resolve([]);
    }

    return Promise.all(
      urls.map(function (url) {
        return preload(url);
      })
    );
  }

  function configure(options) {
    if (!options || typeof options !== "object") {
      return Object.assign({}, config);
    }

    config = Object.assign(
      {},
      config,
      options
    );

    return Object.assign({}, config);
  }

  function getConfig() {
    return Object.assign({}, config);
  }

  function getIssueAsset(issue, key) {
    if (!issue) {
      return "";
    }

    const value = issue[key];

    if (!value) {
      return "";
    }

    return normalizeUrl(value);
  }

  function getCover(issue) {
    if (!issue) {
      return config.fallbackImage;
    }

    return cover(
      issue.cover ||
      issue.coverImage ||
      issue.image ||
      issue.thumbnail
    );
  }

  function getPageImage(page) {
    if (!page) {
      return config.fallbackImage;
    }

    return pageImage(
      page.image ||
      page.imageUrl ||
      page.src ||
      page.url
    );
  }

  function applyImages(root) {
    const container = root || document;

    container
      .querySelectorAll(
        "img[data-dc-src], img[data-epaper-src]"
      )
      .forEach(function (img) {
        const src =
          img.getAttribute(
            "data-dc-src"
          ) ||
          img.getAttribute(
            "data-epaper-src"
          );

        setImage(img, src);
      });
  }

  function bindImageFallbacks(root) {
    const container = root || document;

    container
      .querySelectorAll("img")
      .forEach(function (img) {
        if (
          img.dataset.dcAssetBound === "1"
        ) {
          return;
        }

        img.dataset.dcAssetBound = "1";

        img.addEventListener(
          "error",
          function () {
            const fallback =
              img.getAttribute(
                "data-fallback"
              ) ||
              config.fallbackImage;

            if (
              fallback &&
              img.src !== fallback
            ) {
              img.src = fallback;
            }
          }
        );
      });
  }

  function init() {
    applyImages(document);
    bindImageFallbacks(document);

    document.dispatchEvent(
      new CustomEvent(
        "dc:epaper-assets-ready"
      )
    );
  }

  DCAssets.config = configure;
  DCAssets.getConfig = getConfig;

  DCAssets.resolve = resolve;
  DCAssets.image = image;
  DCAssets.cover = cover;
  DCAssets.issueImage = issueImage;
  DCAssets.pageImage = pageImage;
  DCAssets.logo = logo;

  DCAssets.isValidImageUrl =
    isValidImageUrl;

  DCAssets.setImage = setImage;

  DCAssets.preload = preload;
  DCAssets.preloadMany = preloadMany;

  DCAssets.getIssueAsset =
    getIssueAsset;

  DCAssets.getCover = getCover;
  DCAssets.getPageImage =
    getPageImage;

  DCAssets.applyImages =
    applyImages;

  DCAssets.bindImageFallbacks =
    bindImageFallbacks;

  DCAssets.init = init;

  window.DCEpaperAssets = DCAssets;

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})(window, document);
