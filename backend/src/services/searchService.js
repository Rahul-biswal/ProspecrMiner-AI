const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getRandomUserAgent, randomBetween, delay } = require('../utils/helpers');

puppeteer.use(StealthPlugin());

/**
 * Launch a stealth browser instance
 */
async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--lang=en-US,en',
    ],
  });
}

/**
 * Extract details from a single Google Maps place page.
 * Tries multiple selector strategies with proper waiting.
 */
async function extractPlaceDetails(browser, mapsUrl) {
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  // Build full URL (handle both relative and absolute)
  const fullUrl = mapsUrl.startsWith('http')
    ? mapsUrl
    : `https://www.google.com${mapsUrl}`;

  try {
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for the info panel to settle (the buttons with aria-labels appear)
    try {
      await page.waitForSelector('button[aria-label], a[aria-label]', { timeout: 6000 });
    } catch (_) { /* proceed anyway */ }

    await delay(randomBetween(1500, 2500));

    const details = await page.evaluate(() => {
      let website = '';
      let phone = '';
      let address = '';

      // ── Strategy 1: aria-label on buttons and links ──
      document.querySelectorAll('button[aria-label], a[aria-label]').forEach((el) => {
        const lbl = (el.getAttribute('aria-label') || '').trim();
        if (!phone && /^Phone:/i.test(lbl)) {
          phone = lbl.replace(/^Phone:\s*/i, '').trim();
        }
        if (!address && /^Address:/i.test(lbl)) {
          address = lbl.replace(/^Address:\s*/i, '').trim();
        }
      });

      // ── Strategy 2: data-item-id attributes ──
      // Website
      const websiteAnchor = document.querySelector('a[data-item-id="authority"]');
      if (websiteAnchor) website = websiteAnchor.href || '';

      // Phone via data-item-id
      if (!phone) {
        const phoneEl = document.querySelector('[data-item-id*="phone:tel:"], [data-item-id*="phone"]');
        if (phoneEl) {
          const lbl = phoneEl.getAttribute('aria-label') || phoneEl.textContent || '';
          phone = lbl.replace(/^Phone:\s*/i, '').trim();
        }
      }

      // Address via data-item-id
      if (!address) {
        const addrEl = document.querySelector('[data-item-id="address"], [data-item-id*="address"]');
        if (addrEl) {
          const lbl = addrEl.getAttribute('aria-label') || addrEl.textContent || '';
          address = lbl.replace(/^Address:\s*/i, '').trim();
        }
      }

      // ── Strategy 3: scan all visible text for phone pattern ──
      if (!phone) {
        const allText = document.body.innerText || '';
        const phoneMatch = allText.match(/(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/);
        if (phoneMatch) phone = phoneMatch[1];
      }

      // ── Strategy 4: look for website links in action buttons ──
      if (!website) {
        const anchors = document.querySelectorAll('a[href^="http"]');
        for (const a of anchors) {
          const lbl = (a.getAttribute('aria-label') || '').toLowerCase();
          const href = a.href || '';
          if (
            !href.includes('google.com') &&
            !href.includes('goo.gl') &&
            !href.includes('maps') &&
            (lbl.includes('website') || lbl.includes('web'))
          ) {
            website = href;
            break;
          }
        }
      }

      return { website, phone, address };
    });

    await page.close();
    return details;
  } catch (err) {
    try { await page.close(); } catch (_) {}
    console.warn(`  ⚠️  Detail extraction failed for ${fullUrl.slice(0, 60)}... : ${err.message}`);
    return { website: '', phone: '', address: '' };
  }
}

/**
 * Scrape Google Maps search results — returns leads with full details
 */
async function scrapeGoogleMaps(query, location, maxResults = 20) {
  const searchTerm = `${query} ${location}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;

  console.log(`🗺️  Google Maps: "${searchTerm}"`);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport({ width: 1280, height: 900 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  const leads = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(randomBetween(2000, 3500));

    // Dismiss cookie/consent banners
    for (const selector of ['[aria-label="Accept all"]', '#L2AGLb', 'button[jsname="higCR"]']) {
      try {
        const btn = await page.$(selector);
        if (btn) { await btn.click(); await delay(800); break; }
      } catch (_) {}
    }

    // Wait for results feed and scroll to load more
    try {
      await page.waitForSelector('div[role="feed"], .Nv2PK', { timeout: 8000 });
    } catch (_) { console.log('  Feed selector timed out, continuing...'); }

    // Scroll to load up to maxResults
    const scrollTimes = Math.ceil(maxResults / 5);
    for (let i = 0; i < scrollTimes; i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) feed.scrollBy(0, 600);
      });
      await delay(700);
    }
    await delay(1000);

    // Extract place links and names from the feed
    const placeItems = await page.evaluate((max) => {
      const results = [];
      const seen = new Set();

      // Get all links that point to a Google Maps place
      const links = document.querySelectorAll('a[href*="/maps/place/"]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (!href.includes('/maps/place/')) continue;

        // Walk up to find the card
        let card = link;
        for (let i = 0; i < 6; i++) {
          if (!card.parentElement) break;
          card = card.parentElement;
          if (card.getAttribute('role') === 'article' || card.classList.contains('Nv2PK')) break;
        }

        // Extract business name — try multiple approaches
        const nameEl = card.querySelector('.fontHeadlineSmall') ||
          card.querySelector('[aria-label]') ||
          link;

        let name = nameEl?.getAttribute('aria-label')?.trim() ||
          nameEl?.textContent?.trim() || '';

        // Clean up common noise
        name = name.replace(/\s*·\s*.+$/, '').trim();

        if (!name || seen.has(name) || name.length < 2) continue;
        seen.add(name);

        // Rating
        const ratingEl = card.querySelector('[aria-label*="star"]');
        const ratingText = ratingEl?.getAttribute('aria-label') || '';
        const ratingMatch = ratingText.match(/([\d.]+)\s*star/i);

        // Review count
        const reviewEl = card.querySelector('[aria-label*="review"]');
        const reviewText = reviewEl?.getAttribute('aria-label') || '';
        const reviewMatch = reviewText.match(/([\d,]+)\s*review/i);

        results.push({
          businessName: name,
          mapsUrl: href,
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
          reviewCount: reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : null,
        });

        if (results.length >= max) break;
      }
      return results;
    }, maxResults);

    console.log(`  Found ${placeItems.length} listings from feed`);

    // Now visit each place to extract phone, address, website
    for (const item of placeItems) {
      const details = await extractPlaceDetails(browser, item.mapsUrl);
      leads.push({
        businessName: item.businessName,
        address: details.address,
        phoneNumber: details.phone,
        websiteUrl: details.website,
        rating: item.rating,
        reviewCount: item.reviewCount,
      });
      console.log(`  ✔ ${item.businessName} | 📞 ${details.phone || '—'} | 🌐 ${details.website || '—'} | 📍 ${details.address ? details.address.slice(0, 40) : '—'}`);
    }

  } catch (err) {
    console.error('Google Maps scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return leads;
}

/**
 * Scrape Google Search for additional leads + websites
 */
async function scrapeGoogleSearch(query, location, maxResults = 10) {
  const searchTerm = encodeURIComponent(`${query} in ${location}`);
  const url = `https://www.google.com/search?q=${searchTerm}&num=20&hl=en`;

  console.log(`🔎 Google Search: "${query} in ${location}"`);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  const leads = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(randomBetween(1500, 2500));

    // Dismiss consent
    for (const sel of ['#L2AGLb', '[aria-label="Accept all"]']) {
      try {
        const btn = await page.$(sel);
        if (btn) { await btn.click(); await delay(800); break; }
      } catch (_) {}
    }

    const rawLeads = await page.evaluate(() => {
      const results = [];

      // ── Local Business Pack (top 3 map results) ──
      document.querySelectorAll('.rllt__details, .VkpGBb, [data-cid]').forEach((el) => {
        const nameEl = el.querySelector('.OSrXXb, .dbg0pd, h3, [aria-label]');
        const name = nameEl?.textContent?.trim() || nameEl?.getAttribute('aria-label')?.trim();
        const addressEl = el.querySelector('[class*="rllt"] span, .rllt__details span');
        if (name) {
          results.push({
            businessName: name,
            address: addressEl?.textContent?.trim() || '',
            websiteUrl: '',
            phoneNumber: '',
            rating: null,
            reviewCount: null,
          });
        }
      });

      // ── Organic results ──
      document.querySelectorAll('div.g, .tF2Cxc').forEach((div) => {
        const h3 = div.querySelector('h3');
        const link = div.querySelector('a[href^="http"]');
        if (!h3 || !link) return;
        const name = h3.textContent?.trim();
        const href = link.getAttribute('href') || '';
        if (!href.includes('google.com') && name && name.length > 2) {
          results.push({
            businessName: name,
            address: '',
            websiteUrl: href,
            phoneNumber: '',
            rating: null,
            reviewCount: null,
          });
        }
      });

      return results;
    });

    leads.push(...rawLeads.slice(0, maxResults));
    console.log(`  Search found ${rawLeads.length} results`);

  } catch (err) {
    console.error('Google Search scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return leads;
}

/**
 * Combine Maps + Search results, deduplicate by businessName
 */
async function searchLeads(query, location, maxResults = 20) {
  console.log(`\n🔍 Lead search: "${query}" in "${location}" (max ${maxResults})`);

  const [mapsResult, searchResult] = await Promise.allSettled([
    scrapeGoogleMaps(query, location, maxResults),
    scrapeGoogleSearch(query, location, Math.ceil(maxResults / 2)),
  ]);

  const mapsLeads = mapsResult.status === 'fulfilled' ? mapsResult.value : [];
  const searchLeads_ = searchResult.status === 'fulfilled' ? searchResult.value : [];

  console.log(`\n📊 Maps: ${mapsLeads.length} | Search: ${searchLeads_.length}`);

  const seen = new Set(mapsLeads.map(l => l.businessName?.toLowerCase().trim()));
  const merged = [...mapsLeads];

  for (const lead of searchLeads_) {
    const key = lead.businessName?.toLowerCase().trim();
    if (key && !seen.has(key)) {
      merged.push(lead);
      seen.add(key);
    }
  }

  const final = merged.slice(0, maxResults);
  console.log(`✅ Final: ${final.length} unique leads\n`);
  return final;
}

module.exports = { searchLeads };
