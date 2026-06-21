import { Command } from "commander";
import { KabumExtractor } from "./extractors/kabum";
import { PichauExtractor } from "./extractors/pichau";
import { TerabyteExtractor } from "./extractors/terabyte";
import { BenchPromosExtractor } from "./extractors/benchpromos";
import { ProductSchema } from "./schemas/hardware";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const program = new Command();

program
  .name("pc-scraper")
  .description("Scrapes PC hardware components from various Brazilian stores")
  .version("1.0.0")
  .option("-r, --retailer <retailer>", "Retailer to scrape: kabum, pichau, terabyte, benchpromos, all", "all")
  .option("-t, --type <type>", "Product type to scrape: cpu, gpu, ram, motherboard, psu, all", "all")
  .option("-h, --headful", "Run browser in headful mode (visible)", false);

program.parse(process.argv);

const options = program.opts();

async function main() {
  // Set HEADLESS environment variable based on CLI flag
  process.env.HEADLESS = options.headful ? "false" : "true";

  const retailersInput = options.retailer.toLowerCase();
  const typeInput = options.type.toLowerCase();

  const extractors: any[] = [];
  if (retailersInput === "all" || retailersInput === "kabum") {
    extractors.push(new KabumExtractor());
  }
  if (retailersInput === "all" || retailersInput === "pichau") {
    extractors.push(new PichauExtractor());
  }
  if (retailersInput === "all" || retailersInput === "terabyte") {
    extractors.push(new TerabyteExtractor());
  }
  if (retailersInput === "all" || retailersInput === "benchpromos") {
    extractors.push(new BenchPromosExtractor());
  }

  const typesToScrape: ("cpu" | "gpu" | "ram" | "motherboard" | "psu")[] = [];
  const validTypes = ["cpu", "gpu", "ram", "motherboard", "psu"];
  if (typeInput === "all") {
    typesToScrape.push("cpu", "gpu", "ram", "motherboard", "psu");
  } else if (validTypes.includes(typeInput)) {
    typesToScrape.push(typeInput as any);
  } else {
    console.error(`Invalid product type: ${typeInput}`);
    process.exit(1);
  }

  console.log(`Starting scraper with options:`, {
    retailers: extractors.map((e) => e.name),
    types: typesToScrape,
    headless: process.env.HEADLESS === "true",
  });

  const allRawProducts: any[] = [];

  for (const extractor of extractors) {
    for (const type of typesToScrape) {
      console.log(`\n--- Running ${extractor.name} for ${type.toUpperCase()}s ---`);
      try {
        const results = await extractor.scrape(type);
        console.log(`Extracted ${results.length} raw items from ${extractor.name}.`);
        allRawProducts.push(...results);
      } catch (err) {
        console.error(`Error running ${extractor.name} for ${type}:`, err);
      }
    }
  }

  console.log(`\nTotal raw products extracted: ${allRawProducts.length}`);
  console.log("Normalizing and validating data via Zod schema...");

  const validatedProducts: any[] = [];
  let excludedForbiddenCount = 0;
  let validationFailCount = 0;

  for (const raw of allRawProducts) {
    const parseResult = ProductSchema.safeParse(raw);
    if (parseResult.success) {
      validatedProducts.push(parseResult.data);
    } else {
      const isForbidden = parseResult.error.errors.some((e) => e.message === "Product name contains forbidden terms");
      if (isForbidden) {
        excludedForbiddenCount++;
      } else {
        validationFailCount++;
      }
    }
  }

  console.log(`Validation results:`);
  console.log(`- Validated successfully: ${validatedProducts.length}`);
  console.log(`- Excluded due to forbidden terms: ${excludedForbiddenCount}`);
  console.log(`- Failed validation: ${validationFailCount}`);

  // Path to consolidate output in the workspace root directory
  const outputPath = join(process.cwd(), "..", "produtos.json");
  const localOutputPath = join(process.cwd(), "produtos.json");

  // Load existing products if file exists
  let existingProducts: any[] = [];
  try {
    const fileToLoad = existsSync(outputPath) ? outputPath : (existsSync(localOutputPath) ? localOutputPath : null);
    if (fileToLoad) {
      existingProducts = JSON.parse(readFileSync(fileToLoad, "utf-8"));
      if (!Array.isArray(existingProducts)) {
        existingProducts = [];
      }
    }
  } catch (e) {
    console.warn("Could not read existing produtos.json, starting fresh.");
  }

  // Populate deduplication map with existing products
  const uniqueProductsMap = new Map<string, any>();
  for (const prod of existingProducts) {
    let cleanLink = prod.link;
    try {
      const urlObj = new URL(prod.link);
      cleanLink = urlObj.origin + urlObj.pathname;
    } catch (e) {}
    uniqueProductsMap.set(cleanLink, prod);
  }

  // Merge/overwrite with newly validated products
  for (const prod of validatedProducts) {
    let cleanLink = prod.link;
    try {
      const urlObj = new URL(prod.link);
      cleanLink = urlObj.origin + urlObj.pathname;
    } catch (e) {}

    if (!uniqueProductsMap.has(cleanLink)) {
      uniqueProductsMap.set(cleanLink, prod);
    } else {
      // If we already have the product, update/keep the one with the lowest cash price
      const existing = uniqueProductsMap.get(cleanLink);
      if (prod.priceCash < existing.priceCash) {
        uniqueProductsMap.set(cleanLink, prod);
      } else {
        // Just update metadata / specs if price is the same or higher but keep lowest price
        uniqueProductsMap.set(cleanLink, {
          ...existing,
          ...prod,
          priceCash: Math.min(existing.priceCash, prod.priceCash),
          priceInstallment: Math.min(existing.priceInstallment, prod.priceInstallment)
        });
      }
    }
  }

  const finalProducts = Array.from(uniqueProductsMap.values());
  console.log(`Deduplication results: merged and resolved to ${finalProducts.length} unique products total.`);

  // Write output to the workspace root directory: d:\Docs\Projetos Git\pc scrapper\produtos.json
  console.log(`Writing consolidated products to ${outputPath}...`);
  writeFileSync(outputPath, JSON.stringify(finalProducts, null, 2), "utf-8");

  // Also write to the local directory as a backup/reference
  writeFileSync(localOutputPath, JSON.stringify(finalProducts, null, 2), "utf-8");

  console.log("Scraping completed successfully!");
}

main().catch((err) => {
  console.error("Fatal error during scraping:", err);
  process.exit(1);
});
