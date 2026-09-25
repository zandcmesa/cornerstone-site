/**
 * Navigation overflow test
 * Tests that the nav doesn't overflow at any viewport width
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const SITE_BASE = 'http://localhost:8000';
const ARTIFACT_DIR = '/opt/cursor/artifacts';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'nav-screenshots');

// Create directories
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Viewport widths to test with screenshots
const SCREENSHOT_WIDTHS = [390, 717, 768, 834, 912, 1024, 1180, 1280, 1440];

// Pages to test
const PAGES = ['index.html', 'announcements.html'];

// Comprehensive width range for overflow checks (every 10px from 320 to 1600)
function* widthRange(start, end, step) {
  for (let i = start; i <= end; i += step) {
    yield i;
  }
}

async function captureScreenshot(page, width, pageName, label) {
  const filename = `${pageName.replace('.html', '')}-${width}px-${label}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  await page.screenshot({
    path: filepath,
    fullPage: false,
    clip: { x: 0, y: 0, width: width, height: 300 }
  });
  
  return filepath;
}

async function checkOverflow(page, width) {
  const overflowData = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = window.innerWidth;
    const hasHorizontalScroll = scrollWidth > clientWidth;
    
    // Check nav right edge
    const nav = document.querySelector('.nav-inner');
    if (!nav) {
      return { 
        hasHorizontalScroll, 
        scrollWidth, 
        clientWidth,
        navCheck: null 
      };
    }
    
    const navRect = nav.getBoundingClientRect();
    const navActions = document.querySelector('.nav-actions');
    const navActionsRect = navActions ? navActions.getBoundingClientRect() : null;
    const menuBtn = document.querySelector('.nav-menu-btn');
    const menuBtnRect = menuBtn ? menuBtn.getBoundingClientRect() : null;
    
    // Find the rightmost visible nav element
    let rightmostElement = null;
    let rightmostRight = 0;
    
    if (navActionsRect && window.getComputedStyle(navActions).display !== 'none') {
      rightmostElement = 'nav-actions';
      rightmostRight = navActionsRect.right;
    }
    
    if (menuBtnRect && window.getComputedStyle(menuBtn).display !== 'none') {
      if (menuBtnRect.right > rightmostRight) {
        rightmostElement = 'nav-menu-btn';
        rightmostRight = menuBtnRect.right;
      }
    }
    
    const navOverflows = rightmostRight > clientWidth;
    
    return {
      hasHorizontalScroll,
      scrollWidth,
      clientWidth,
      navCheck: {
        navRight: navRect.right,
        rightmostElement,
        rightmostRight,
        navOverflows,
        isDesktopNav: navActionsRect && window.getComputedStyle(navActions).display !== 'none',
        isMobileNav: menuBtnRect && window.getComputedStyle(menuBtn).display !== 'none'
      }
    };
  });
  
  return overflowData;
}

async function runTests() {
  console.log('🚀 Starting navigation overflow tests...\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    overflowIssues: [],
    screenshots: {},
    summary: {}
  };
  
  for (const pageName of PAGES) {
    console.log(`\n📄 Testing ${pageName}...`);
    results.screenshots[pageName] = [];
    
    const url = `${SITE_BASE}/${pageName}`;
    
    // Test with screenshot widths
    for (const width of SCREENSHOT_WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for nav to be ready
      await page.waitForSelector('.nav');
      
      // Capture screenshot
      const screenshotPath = await captureScreenshot(page, width, pageName, 'after-fix');
      results.screenshots[pageName].push({ width, path: screenshotPath });
      
      // Check for overflow
      const overflowData = await checkOverflow(page, width);
      
      const status = overflowData.hasHorizontalScroll || overflowData.navCheck?.navOverflows 
        ? '❌' 
        : '✅';
      
      const navType = overflowData.navCheck?.isDesktopNav 
        ? 'desktop' 
        : (overflowData.navCheck?.isMobileNav ? 'mobile' : 'unknown');
      
      console.log(`  ${status} ${width}px (${navType}): scrollWidth=${overflowData.scrollWidth}, viewport=${overflowData.clientWidth}`);
      
      if (overflowData.hasHorizontalScroll || overflowData.navCheck?.navOverflows) {
        results.overflowIssues.push({
          page: pageName,
          width,
          ...overflowData
        });
      }
    }
    
    // Comprehensive overflow check (every 10px)
    console.log(`\n  Running comprehensive overflow check (320-1600px, every 10px)...`);
    let overflowCount = 0;
    let totalChecks = 0;
    
    for (const width of widthRange(320, 1600, 10)) {
      totalChecks++;
      await page.setViewportSize({ width, height: 800 });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.nav');
      
      const overflowData = await checkOverflow(page, width);
      
      if (overflowData.hasHorizontalScroll || overflowData.navCheck?.navOverflows) {
        overflowCount++;
        
        // Only record first few issues to avoid bloat
        if (results.overflowIssues.length < 20) {
          results.overflowIssues.push({
            page: pageName,
            width,
            ...overflowData
          });
        }
      }
    }
    
    console.log(`  ℹ️  Comprehensive check: ${totalChecks - overflowCount}/${totalChecks} widths passed`);
    
    if (!results.summary[pageName]) {
      results.summary[pageName] = {};
    }
    results.summary[pageName].comprehensiveCheck = {
      totalChecks,
      passed: totalChecks - overflowCount,
      failed: overflowCount
    };
  }
  
  await browser.close();
  
  // Write results
  const resultsPath = path.join(ARTIFACT_DIR, 'nav-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  for (const pageName of PAGES) {
    console.log(`\n${pageName}:`);
    const pageIssues = results.overflowIssues.filter(i => i.page === pageName);
    
    if (pageIssues.length === 0) {
      console.log('  ✅ No overflow issues detected');
    } else {
      console.log(`  ❌ ${pageIssues.length} overflow issues detected`);
      pageIssues.slice(0, 5).forEach(issue => {
        console.log(`     - ${issue.width}px: scrollWidth=${issue.scrollWidth}, viewport=${issue.clientWidth}`);
      });
    }
    
    console.log(`\n  Screenshots saved (${results.screenshots[pageName].length}):`);
    results.screenshots[pageName].forEach(s => {
      console.log(`     - ${s.width}px: ${s.path}`);
    });
    
    if (results.summary[pageName]?.comprehensiveCheck) {
      const check = results.summary[pageName].comprehensiveCheck;
      console.log(`\n  Comprehensive check: ${check.passed}/${check.totalChecks} widths passed`);
    }
  }
  
  console.log(`\n📁 Full results: ${resultsPath}`);
  console.log('='.repeat(60) + '\n');
  
  // Exit with error code if any issues found
  if (results.overflowIssues.length > 0) {
    console.error(`❌ Test failed: ${results.overflowIssues.length} overflow issues detected`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
