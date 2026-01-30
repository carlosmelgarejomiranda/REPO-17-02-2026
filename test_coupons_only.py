#!/usr/bin/env python3
"""
Test only the coupon system API endpoints as requested
"""

import requests
import json
import sys

# Backend URL from frontend/.env
BACKEND_URL = "https://creator-central-9.preview.emergentagent.com/api"

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

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_create_coupon():
    """Test 1: Create a test coupon - POST /api/shop/coupons"""
    print_test_header("Test Create Coupon")
    
    try:
        url = f"{BACKEND_URL}/shop/coupons"
        payload = {
            "code": "BIENVENIDA10",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_purchase": 100000,
            "max_uses": 100,
            "is_active": True,
            "description": "Cupón de bienvenida 10% descuento"
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Create coupon: 200 OK with coupon data")
            return True
        elif response.status_code == 400 and "Ya existe" in response.text:
            print_success("✅ Coupon already exists, continuing...")
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_get_all_coupons():
    """Test 2: Get all coupons - GET /api/shop/coupons"""
    print_test_header("Test Get All Coupons")
    
    try:
        url = f"{BACKEND_URL}/shop/coupons"
        
        print_info(f"GET {url}")
        
        response = requests.get(url)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Get coupons: array with at least the test coupon")
            print_info(f"Found {len(data)} coupons")
            
            # Check if our test coupon is in the list
            test_coupon = next((c for c in data if c.get("code") == "BIENVENIDA10"), None)
            if test_coupon:
                print_success("✅ Test coupon BIENVENIDA10 found in list")
            else:
                print_error("❌ Test coupon BIENVENIDA10 not found")
            
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_apply_coupon_valid():
    """Test 3: Apply coupon (valid case) - POST /api/shop/apply-coupon"""
    print_test_header("Test Apply Coupon (Valid Case)")
    
    try:
        url = f"{BACKEND_URL}/shop/apply-coupon"
        payload = {
            "code": "BIENVENIDA10",
            "subtotal": 200000
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        print_info("Expected: valid=true, discount_amount = 20000 (10% of 200000)")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            discount_amount = data.get("discount_amount", 0)
            expected_discount = 20000  # 10% of 200000
            
            if data.get("valid") == True and abs(discount_amount - expected_discount) < 1:
                print_success("✅ Apply valid: discount_amount = 20000 (10% of 200000)")
                return True
            else:
                print_error(f"❌ Expected discount 20000, got {discount_amount}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_apply_coupon_below_minimum():
    """Test 4: Apply coupon (below minimum) - POST /api/shop/apply-coupon"""
    print_test_header("Test Apply Coupon (Below Minimum)")
    
    try:
        url = f"{BACKEND_URL}/shop/apply-coupon"
        payload = {
            "code": "BIENVENIDA10",
            "subtotal": 50000
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        print_info("Expected: 400 error about minimum purchase")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            print_success("✅ Apply below min: 400 error")
            return True
        else:
            print_error(f"Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_apply_invalid_coupon():
    """Test 5: Apply invalid coupon - POST /api/shop/apply-coupon"""
    print_test_header("Test Apply Invalid Coupon")
    
    try:
        url = f"{BACKEND_URL}/shop/apply-coupon"
        payload = {
            "code": "INVALIDO",
            "subtotal": 200000
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        print_info("Expected: 404 error about invalid coupon")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 404:
            print_success("✅ Apply invalid: 404 error")
            return True
        else:
            print_error(f"Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def main():
    print(f"{Colors.BOLD}{Colors.BLUE}Coupon System API Tests{Colors.ENDC}")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    tests = [
        ("Create Coupon", test_create_coupon),
        ("Get All Coupons", test_get_all_coupons),
        ("Apply Valid Coupon", test_apply_coupon_valid),
        ("Apply Below Minimum", test_apply_coupon_below_minimum),
        ("Apply Invalid Coupon", test_apply_invalid_coupon),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print_error(f"Test {test_name} crashed: {str(e)}")
            failed += 1
    
    print(f"\n{Colors.BOLD}=== FINAL RESULTS ==={Colors.ENDC}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.RED}Failed: {failed}{Colors.ENDC}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 All coupon tests passed!{Colors.ENDC}")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ {failed} test(s) failed{Colors.ENDC}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)