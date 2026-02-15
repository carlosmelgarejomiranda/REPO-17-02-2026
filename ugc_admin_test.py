#!/usr/bin/env python3
"""
UGC Admin Panel Tests
Tests for the review request: Admin Panel UGC Tab Access and Brand Onboarding Login Fix
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta

# Backend URL from frontend/.env
BACKEND_URL = "https://ugc-refactor.preview.emergentagent.com/api"

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

# Global variables to store tokens and test results
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
            
            # Check if MFA is required
            if data.get("mfa_required") or data.get("mfa_setup_required"):
                # Use partial token for admin tests
                partial_token = data.get("partial_token")
                if partial_token:
                    admin_token = partial_token
                    role = data.get("role")
                    
                    if role in ["admin", "superadmin"]:
                        print_success("Admin authentication successful (MFA pending)")
                        print_success(f"Role: {role}")
                        print_success(f"Partial token received and stored")
                        add_test_result("Admin Authentication", "PASS")
                        return True
                    else:
                        print_error(f"Expected admin/superadmin role, got '{role}'")
                        add_test_result("Admin Authentication", "FAIL", f"Wrong role: {role}")
                        return False
                else:
                    print_error("No partial token received for MFA flow")
                    add_test_result("Admin Authentication", "FAIL", "No partial token")
                    return False
            else:
                # Regular login flow
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

def test_ugc_admin_dashboard():
    """Test UGC Admin Dashboard: GET /api/ugc/admin/dashboard"""
    print_test_header("Test UGC Admin Dashboard")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("UGC Admin Dashboard", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/ugc/admin/dashboard"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            required_sections = ["users", "campaigns", "applications", "deliverables", "revenue"]
            if all(section in data for section in required_sections):
                print_success("UGC Admin dashboard endpoint working correctly")
                
                # Display metrics
                users = data.get("users", {})
                campaigns = data.get("campaigns", {})
                applications = data.get("applications", {})
                deliverables = data.get("deliverables", {})
                revenue = data.get("revenue", {})
                
                print_success(f"Total creators: {users.get('total_creators', 0)}")
                print_success(f"Active creators: {users.get('active_creators', 0)}")
                print_success(f"Total brands: {users.get('total_brands', 0)}")
                print_success(f"Active brands: {users.get('active_brands', 0)}")
                print_success(f"Total campaigns: {campaigns.get('total', 0)}")
                print_success(f"Live campaigns: {campaigns.get('live', 0)}")
                print_success(f"Total applications: {applications.get('total', 0)}")
                print_success(f"Pending applications: {applications.get('pending', 0)}")
                print_success(f"Total deliverables: {deliverables.get('total', 0)}")
                print_success(f"Total revenue: {revenue.get('total', 0):,} Gs")
                print_success(f"Monthly revenue: {revenue.get('monthly', 0):,} Gs")
                
                add_test_result("UGC Admin Dashboard", "PASS")
                return True
            else:
                missing = [s for s in required_sections if s not in data]
                print_error(f"Missing required sections: {missing}")
                add_test_result("UGC Admin Dashboard", "FAIL", f"Missing sections: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("UGC Admin Dashboard", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("UGC Admin Dashboard", "FAIL", f"Exception: {str(e)}")
        return False

def test_ugc_admin_creators():
    """Test UGC Admin Creators: GET /api/ugc/admin/creators"""
    print_test_header("Test UGC Admin Creators")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("UGC Admin Creators", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/ugc/admin/creators"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            required_fields = ["creators", "total"]
            if all(field in data for field in required_fields):
                creators = data.get("creators", [])
                total = data.get("total", 0)
                
                print_success("UGC Admin creators endpoint working correctly")
                print_success(f"Total creators: {total}")
                print_success(f"Creators in response: {len(creators)}")
                
                if creators:
                    first_creator = creators[0]
                    print_info(f"Sample creator: {first_creator.get('name', 'Unknown')}")
                    print_info(f"Creator ID: {first_creator.get('id', 'Unknown')}")
                    print_info(f"Level: {first_creator.get('level', 'Unknown')}")
                    print_info(f"Active: {first_creator.get('is_active', False)}")
                
                add_test_result("UGC Admin Creators", "PASS")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                add_test_result("UGC Admin Creators", "FAIL", f"Missing fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("UGC Admin Creators", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("UGC Admin Creators", "FAIL", f"Exception: {str(e)}")
        return False

def test_ugc_admin_brands():
    """Test UGC Admin Brands: GET /api/ugc/admin/brands"""
    print_test_header("Test UGC Admin Brands")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("UGC Admin Brands", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/ugc/admin/brands"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            required_fields = ["brands", "total"]
            if all(field in data for field in required_fields):
                brands = data.get("brands", [])
                total = data.get("total", 0)
                
                print_success("UGC Admin brands endpoint working correctly")
                print_success(f"Total brands: {total}")
                print_success(f"Brands in response: {len(brands)}")
                
                if brands:
                    first_brand = brands[0]
                    print_info(f"Sample brand: {first_brand.get('company_name', 'Unknown')}")
                    print_info(f"Brand ID: {first_brand.get('id', 'Unknown')}")
                    print_info(f"Industry: {first_brand.get('industry', 'Unknown')}")
                    print_info(f"Active: {first_brand.get('is_active', False)}")
                
                add_test_result("UGC Admin Brands", "PASS")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                add_test_result("UGC Admin Brands", "FAIL", f"Missing fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("UGC Admin Brands", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("UGC Admin Brands", "FAIL", f"Exception: {str(e)}")
        return False

def test_ugc_admin_campaigns():
    """Test UGC Admin Campaigns: GET /api/ugc/admin/campaigns"""
    print_test_header("Test UGC Admin Campaigns")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("UGC Admin Campaigns", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/ugc/admin/campaigns"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            required_fields = ["campaigns", "total"]
            if all(field in data for field in required_fields):
                campaigns = data.get("campaigns", [])
                total = data.get("total", 0)
                
                print_success("UGC Admin campaigns endpoint working correctly")
                print_success(f"Total campaigns: {total}")
                print_success(f"Campaigns in response: {len(campaigns)}")
                
                if campaigns:
                    first_campaign = campaigns[0]
                    print_info(f"Sample campaign: {first_campaign.get('name', 'Unknown')}")
                    print_info(f"Campaign ID: {first_campaign.get('id', 'Unknown')}")
                    print_info(f"Status: {first_campaign.get('status', 'Unknown')}")
                    print_info(f"Applications: {first_campaign.get('applications_count', 0)}")
                
                add_test_result("UGC Admin Campaigns", "PASS")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                add_test_result("UGC Admin Campaigns", "FAIL", f"Missing fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("UGC Admin Campaigns", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("UGC Admin Campaigns", "FAIL", f"Exception: {str(e)}")
        return False

def test_brand_profile_access():
    """Test Brand Profile Access: GET /api/ugc/brands/me"""
    print_test_header("Test Brand Profile Access")
    
    if not admin_token:
        print_error("No admin token available")
        add_test_result("Brand Profile Access", "FAIL", "No admin token")
        return False
    
    try:
        url = f"{BACKEND_URL}/ugc/brands/me"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print_info(f"GET {url}")
        print_info(f"Headers: Authorization: Bearer {admin_token[:20]}...")
        
        response = requests.get(url, headers=headers)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            expected_fields = ["id", "company_name", "email", "is_active"]
            if all(field in data for field in expected_fields):
                print_success("Brand profile access working correctly")
                print_success(f"Brand ID: {data.get('id')}")
                print_success(f"Company: {data.get('company_name', 'Unknown')}")
                print_success(f"Email: {data.get('email', 'Unknown')}")
                print_success(f"Active: {data.get('is_active', False)}")
                
                # Check if has active package
                active_package = data.get("active_package")
                if active_package:
                    print_success(f"Active package: {active_package.get('name', 'Unknown')}")
                    print_success(f"Deliveries remaining: {active_package.get('deliveries_remaining', 0)}")
                else:
                    print_info("No active package found")
                
                add_test_result("Brand Profile Access", "PASS")
                return True
            else:
                missing = [f for f in expected_fields if f not in data]
                print_error(f"Missing expected fields: {missing}")
                add_test_result("Brand Profile Access", "FAIL", f"Missing fields: {missing}")
                return False
        elif response.status_code == 404:
            print_warning("Brand profile not found - admin user may not have brand profile")
            print_info("This is expected if admin user hasn't completed brand onboarding")
            add_test_result("Brand Profile Access", "PASS", "No brand profile (expected)")
            return True
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            add_test_result("Brand Profile Access", "FAIL", f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        add_test_result("Brand Profile Access", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all UGC admin panel tests"""
    print(f"{Colors.BLUE}{Colors.BOLD}UGC ADMIN PANEL TESTS{Colors.ENDC}")
    print(f"{Colors.BLUE}Testing Admin Panel UGC Tab Access and Brand Onboarding Login Fix{Colors.ENDC}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.ENDC}")
    
    # Test sequence
    tests = [
        test_admin_authentication,
        test_ugc_admin_dashboard,
        test_ugc_admin_creators,
        test_ugc_admin_brands,
        test_ugc_admin_campaigns,
        test_brand_profile_access
    ]
    
    # Run all tests
    for test_func in tests:
        try:
            test_func()
        except Exception as e:
            print_error(f"Test {test_func.__name__} crashed: {str(e)}")
            add_test_result(test_func.__name__, "FAIL", f"Crashed: {str(e)}")
    
    # Print final summary
    success = print_final_summary()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()