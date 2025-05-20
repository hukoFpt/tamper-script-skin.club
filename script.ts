// ==UserScript==
// @name         Skin Club Autofill
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Extract skin data from Skin Club and autofill the form on localhost:3000, including quality selection based on text match.
// @author       You
// @match        https://skin.club/en/skins/*
// @match        http://localhost:3000/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const itemsByCategory = {
    Charm: [],
    Gloves: [
      "Bloodhound Gloves",
      "Broken Fang Gloves",
      "Driver Gloves",
      "Hand Wraps",
      "Hydra Gloves",
      "Moto Gloves",
      "Specialist Gloves",
      "Sport Gloves",
    ],
    Graffiti: ["Sealed Graffiti"],
    Knife: [
      "Bayonet",
      "Bowie Knife",
      "Butterfly Knife",
      "Classic Knife",
      "Falchion Knife",
      "Flip Knife",
      "Gut Knife",
      "Huntsman Knife",
      "Karambit",
      "Kukri Knife",
      "M9 Bayonet",
      "Navaja Knife",
      "Nomad Knife",
      "Paracord Knife",
      "Shadow Daggers",
      "Skeleton Knife",
      "Stiletto Knife",
      "Survival Knife",
      "Talon Knife",
      "Ursus Knife",
    ],
    Machinegun: ["M249", "Negev"],
    Patch: ["Patch"],
    Pistol: [
      "CZ75-Auto",
      "Desert Eagle",
      "Dual Berettas",
      "Five-SeveN",
      "Glock-18",
      "P2000",
      "P250",
      "R8 Revolver",
      "Tec-9",
      "USP-S",
      "Zeus x27",
    ],
    Rifle: ["AK-47", "AUG", "FAMAS", "Galil AR", "M4A1-S", "M4A4", "SG 553"],
    Shotgun: ["MAG-7", "Nova", "Sawed-Off", "XM1014"],
    SMG: ["MAC-10", "MP5-SD", "MP7", "MP9", "PP-Bizon", "P90", "UMP-45"],
    "Sniper Rifle": ["AWP", "G3SG1", "SCAR-20", "SSG 08"],
  };

  function getCategoryByItemName(itemName) {
    for (const [category, items] of Object.entries(itemsByCategory)) {
      if (items.includes(itemName)) {
        return category;
      }
    }
    return null; // Return null if no category is found
  }

  function extractData() {
    // Extract skin name
    const skinNameElement = document.querySelector("h2.second-title");
    if (!skinNameElement) {
      console.error("Skin name element not found.");
      return null;
    }
    const fullSkinName = skinNameElement?.textContent?.trim();
    const stattrak = fullSkinName?.includes("StatTrak"); // Check if it starts with "StatTrak"

    const skinName = fullSkinName?.includes("|") ? fullSkinName.split("|")[1].trim() : fullSkinName;

    console.log("Extracted Skin Name:", skinName);

    console.log("Is StatTrak:", stattrak);

    // Extract Item Name
    let itemName = fullSkinName?.includes("|") ? fullSkinName.split("|")[0].trim() : fullSkinName;
    if (itemName?.startsWith("★ ")) {
      itemName = itemName.replace(/^★\s*/, "");
    }
    if (itemName?.includes("StatTrak™ ")) {
      itemName = itemName.replace(/StatTrak™\s+/g, "").trim();
    }
    console.log("Extracted Item Name:", itemName);

    // Extract Category
    const category = getCategoryByItemName(itemName);
    if (category) {
      console.log("Extracted Category:", category);
    } else {
      console.error("No category found for item name:", itemName);
    }

    // Extract quality
    const qualityElement = document.querySelector(".quality span");
    console.log("Extracted Quality Element:", qualityElement?.textContent?.trim());
    const quality = qualityElement?.textContent?.trim();

    // Extract price and exterior
    const exteriorElements = document.querySelectorAll(".price-table .row .quality");
    const priceElements = document.querySelectorAll(".price-table .row .price");

    const prices = [];
    if (exteriorElements.length > 0 && priceElements.length > 0) {
      exteriorElements.forEach((exteriorElement, index) => {
        const exterior = exteriorElement.textContent.trim(); // Extract quality text
        const priceElement = priceElements[index]; // Match price with the same index
        if (priceElement) {
          let price = priceElement.textContent.trim().replace("$", ""); // Remove $ sign
          price = parseFloat(price); // Convert to a number
          prices.push({ exterior, price: isNaN(price) ? 0 : price }); // Fill 0 if NaN
        } else {
          console.warn(`No price found for exterior: ${exterior}`);
        }
      });

      console.log("Extracted Prices:", prices); // Log the final matched data
    } else {
      console.error("No quality or price elements found.");
    }

    const imageElement = document.querySelector(".skin-image__image-block img");
    const srcset = imageElement?.getAttribute("srcset");
    let imageUrl = null;

    if (srcset) {
      imageUrl = srcset.split(",")[0].split(" ")[0]; // Extract the first URL
      imageUrl = imageUrl.split("?")[0]; // Remove the query string (?policy=skin-xxl)
      console.log("Extracted Image URL:", imageUrl);
    } else {
      console.error("Image element or srcset attribute not found.");
    }

    const descriptionElement = document.querySelector("p.description__text");
    const descriptionText = descriptionElement.textContent.trim();
    if (descriptionText) {
      console.log("Extracted Description Text:", descriptionText);
    } else {
      console.error("Description element not found.");
    }

    // Extract library images
    const thumbElements = document.querySelectorAll(".image-thumbs__image-wrapper img");
    const additionalImages = Array.from(thumbElements)
      .slice(0, 5) // Limit to 5 images
      .map((img) => img.getAttribute("src")?.split("?")[0]); // Remove query strings
    console.log("Extracted Additional Images:", additionalImages);

    return { skinName, itemName, quality, stattrak, category, prices, imageUrl, descriptionText, additionalImages };
  }

  function observePage() {
    if (window.location.hostname === "localhost" && window.location.port === "3000") {
      const urlParams = new URLSearchParams(window.location.search);
      const itemName = urlParams.get("itemName");
      const category = urlParams.get("category");
      const skinName = urlParams.get("skin");
      const quality = urlParams.get("quality");
      const stattrak = urlParams.get("stattrak") === "true"; // Convert to boolean
      const prices = JSON.parse(urlParams.get("prices") || "[]"); // Parse prices from URL
      const imageUrl = urlParams.get("imageUrl");
      const additionalImages = JSON.parse(urlParams.get("additionalImages") || "[]"); // Parse additional images from URL
      const descriptionText = urlParams.get("descriptionText");

      if (skinName || quality) {
        // Autofill itemName
        const itemInput = document.getElementById("item");
        if (itemInput) {
          itemInput.value = itemName;
          console.log("Item name autofilled:", itemName);
        } else {
          console.error("Item input field not found.");
        }

        // Autofill category
        const categoryInput = document.getElementById("category");
        if (categoryInput) {
          categoryInput.value = category;
          console.log("Category autofilled:", category);
        } else {
          console.error("Category input field not found.");
        }

        // Autofill the form directly
        const skinInput = document.getElementById("skin");
        if (skinInput) {
          skinInput.value = skinName;
          console.log("Skin name autofilled:", skinName);
        }

        const qualitySelect = document.getElementById("quality");
        if (qualitySelect) {
          const options = Array.from(qualitySelect.options);
          const matchingOption = options.find(
            (option) => option.textContent.trim().toLowerCase() === quality.toLowerCase(),
          );
          if (matchingOption) {
            qualitySelect.value = matchingOption.value;
            console.log("Quality selected:", quality);
          } else {
            console.error("No matching quality found for:", quality);
          }
        }

        const stattrakYes = document.getElementById("stattrakYes");
        const stattrakNo = document.getElementById("stattrakNo");
        if (stattrak) {
          if (stattrakYes) {
            stattrakYes.checked = true;
            console.log("StatTrak selected.");
          }
        } else {
          if (stattrakNo) {
            stattrakNo.checked = true;
            console.log("No StatTrak selected.");
          }
        }

        // Autofill prices
        if (prices && prices.length > 0) {
          prices.forEach(({ exterior, price }) => {
            // Map exterior names to their exact IDs
            const exteriorIdMap = {
              "Factory New": "factoryNew",
              "Minimal Wear": "minimalWear",
              "Field-Tested": "fieldTested",
              "Well-Worn": "wellWorn",
              "Battle-Scarred": "battleScarred",
            };

            const priceInputId = stattrak
              ? `stattrak${exterior.replace(/\s+/g, "")}` // StatTrak price field ID
              : exteriorIdMap[exterior] || ""; // Non-StatTrak price field ID from the map

            console.log(`Looking for input field with ID: ${priceInputId}`); // Debugging log

            const priceInput = document.getElementById(priceInputId);

            if (priceInput) {
              priceInput.value = isNaN(price) ? 0 : price; // Fill 0 if NaN
              console.log(`Price autofilled for ${exterior}: $${priceInput.value}`);
            } else {
              console.warn(`Price input field not found for ${exterior} (ID: ${priceInputId})`);
            }
          });
        } else {
          console.error("No prices provided to fill.");
        }

        // Autofill image URL
        if (imageUrl) {
          const imageInput = document.getElementById("imageUrl");
          if (imageInput) {
            imageInput.value = imageUrl;
            console.log("Image URL autofilled:", imageUrl);
          } else {
            console.error("Image URL input field not found.");
          }
        }

        // Autofill description text
        if (descriptionText) {
          const descriptionInput = document.getElementById("description");
          if (descriptionInput) {
            descriptionInput.value = descriptionText;
            console.log("Description text autofilled:", descriptionText);
          } else {
            console.error("Description text input field not found.");
          }
        }

        if (additionalImages && additionalImages.length > 0) {
          additionalImages.forEach((image, index) => {
            const imageInputId = `libraryImage${index + 1}`; // Construct IDs: libraryImage1, libraryImage2, etc.
            const imageInput = document.getElementById(imageInputId);
            if (imageInput) {
              imageInput.value = image;
              console.log(`Additional image autofilled for ${imageInputId}: ${image}`);
            } else {
              console.warn(`Image input field not found for ID: ${imageInputId}`);
            }
          });
        } else {
          console.error("No additional images provided to fill.");
        }
      }
    } else if (window.location.hostname === "skin.club") {
      const observer = new MutationObserver(() => {
        const skinNameElement = document.querySelector("h2.second-title");
        const qualityElement = document.querySelector(".quality span");
        if (skinNameElement && qualityElement) {
          console.log("Skin name and quality elements found, extracting data...");
          observer.disconnect();
          const data = extractData();
          if (data) {
            const formUrl = `http://localhost:3000?skin=${encodeURIComponent(
              data.skinName,
            )}&itemName=${encodeURIComponent(data.itemName)}&category=${encodeURIComponent(
              data.category,
            )}&quality=${encodeURIComponent(data.quality)}&stattrak=${data.stattrak}&prices=${encodeURIComponent(
              JSON.stringify(data.prices),
            )}&imageUrl=${encodeURIComponent(data.imageUrl)}&descriptionText=${encodeURIComponent(
              data.descriptionText,
            )}&additionalImages=${encodeURIComponent(JSON.stringify(data.additionalImages))}`; // Include itemName and category in URL
            console.log("Opening form with URL:", formUrl);
            window.open(formUrl, "_blank");
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  observePage();
})();
