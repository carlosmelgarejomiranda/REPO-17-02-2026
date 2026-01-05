#!/usr/bin/env node
/**
 * Avenue Frontend SEO Tests
 * Tests dynamic meta tags, OG tags, Twitter cards, and JSON-LD schemas
 */

const { chromium } = require('playwright');

// Colors for console output
const Colors = {
    GREEN: '\x1b[92m',
    RED: '\x1b[91m',
    YELLOW: '\x1b[93m',
    BLUE: '\x1b[94m',
    ENDC: '\x1b[0m',
    BOLD: '\x1b[1m'
};

function printTestHeader(testName) {
    console.log(`\n${Colors.BLUE}${Colors.BOLD}=== ${testName} ===${Colors.ENDC}`);
}

function printSuccess(message) {
    console.log(`${Colors.GREEN}✅ ${message}${Colors.ENDC}`);
}

function printError(message) {
    console.log(`${Colors.RED}❌ ${message}${Colors.ENDC}`);
}

function printWarning(message) {
    console.log(`${Colors.YELLOW}⚠️  ${message}${Colors.ENDC}`);
}

function printInfo(message) {
    console.log(`${Colors.BLUE}ℹ️  ${message}${Colors.ENDC}`);
}

// Test results storage
const testResults = [];

function addTestResult(testName, status, message = '') {
    testResults.push({
        test: testName,
        status: status,
        message: message
    });
}

async function testShopPageSEO(page) {
    printTestHeader('Test Shop Page SEO');
    
    try {
        // Navigate to shop page
        await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle' });
        
        // Wait for React to render
        await page.waitForTimeout(2000);
        
        // Check page title
        const title = await page.title();
        printInfo(`Page title: ${title}`);
        
        if (title.includes('Tienda Online') && title.includes('AVENUE')) {
            printSuccess('✅ Shop page title is correct');
        } else {
            printError(`❌ Expected title to contain 'Tienda Online | AVENUE', got: ${title}`);
            addTestResult('Shop Page Title', 'FAIL', `Wrong title: ${title}`);
            return false;
        }
        
        // Check meta description
        const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
        printInfo(`Meta description: ${metaDescription}`);
        
        if (metaDescription && metaDescription.includes('tienda online')) {
            printSuccess('✅ Shop page meta description is present');
        } else {
            printWarning('⚠️ Shop page meta description missing or incorrect');
        }
        
        // Check Open Graph tags
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
        const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
        const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');
        
        if (ogTitle) {
            printSuccess(`✅ OG title: ${ogTitle}`);
        } else {
            printError('❌ Missing OG title');
        }
        
        if (ogDescription) {
            printSuccess(`✅ OG description present`);
        } else {
            printError('❌ Missing OG description');
        }
        
        if (ogImage) {
            printSuccess(`✅ OG image: ${ogImage}`);
        } else {
            printError('❌ Missing OG image');
        }
        
        if (ogUrl) {
            printSuccess(`✅ OG URL: ${ogUrl}`);
        } else {
            printError('❌ Missing OG URL');
        }
        
        // Check Twitter Card tags
        const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
        const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
        const twitterDescription = await page.getAttribute('meta[name="twitter:description"]', 'content');
        const twitterImage = await page.getAttribute('meta[name="twitter:image"]', 'content');
        
        if (twitterCard === 'summary_large_image') {
            printSuccess('✅ Twitter card type is correct');
        } else {
            printWarning(`⚠️ Twitter card type: ${twitterCard}`);
        }
        
        if (twitterTitle) {
            printSuccess('✅ Twitter title present');
        } else {
            printError('❌ Missing Twitter title');
        }
        
        if (twitterDescription) {
            printSuccess('✅ Twitter description present');
        } else {
            printError('❌ Missing Twitter description');
        }
        
        if (twitterImage) {
            printSuccess('✅ Twitter image present');
        } else {
            printError('❌ Missing Twitter image');
        }
        
        // Check JSON-LD schemas
        const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', scripts => 
            scripts.map(script => {
                try {
                    return JSON.parse(script.textContent);
                } catch (e) {
                    return null;
                }
            }).filter(Boolean)
        );
        
        printInfo(`Found ${jsonLdScripts.length} JSON-LD schemas`);
        
        let hasOrganizationSchema = false;
        let hasWebPageSchema = false;
        
        for (const schema of jsonLdScripts) {
            if (schema['@type'] === 'LocalBusiness') {
                hasOrganizationSchema = true;
                printSuccess('✅ Organization/LocalBusiness schema found');
            } else if (schema['@type'] === 'WebPage') {
                hasWebPageSchema = true;
                printSuccess('✅ WebPage schema found');
            }
        }
        
        if (!hasOrganizationSchema) {
            printError('❌ Missing Organization schema');
        }
        
        if (!hasWebPageSchema) {
            printError('❌ Missing WebPage schema');
        }
        
        // Check canonical URL
        const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
        if (canonical) {
            printSuccess(`✅ Canonical URL: ${canonical}`);
        } else {
            printError('❌ Missing canonical URL');
        }
        
        addTestResult('Shop Page SEO', 'PASS');
        return true;
        
    } catch (error) {
        printError(`Exception occurred: ${error.message}`);
        addTestResult('Shop Page SEO', 'FAIL', `Exception: ${error.message}`);
        return false;
    }
}

async function testStudioPageSEO(page) {
    printTestHeader('Test Studio Page SEO');
    
    try {
        // Navigate to studio page
        await page.goto('http://localhost:3000/studio', { waitUntil: 'networkidle' });
        
        // Wait for React to render
        await page.waitForTimeout(2000);
        
        // Check page title
        const title = await page.title();
        printInfo(`Page title: ${title}`);
        
        if (title.includes('Studio Fotográfico') && title.includes('AVENUE')) {
            printSuccess('✅ Studio page title is correct');
        } else {
            printError(`❌ Expected title to contain 'Studio Fotográfico | AVENUE', got: ${title}`);
            addTestResult('Studio Page Title', 'FAIL', `Wrong title: ${title}`);
            return false;
        }
        
        // Check meta description
        const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
        printInfo(`Meta description: ${metaDescription}`);
        
        if (metaDescription && metaDescription.includes('studio')) {
            printSuccess('✅ Studio page meta description is present');
        } else {
            printWarning('⚠️ Studio page meta description missing or incorrect');
        }
        
        // Check Open Graph tags
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        const ogType = await page.getAttribute('meta[property="og:type"]', 'content');
        
        if (ogTitle && ogTitle.includes('Studio')) {
            printSuccess(`✅ OG title contains Studio: ${ogTitle}`);
        } else {
            printError(`❌ OG title doesn't contain Studio: ${ogTitle}`);
        }
        
        if (ogType === 'website') {
            printSuccess('✅ OG type is website');
        } else {
            printWarning(`⚠️ OG type: ${ogType}`);
        }
        
        // Check JSON-LD schemas
        const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', scripts => 
            scripts.map(script => {
                try {
                    return JSON.parse(script.textContent);
                } catch (e) {
                    return null;
                }
            }).filter(Boolean)
        );
        
        printInfo(`Found ${jsonLdScripts.length} JSON-LD schemas`);
        
        let hasOrganizationSchema = false;
        for (const schema of jsonLdScripts) {
            if (schema['@type'] === 'LocalBusiness') {
                hasOrganizationSchema = true;
                printSuccess('✅ Organization schema found');
                
                // Check if it has opening hours (relevant for studio)
                if (schema.openingHoursSpecification) {
                    printSuccess('✅ Opening hours in schema');
                }
                
                // Check if it has geo coordinates
                if (schema.geo) {
                    printSuccess('✅ Geo coordinates in schema');
                }
            }
        }
        
        if (!hasOrganizationSchema) {
            printError('❌ Missing Organization schema');
        }
        
        addTestResult('Studio Page SEO', 'PASS');
        return true;
        
    } catch (error) {
        printError(`Exception occurred: ${error.message}`);
        addTestResult('Studio Page SEO', 'FAIL', `Exception: ${error.message}`);
        return false;
    }
}

async function testHomePageSEO(page) {
    printTestHeader('Test Home Page SEO');
    
    try {
        // Navigate to home page
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
        
        // Wait for React to render
        await page.waitForTimeout(2000);
        
        // Check page title
        const title = await page.title();
        printInfo(`Page title: ${title}`);
        
        if (title.includes('AVENUE')) {
            printSuccess('✅ Home page title contains AVENUE');
        } else {
            printError(`❌ Home page title should contain AVENUE: ${title}`);
        }
        
        // Check robots meta tag
        const robots = await page.getAttribute('meta[name="robots"]', 'content');
        if (robots && robots.includes('index')) {
            printSuccess(`✅ Robots meta tag allows indexing: ${robots}`);
        } else {
            printWarning(`⚠️ Robots meta tag: ${robots}`);
        }
        
        // Check if there are any noindex pages that shouldn't be indexed
        const currentUrl = page.url();
        if (currentUrl.includes('/admin') || currentUrl.includes('/checkout') || currentUrl.includes('/cart')) {
            const robotsContent = await page.getAttribute('meta[name="robots"]', 'content');
            if (robotsContent && robotsContent.includes('noindex')) {
                printSuccess('✅ Private page correctly has noindex');
            } else {
                printError('❌ Private page should have noindex');
            }
        }
        
        addTestResult('Home Page SEO', 'PASS');
        return true;
        
    } catch (error) {
        printError(`Exception occurred: ${error.message}`);
        addTestResult('Home Page SEO', 'FAIL', `Exception: ${error.message}`);
        return false;
    }
}

async function runFrontendSEOTests() {
    console.log(`${Colors.BOLD}${Colors.BLUE}Avenue Frontend SEO Tests${Colors.ENDC}`);
    console.log('Frontend URL: http://localhost:3000');
    console.log('=' * 60);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; SEOBot/1.0; +http://example.com/bot)'
    });
    const page = await context.newPage();
    
    try {
        // Test different pages
        await testHomePageSEO(page);
        await testShopPageSEO(page);
        await testStudioPageSEO(page);
        
    } catch (error) {
        printError(`Global error: ${error.message}`);
    } finally {
        await browser.close();
    }
    
    // Print summary
    console.log(`\n${Colors.BOLD}${Colors.BLUE}=== FRONTEND SEO TEST SUMMARY ===${Colors.ENDC}`);
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    
    testResults.forEach(result => {
        if (result.status === 'PASS') {
            printSuccess(result.test);
        } else {
            printError(`${result.test}: ${result.message}`);
        }
    });
    
    console.log(`\n${Colors.BOLD}Total: ${testResults.length} frontend SEO tests${Colors.ENDC}`);
    console.log(`${Colors.GREEN}Passed: ${passed}${Colors.ENDC}`);
    console.log(`${Colors.RED}Failed: ${failed}${Colors.ENDC}`);
    
    if (failed === 0) {
        console.log(`\n${Colors.GREEN}${Colors.BOLD}🎉 All frontend SEO tests passed!${Colors.ENDC}`);
        return true;
    } else {
        console.log(`\n${Colors.RED}${Colors.BOLD}❌ ${failed} frontend SEO test(s) failed${Colors.ENDC}`);
        return false;
    }
}

// Run the tests
runFrontendSEOTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});