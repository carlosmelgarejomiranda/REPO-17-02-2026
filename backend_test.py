#!/usr/bin/env python3
"""
Avenue Studio Booking System API Tests
Tests the core booking flow and admin functionality
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Backend URL from frontend/.env
BACKEND_URL = "https://editorial-avenue.preview.emergentagent.com/api"

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
user_token = None
admin_token = None
reservation_id = None

def test_availability_endpoint():
    """Test 1: Test Availability Endpoint"""
    print_test_header("Test Availability Endpoint")
    
    try:
        url = f"{BACKEND_URL}/reservations/availability/2025-01-15"
        response = requests.get(url)
        
        print_info(f"GET {url}")
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            if "slots" in data and isinstance(data["slots"], list):
                slots = data["slots"]
                
                # Check if we have slots for hours 9-21 (13 slots total)
                if len(slots) >= 13:
                    # Check first and last slots
                    first_slot = slots[0]
                    last_slot = slots[-1]
                    
                    if (first_slot.get("hour") == 9 and 
                        last_slot.get("hour") == 21 and
                        "time" in first_slot and 
                        "available" in first_slot):
                        print_success("Availability endpoint working correctly")
                        print_success(f"Found {len(slots)} time slots from 9:00 to 21:00")
                        return True
                    else:
                        print_error("Slots don't cover expected hours 9-21")
                        return False
                else:
                    print_error(f"Expected at least 13 slots, got {len(slots)}")
                    return False
            else:
                print_error("Response missing 'slots' array")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_user_registration():
    """Test 2: Test User Registration"""
    print_test_header("Test User Registration")
    
    global user_token
    
    try:
        url = f"{BACKEND_URL}/auth/register"
        payload = {
            "email": "test@example.com",
            "password": "test123",
            "name": "Test User",
            "phone": "+595971234567"
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
                user_token = data["token"]
                print_success("User registration successful")
                print_success(f"User ID: {data['user_id']}")
                print_success(f"Role: {data['role']}")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_user_login():
    """Test 3: Test User Login"""
    print_test_header("Test User Login")
    
    global user_token
    
    try:
        url = f"{BACKEND_URL}/auth/login"
        payload = {
            "email": "test@example.com",
            "password": "test123"
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
                user_token = data["token"]
                print_success("User login successful")
                print_success(f"Token received and stored")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_error(f"Missing required fields: {missing}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_create_reservation_guest():
    """Test 4: Test Create Reservation (Guest)"""
    print_test_header("Test Create Reservation (Guest)")
    
    global reservation_id
    
    try:
        url = f"{BACKEND_URL}/reservations"
        payload = {
            "date": "2025-01-15",
            "start_time": "10:00",
            "duration_hours": 2,
            "name": "Juan Perez",
            "phone": "+595971234567",
            "email": "juan@test.com",
            "company": "Test Company",
            "razon_social": "Test SA",
            "ruc": "80012345-6"
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            if ("reservation_id" in data and 
                data.get("status") == "confirmed" and 
                data.get("price") == 250000):
                reservation_id = data["reservation_id"]
                print_success("Guest reservation created successfully")
                print_success(f"Reservation ID: {reservation_id}")
                print_success(f"Price: {data['price']} Gs")
                print_success(f"Status: {data['status']}")
                return True
            else:
                print_error("Response missing required fields or incorrect values")
                print_error(f"Expected: status='confirmed', price=250000")
                print_error(f"Got: status='{data.get('status')}', price={data.get('price')}")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_admin_registration():
    """Test 5: Test Admin Registration (with admin email)"""
    print_test_header("Test Admin Registration")
    
    global admin_token
    
    try:
        url = f"{BACKEND_URL}/auth/register"
        payload = {
            "email": "avenuepy@gmail.com",
            "password": "admin123",
            "name": "Avenue Admin",
            "phone": "+595976691520"
        }
        
        print_info(f"POST {url}")
        print_info(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate admin role
            if data.get("role") == "admin":
                admin_token = data["token"]
                print_success("Admin registration successful")
                print_success(f"Role: {data['role']}")
                return True
            else:
                print_error(f"Expected role 'admin', got '{data.get('role')}'")
                return False
        elif response.status_code == 400 and "already registered" in response.text:
            # Admin already exists, try to login
            print_warning("Admin already registered, attempting login...")
            return test_admin_login()
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_admin_login():
    """Helper: Test Admin Login"""
    global admin_token
    
    try:
        url = f"{BACKEND_URL}/auth/login"
        payload = {
            "email": "avenuepy@gmail.com",
            "password": "admin123"
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("role") == "admin":
                admin_token = data["token"]
                print_success("Admin login successful")
                return True
            else:
                print_error(f"Expected admin role, got '{data.get('role')}'")
                return False
        else:
            print_error(f"Admin login failed: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Admin login exception: {str(e)}")
        return False

def test_admin_get_all_reservations():
    """Test 6: Test Admin Get All Reservations"""
    print_test_header("Test Admin Get All Reservations")
    
    if not admin_token:
        print_error("No admin token available")
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
            
            if isinstance(data, list):
                print_success(f"Admin get all reservations successful")
                print_success(f"Found {len(data)} reservations")
                
                # Check if our test reservation is in the list
                if reservation_id:
                    found_reservation = any(r.get("reservation_id") == reservation_id for r in data)
                    if found_reservation:
                        print_success("Test reservation found in admin list")
                    else:
                        print_warning("Test reservation not found in admin list")
                
                return True
            else:
                print_error("Expected array response")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_availability_after_booking():
    """Test 7: Test Availability After Booking"""
    print_test_header("Test Availability After Booking")
    
    try:
        url = f"{BACKEND_URL}/reservations/availability/2025-01-15"
        response = requests.get(url)
        
        print_info(f"GET {url}")
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Response: {json.dumps(data, indent=2)}")
            
            if "slots" in data:
                slots = data["slots"]
                
                # Check hours 10 and 11 should be unavailable (blocked by 2-hour reservation)
                hour_10_slot = next((s for s in slots if s.get("hour") == 10), None)
                hour_11_slot = next((s for s in slots if s.get("hour") == 11), None)
                
                if hour_10_slot and hour_11_slot:
                    hour_10_available = hour_10_slot.get("available", True)
                    hour_11_available = hour_11_slot.get("available", True)
                    
                    print_info(f"Hour 10:00 available: {hour_10_available}")
                    print_info(f"Hour 11:00 available: {hour_11_available}")
                    
                    if not hour_10_available and not hour_11_available:
                        print_success("Hours 10 and 11 correctly blocked by reservation")
                        return True
                    else:
                        print_error("Hours 10 and 11 should be blocked but are still available")
                        return False
                else:
                    print_error("Could not find hour 10 or 11 slots")
                    return False
            else:
                print_error("Response missing 'slots' array")
                return False
        else:
            print_error(f"Failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print(f"{Colors.BOLD}{Colors.BLUE}Avenue Studio Booking System API Tests{Colors.ENDC}")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    tests = [
        ("Test Availability Endpoint", test_availability_endpoint),
        ("Test User Registration", test_user_registration),
        ("Test User Login", test_user_login),
        ("Test Create Reservation (Guest)", test_create_reservation_guest),
        ("Test Admin Registration", test_admin_registration),
        ("Test Admin Get All Reservations", test_admin_get_all_reservations),
        ("Test Availability After Booking", test_availability_after_booking),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test {test_name} crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== TEST SUMMARY ==={Colors.ENDC}")
    passed = 0
    failed = 0
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}")
            passed += 1
        else:
            print_error(f"{test_name}")
            failed += 1
    
    print(f"\n{Colors.BOLD}Total: {len(results)} tests{Colors.ENDC}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.RED}Failed: {failed}{Colors.ENDC}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 All tests passed!{Colors.ENDC}")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ {failed} test(s) failed{Colors.ENDC}")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)