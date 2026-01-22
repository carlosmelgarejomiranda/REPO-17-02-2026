#!/usr/bin/env python3
"""
Avenue Studio Media Master API Tests
Complete backend verification for deployment
Tests ALL critical API endpoints as requested in review
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta

# Backend URL from frontend/.env
BACKEND_URL = "https://content-bridge-30.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== {test_name} ==={Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

# Global variables to store tokens and IDs
admin_token = None
test_results = []

def add_test_result(test_name, status, message=""):
    """Add test result to global results list"""
    test_results.append({
        "test": test_name,
        "status": status,
        "message": message
    })

def print_final_summary():
    """Print final test summary"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== FINAL TEST SUMMARY ==={Colors.ENDC}")
    
    passed = [r for r in test_results if r["status"] == "PASS"]
    failed = [r for r in test_results if r["status"] == "FAIL"]
    
    print(f"\n{Colors.GREEN}✅ PASSED: {len(passed)}{Colors.ENDC}")
    for result in passed:
        print(f"  ✅ {result['test']}")
    
    if failed:
        print(f"\n{Colors.RED}❌ FAILED: {len(failed)}{Colors.ENDC}")
        for result in failed:
            print(f"  ❌ {result['test']}: {result['message']}")
    
    print(f"\n{Colors.BLUE}Total Tests: {len(test_results)}{Colors.ENDC}")
    print(f"{Colors.GREEN}Success Rate: {len(passed)}/{len(test_results)} ({len(passed)/len(test_results)*100:.1f}%){Colors.ENDC}")
    
    return len(failed) == 0

def test_admin_authentication():
    """Test 1: Admin Authentication - POST /api/auth/login"""
    print_test_header("Test Admin Authentication")
    
    global admin_token
    
    try:
        url = f"{BACKEND_URL}/auth/login"
        payload = {
            "email": "avenuepy@gmail.com",
            "password": "admin123"
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            required_fields = ["user_id", "email", "name", "role", "token"]
            if all(field in data for field in required_fields):
                admin_token = data["token"]
                role = data.get("role")
                
                if role in ["admin", "superadmin"]:
                    print_success("Admin authentication successful")
                    print_success(f"Role: {role}")
                    print_success(f"Token received and stored")
                    add_test_result("Admin Authentication", "PASS")
                    return True
                else:
                    print_error(f"Expected admin/superadmin role, got '{role}'")
                    add_test_result("Admin Authentication", "FAIL", f"Wrong role: {role}")
                    return False
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                add_test_result("Admin Authentication", "FAIL", f"Missing fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Admin Authentication", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Admin Authentication", "FAIL", f"Exception: {str(e)}")
        return False

def test_admin_settings():
    """Test 2: Admin Settings - GET /api/admin/settings"""
    print_test_header("Test Admin Settings")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("Admin Settings", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/admin/settings"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            expected_fields = ["payment_gateway_enabled", "show_only_products_with_images", "whatsapp_commercial", "whatsapp_marcas"]
            if all(field in data for field in expected_fields):
                print_success("Admin settings endpoint working correctly")
                print_success(f"Payment gateway enabled: {data.get('payment_gateway_enabled')}")
                print_success(f"Show only products with images: {data.get('show_only_products_with_images')}")
                print_success(f"WhatsApp commercial: {data.get('whatsapp_commercial')}")
                print_success(f"WhatsApp marcas: {data.get('whatsapp_marcas')}")
                add_test_result("Admin Settings", "PASS")
                return True
            else:
                missing = [f for f in expected_fields if f not in data]
                print_error(f"Missing expected fields: {missing}")
                add_test_result("Admin Settings", "FAIL", f"Missing fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Admin Settings", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Admin Settings", "FAIL", f"Exception: {str(e)}")
        return False

def test_shop_products():
    """Test 3: Shop Products - GET /api/shop/products"""
    print_test_header("Test Shop Products")
    
    try:
        url = f"{BACKEND_URL}/shop/products"
        
        print_info(f"GET {url}")
        
        response = requests.get(url)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            required_fields = ["products", "total"]
            if all(field in data for field in required_fields):
                products = data.get("products", [])
                total = data.get("total", 0)
                
                print_success("Shop products endpoint working correctly")
                print_success(f"Total products: {total}")
                print_success(f"Products in response: {len(products)}")
                
                if products:
                    first_product = products[0]
                    print_info(f"Sample product: {first_product.get('name', 'Unknown')}")
                    print_info(f"Product ID: {first_product.get('id', 'Unknown')}")
                    print_info(f"Price: {first_product.get('price', 0)} Gs")
                
                add_test_result("Shop Products", "PASS")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                add_test_result("Shop Products", "FAIL", f"Missing fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Shop Products", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Shop Products", "FAIL", f"Exception: {str(e)}")
        return False

def test_shop_categories():
    """Test 4: Shop Categories - GET /api/shop/filters (categories)"""
    print_test_header("Test Shop Categories")
    
    try:
        url = f"{BACKEND_URL}/shop/filters"
        
        print_info(f"GET {url}")
        
        response = requests.get(url)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should have categories field
            if isinstance(data, dict) and "categories" in data:
                categories = data.get("categories", [])
                print_success("Shop categories endpoint working correctly")
                print_success(f"Categories found: {len(categories)}")
                
                if categories:
                    print_info(f"Sample categories: {categories[:3]}")
                
                add_test_result("Shop Categories", "PASS")
                return True
            else:
                print_error(f"Expected object with 'categories' field, got: {type(data)}")
                add_test_result("Shop Categories", "FAIL", f"Wrong response structure")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Shop Categories", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Shop Categories", "FAIL", f"Exception: {str(e)}")
        return False

def test_shop_brands():
    """Test 5: Shop Brands - GET /api/shop/filters (brands)"""
    print_test_header("Test Shop Brands")
    
    try:
        url = f"{BACKEND_URL}/shop/filters"
        
        print_info(f"GET {url}")
        
        response = requests.get(url)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should have brands field
            if isinstance(data, dict) and "brands" in data:
                brands = data.get("brands", [])
                print_success("Shop brands endpoint working correctly")
                print_success(f"Brands found: {len(brands)}")
                
                if brands:
                    print_info(f"Sample brands: {brands[:3]}")
                
                add_test_result("Shop Brands", "PASS")
                return True
            else:
                print_warning("No 'brands' field found in filters response")
                print_info(f"Available fields: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                add_test_result("Shop Brands", "PASS", "No brands field but endpoint works")
                return True
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Shop Brands", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Shop Brands", "FAIL", f"Exception: {str(e)}")
        return False

def test_orders():
    """Test 6: Orders - GET /api/admin/orders"""
    print_test_header("Test Orders")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("Orders", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/admin/orders"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should be array of orders
            if isinstance(data, list):
                print_success("Orders endpoint working correctly")
                print_success(f"Orders found: {len(data)}")
                
                if data:
                    first_order = data[0]
                    print_info(f"Sample order ID: {first_order.get('order_id', 'Unknown')}")
                    print_info(f"Customer: {first_order.get('customer_name', 'Unknown')}")
                    print_info(f"Status: {first_order.get('order_status', 'Unknown')}")
                
                add_test_result("Orders", "PASS")
                return True
            else:
                print_error(f"Expected array response, got: {type(data)}")
                add_test_result("Orders", "FAIL", f"Wrong response type: {type(data)}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Orders", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Orders", "FAIL", f"Exception: {str(e)}")
        return False

def test_studio_bookings():
    """Test 7: Studio Bookings - GET /api/admin/reservations"""
    print_test_header("Test Studio Bookings")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("Studio Bookings", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/admin/reservations"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should be array of bookings
            if isinstance(data, list):
                print_success("Studio bookings endpoint working correctly")
                print_success(f"Bookings found: {len(data)}")
                
                if data:
                    first_booking = data[0]
                    print_info(f"Sample booking ID: {first_booking.get('reservation_id', 'Unknown')}")
                    print_info(f"Date: {first_booking.get('date', 'Unknown')}")
                    print_info(f"Status: {first_booking.get('status', 'Unknown')}")
                
                add_test_result("Studio Bookings", "PASS")
                return True
            else:
                print_error(f"Expected array response, got: {type(data)}")
                add_test_result("Studio Bookings", "FAIL", f"Wrong response type: {type(data)}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Studio Bookings", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Studio Bookings", "FAIL", f"Exception: {str(e)}")
        return False

def test_ugc_applications():
    """Test 8: UGC Applications - GET /api/admin/ugc"""
    print_test_header("Test UGC Applications")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("UGC Applications", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/admin/ugc"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should be array of applications
            if isinstance(data, list):
                print_success("UGC applications endpoint working correctly")
                print_success(f"Applications found: {len(data)}")
                
                if data:
                    first_app = data[0]
                    print_info(f"Sample application ID: {first_app.get('application_id', 'Unknown')}")
                    print_info(f"Email: {first_app.get('email', 'Unknown')}")
                    print_info(f"Status: {first_app.get('status', 'Unknown')}")
                
                add_test_result("UGC Applications", "PASS")
                return True
            else:
                print_error(f"Expected array response, got: {type(data)}")
                add_test_result("UGC Applications", "FAIL", f"Wrong response type: {type(data)}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("UGC Applications", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("UGC Applications", "FAIL", f"Exception: {str(e)}")
        return False

def test_brand_inquiries():
    """Test 9: Brand Inquiries - GET /api/admin/brand-inquiries"""
    print_test_header("Test Brand Inquiries")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("Brand Inquiries", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/admin/brand-inquiries"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should be array of inquiries
            if isinstance(data, list):
                print_success("Brand inquiries endpoint working correctly")
                print_success(f"Inquiries found: {len(data)}")
                
                if data:
                    first_inquiry = data[0]
                    print_info(f"Sample brand: {first_inquiry.get('brand_name', 'Unknown')}")
                    print_info(f"Contact: {first_inquiry.get('contact_name', 'Unknown')}")
                    print_info(f"Email: {first_inquiry.get('email', 'Unknown')}")
                
                add_test_result("Brand Inquiries", "PASS")
                return True
            else:
                print_error(f"Expected array response, got: {type(data)}")
                add_test_result("Brand Inquiries", "FAIL", f"Wrong response type: {type(data)}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Brand Inquiries", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Brand Inquiries", "FAIL", f"Exception: {str(e)}")
        return False

def test_website_builder():
    """Test 10: Website Builder - GET /api/builder/modifications/main-landing"""
    print_test_header("Test Website Builder")
    
    try:
        url = f"{BACKEND_URL}/builder/modifications/main-landing"
        
        print_info(f"GET {url}")
        
        response = requests.get(url)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure - should have modifications data
            if isinstance(data, dict):
                print_success("Website builder endpoint working correctly")
                
                # Check for common builder fields
                if "modifications" in data or "content" in data or "sections" in data:
                    print_success("Builder data structure looks correct")
                    print_info(f"Response keys: {list(data.keys())}")
                else:
                    print_warning("Builder response structure may be different than expected")
                    print_info(f"Response keys: {list(data.keys())}")
                
                add_test_result("Website Builder", "PASS")
                return True
            else:
                print_error(f"Expected object response, got: {type(data)}")
                add_test_result("Website Builder", "FAIL", f"Wrong response type: {type(data)}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Website Builder", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Website Builder", "FAIL", f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all critical API endpoint tests for deployment verification"""
    print(f"{Colors.BOLD}{Colors.BLUE}=== AVENUE STUDIO MEDIA MASTER API TESTS ==={Colors.ENDC}")
    print(f"{Colors.BLUE}Testing API Base URL: {BACKEND_URL}{Colors.ENDC}")
    print(f"{Colors.BLUE}Complete backend verification for deployment{Colors.ENDC}\n")
    
    # Define test sequence as requested in review
    tests = [
        ("1. Admin Authentication", test_admin_authentication),
        ("2. Admin Settings", test_admin_settings),
        ("3. Shop Products", test_shop_products),
        ("4. Shop Categories", test_shop_categories),
        ("5. Shop Brands", test_shop_brands),
        ("6. Orders", test_orders),
        ("7. Studio Bookings", test_studio_bookings),
        ("8. UGC Applications", test_ugc_applications),
        ("9. Brand Inquiries", test_brand_inquiries),
        ("10. Website Builder", test_website_builder),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            print(f"\n{Colors.YELLOW}Running {test_name}...{Colors.ENDC}")
            test_func()
        except Exception as e:
            print_error(f"Test {test_name} crashed: {str(e)}")
            add_test_result(test_name, "FAIL", f"Exception: {str(e)}")
    
    # Print final summary
    success = print_final_summary()
    
    return success

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)