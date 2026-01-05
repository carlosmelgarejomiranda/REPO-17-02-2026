/**
 * Google Analytics 4 - Event Tracking Module
 * Avenue E-commerce & Studio Booking Analytics
 */

// GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-NG1PFX6G98';

// Helper function to check if gtag is available
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Helper function to send events
const sendEvent = (eventName, params = {}) => {
  if (isGtagAvailable()) {
    window.gtag('event', eventName, params);
    console.log(`[GA4] Event: ${eventName}`, params);
  }
};

// ==================== PAGE VIEW TRACKING ====================

/**
 * Track page views (for SPA navigation)
 * @param {string} pagePath - The page path (e.g., '/shop', '/studio')
 * @param {string} pageTitle - The page title
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (isGtagAvailable()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle
    });
    console.log(`[GA4] Page View: ${pagePath}`);
  }
};

// ==================== E-COMMERCE TRACKING ====================

/**
 * Track when user views a product
 * @param {Object} product - Product details
 */
export const trackViewItem = (product) => {
  sendEvent('view_item', {
    currency: 'PYG',
    value: product.price,
    items: [{
      item_id: product.sku || product.id,
      item_name: product.name,
      item_brand: product.brand || 'AVENUE',
      item_category: product.category,
      price: product.price,
      quantity: 1
    }]
  });
};

/**
 * Track when user adds item to cart
 * @param {Object} product - Product details
 * @param {number} quantity - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  sendEvent('add_to_cart', {
    currency: 'PYG',
    value: product.price * quantity,
    items: [{
      item_id: product.sku || product.id,
      item_name: product.name,
      item_brand: product.brand || 'AVENUE',
      item_category: product.category,
      price: product.price,
      quantity: quantity
    }]
  });
};

/**
 * Track when user removes item from cart
 * @param {Object} product - Product details
 * @param {number} quantity - Quantity removed
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  sendEvent('remove_from_cart', {
    currency: 'PYG',
    value: product.price * quantity,
    items: [{
      item_id: product.sku || product.id,
      item_name: product.name,
      item_brand: product.brand || 'AVENUE',
      price: product.price,
      quantity: quantity
    }]
  });
};

/**
 * Track when user views cart
 * @param {Array} cartItems - Array of cart items
 * @param {number} cartTotal - Total cart value
 */
export const trackViewCart = (cartItems, cartTotal) => {
  sendEvent('view_cart', {
    currency: 'PYG',
    value: cartTotal,
    items: cartItems.map(item => ({
      item_id: item.sku || item.id,
      item_name: item.name,
      item_brand: item.brand || 'AVENUE',
      price: item.price,
      quantity: item.quantity
    }))
  });
};

/**
 * Track when user begins checkout
 * @param {Array} cartItems - Array of cart items
 * @param {number} cartTotal - Total cart value
 */
export const trackBeginCheckout = (cartItems, cartTotal) => {
  sendEvent('begin_checkout', {
    currency: 'PYG',
    value: cartTotal,
    items: cartItems.map(item => ({
      item_id: item.sku || item.id,
      item_name: item.name,
      item_brand: item.brand || 'AVENUE',
      price: item.price,
      quantity: item.quantity
    }))
  });
};

/**
 * Track when user adds shipping info
 * @param {string} shippingMethod - Shipping method selected
 * @param {number} shippingCost - Shipping cost
 */
export const trackAddShippingInfo = (shippingMethod, shippingCost) => {
  sendEvent('add_shipping_info', {
    currency: 'PYG',
    value: shippingCost,
    shipping_tier: shippingMethod
  });
};

/**
 * Track when user applies coupon
 * @param {string} couponCode - Coupon code applied
 * @param {number} discount - Discount amount
 */
export const trackApplyCoupon = (couponCode, discount) => {
  sendEvent('apply_coupon', {
    coupon: couponCode,
    discount: discount
  });
};

/**
 * Track successful purchase
 * @param {Object} orderData - Order details
 */
export const trackPurchase = (orderData) => {
  sendEvent('purchase', {
    transaction_id: orderData.order_id,
    currency: 'PYG',
    value: orderData.total,
    tax: 0,
    shipping: orderData.shipping_cost || 0,
    coupon: orderData.coupon_code || '',
    items: orderData.items.map(item => ({
      item_id: item.sku || item.id,
      item_name: item.name,
      item_brand: item.brand || 'AVENUE',
      price: item.price,
      quantity: item.quantity
    }))
  });
};

// ==================== STUDIO BOOKING TRACKING ====================

/**
 * Track when user views studio booking page
 */
export const trackViewStudioBooking = () => {
  sendEvent('view_studio_booking', {
    content_type: 'studio_reservation'
  });
};

/**
 * Track when user selects a booking date
 * @param {string} date - Selected date
 */
export const trackSelectBookingDate = (date) => {
  sendEvent('select_booking_date', {
    booking_date: date
  });
};

/**
 * Track when user selects a time slot
 * @param {string} timeSlot - Selected time slot
 * @param {number} duration - Duration in hours
 * @param {number} price - Price for the slot
 */
export const trackSelectTimeSlot = (timeSlot, duration, price) => {
  sendEvent('select_time_slot', {
    time_slot: timeSlot,
    duration_hours: duration,
    value: price,
    currency: 'PYG'
  });
};

/**
 * Track successful studio booking
 * @param {Object} bookingData - Booking details
 */
export const trackStudioBooking = (bookingData) => {
  sendEvent('studio_booking_complete', {
    transaction_id: bookingData.reservation_id,
    currency: 'PYG',
    value: bookingData.total_price,
    booking_date: bookingData.date,
    time_slot: bookingData.time_slot,
    duration_hours: bookingData.duration
  });
};

// ==================== FORM TRACKING ====================

/**
 * Track form submission
 * @param {string} formName - Name of the form
 * @param {Object} formData - Optional form data (without PII)
 */
export const trackFormSubmission = (formName, formData = {}) => {
  sendEvent('form_submission', {
    form_name: formName,
    ...formData
  });
};

/**
 * Track UGC application submission
 * @param {string} platform - Social media platform
 */
export const trackUGCApplication = (platform) => {
  sendEvent('ugc_application', {
    form_name: 'ugc_creators',
    social_platform: platform
  });
};

/**
 * Track brand inquiry submission
 * @param {string} interestType - Type of brand interest
 */
export const trackBrandInquiry = (interestType) => {
  sendEvent('brand_inquiry', {
    form_name: 'tu_marca',
    interest_type: interestType
  });
};

/**
 * Track contact form submission
 */
export const trackContactForm = () => {
  sendEvent('contact_form', {
    form_name: 'contact'
  });
};

// ==================== USER ENGAGEMENT TRACKING ====================

/**
 * Track user login
 * @param {string} method - Login method (email, google, etc.)
 */
export const trackLogin = (method = 'email') => {
  sendEvent('login', {
    method: method
  });
};

/**
 * Track user signup
 * @param {string} method - Signup method
 */
export const trackSignUp = (method = 'email') => {
  sendEvent('sign_up', {
    method: method
  });
};

/**
 * Track search
 * @param {string} searchTerm - Search query
 */
export const trackSearch = (searchTerm) => {
  sendEvent('search', {
    search_term: searchTerm
  });
};

/**
 * Track social share
 * @param {string} platform - Social platform
 * @param {string} contentType - Type of content shared
 */
export const trackShare = (platform, contentType) => {
  sendEvent('share', {
    method: platform,
    content_type: contentType
  });
};

// ==================== COOKIE CONSENT TRACKING ====================

/**
 * Track cookie consent
 * @param {string} consentType - Type of consent given
 */
export const trackCookieConsent = (consentType) => {
  sendEvent('cookie_consent', {
    consent_type: consentType
  });
};

// Export all functions
export default {
  trackPageView,
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
  trackBeginCheckout,
  trackAddShippingInfo,
  trackApplyCoupon,
  trackPurchase,
  trackViewStudioBooking,
  trackSelectBookingDate,
  trackSelectTimeSlot,
  trackStudioBooking,
  trackFormSubmission,
  trackUGCApplication,
  trackBrandInquiry,
  trackContactForm,
  trackLogin,
  trackSignUp,
  trackSearch,
  trackShare,
  trackCookieConsent
};
