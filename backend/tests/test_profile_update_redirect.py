"""
Test Profile Update Redirect Feature
Tests for forced redirect of creators with incomplete profiles to onboarding

Features tested:
1. GET /api/ugc/creators/me returns needs_profile_update=true for incomplete profiles
2. PUT /api/ugc/creators/me/complete-profile updates existing profiles correctly
3. Profile completeness check function
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"


class TestProfileCompletenessCheck:
    """Tests for profile completeness check functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_creator_me_returns_needs_profile_update(self):
        """Test GET /api/ugc/creators/me returns needs_profile_update field"""
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
        assert response.status_code == 200, f"Failed to get creator profile: {response.text}"
        
        data = response.json()
        
        # Verify completeness fields are present
        assert "profile_complete" in data, "profile_complete field missing"
        assert "needs_profile_update" in data, "needs_profile_update field missing"
        assert "missing_fields" in data, "missing_fields field missing"
        
        print(f"Profile complete: {data['profile_complete']}")
        print(f"Needs profile update: {data['needs_profile_update']}")
        print(f"Missing fields: {data['missing_fields']}")
    
    def test_incomplete_profile_has_needs_update_true(self):
        """Test that profile missing required fields has needs_profile_update=true"""
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check if any required fields are missing
        required_fields = ['phone', 'birth_date', 'document_id', 'gender']
        missing = [f for f in required_fields if not data.get(f)]
        
        if missing:
            assert data["needs_profile_update"] == True, "needs_profile_update should be True when fields are missing"
            assert data["profile_complete"] == False, "profile_complete should be False when fields are missing"
            assert len(data["missing_fields"]) > 0, "missing_fields should not be empty"
            print(f"Correctly identified missing fields: {data['missing_fields']}")
        else:
            assert data["needs_profile_update"] == False, "needs_profile_update should be False when all fields present"
            assert data["profile_complete"] == True, "profile_complete should be True when all fields present"
    
    def test_missing_fields_list_accuracy(self):
        """Test that missing_fields list accurately reflects missing data"""
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        missing_fields = data.get("missing_fields", [])
        
        # Verify each field in missing_fields is actually missing
        for field in missing_fields:
            assert not data.get(field), f"Field {field} is in missing_fields but has value: {data.get(field)}"
        
        print(f"Missing fields verified: {missing_fields}")


class TestCompleteProfileEndpoint:
    """Tests for PUT /api/ugc/creators/me/complete-profile endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get current profile to preserve existing data
        profile_res = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
        self.current_profile = profile_res.json() if profile_res.status_code == 200 else {}
    
    def test_complete_profile_endpoint_exists(self):
        """Test that complete-profile endpoint exists and accepts PUT"""
        # Send minimal valid data
        birth_date = (datetime.now() - timedelta(days=365*25)).strftime("%Y-%m-%d")
        
        payload = {
            "name": self.current_profile.get("name", "Test Creator"),
            "birth_date": birth_date,
            "gender": "female",
            "document_id": "12345678",
            "country": "PY",
            "city": "Asunción",
            "phone_country_code": "+595",
            "phone": "976750974",
            "categories": self.current_profile.get("categories", ["Lifestyle"]),
            "bio": self.current_profile.get("bio", "Test bio"),
            "instagram_username": "testuser",
            "terms_accepted": True,
            "terms_version": "1.0"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ugc/creators/me/complete-profile",
            headers=self.headers,
            json=payload
        )
        
        # Should return 200 or 400 (validation error), not 404 or 405
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"Endpoint response: {response.status_code} - {response.text[:200]}")
    
    def test_complete_profile_requires_auth(self):
        """Test that complete-profile endpoint requires authentication"""
        payload = {
            "name": "Test",
            "birth_date": "1990-01-01",
            "gender": "female",
            "document_id": "12345678",
            "country": "PY",
            "city": "Asunción",
            "phone_country_code": "+595",
            "phone": "976750974",
            "categories": ["Lifestyle"],
            "terms_accepted": True,
            "terms_version": "1.0"
        }
        
        # Request without auth header
        response = requests.put(
            f"{BASE_URL}/api/ugc/creators/me/complete-profile",
            json=payload
        )
        
        assert response.status_code in [401, 403], f"Should require auth, got: {response.status_code}"
    
    def test_complete_profile_validates_age(self):
        """Test that complete-profile validates age (must be 18+)"""
        # Use a birth date that makes user under 18
        underage_birth = (datetime.now() - timedelta(days=365*16)).strftime("%Y-%m-%d")
        
        payload = {
            "name": "Test Creator",
            "birth_date": underage_birth,
            "gender": "female",
            "document_id": "12345678",
            "country": "PY",
            "city": "Asunción",
            "phone_country_code": "+595",
            "phone": "976750974",
            "categories": ["Lifestyle"],
            "bio": "Test bio",
            "instagram_username": "testuser",
            "terms_accepted": True,
            "terms_version": "1.0"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ugc/creators/me/complete-profile",
            headers=self.headers,
            json=payload
        )
        
        assert response.status_code == 400, f"Should reject underage user, got: {response.status_code}"
        assert "18" in response.text.lower() or "mayor" in response.text.lower(), "Error should mention age requirement"
        print(f"Age validation working: {response.json()}")
    
    def test_complete_profile_requires_terms_acceptance(self):
        """Test that complete-profile requires terms acceptance"""
        birth_date = (datetime.now() - timedelta(days=365*25)).strftime("%Y-%m-%d")
        
        payload = {
            "name": "Test Creator",
            "birth_date": birth_date,
            "gender": "female",
            "document_id": "12345678",
            "country": "PY",
            "city": "Asunción",
            "phone_country_code": "+595",
            "phone": "976750974",
            "categories": ["Lifestyle"],
            "bio": "Test bio",
            "instagram_username": "testuser",
            "terms_accepted": False,  # Not accepted
            "terms_version": "1.0"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ugc/creators/me/complete-profile",
            headers=self.headers,
            json=payload
        )
        
        assert response.status_code == 400, f"Should reject without terms, got: {response.status_code}"
        assert "términos" in response.text.lower() or "terms" in response.text.lower(), "Error should mention terms"
        print(f"Terms validation working: {response.json()}")


class TestProfileUpdateFlow:
    """End-to-end tests for profile update flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_profile_has_existing_data(self):
        """Test that existing profile data is available for pre-filling"""
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check that existing data is present
        assert data.get("name"), "Name should be present"
        assert data.get("categories"), "Categories should be present"
        
        # Check social networks
        social_networks = data.get("social_networks", [])
        social_accounts = data.get("social_accounts", {})
        
        print(f"Existing name: {data.get('name')}")
        print(f"Existing categories: {data.get('categories')}")
        print(f"Existing social networks: {social_networks}")
        print(f"Existing social accounts: {list(social_accounts.keys())}")
    
    def test_successful_profile_update(self):
        """Test successful profile update with all required fields"""
        # Get current profile
        profile_res = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
        current = profile_res.json()
        
        birth_date = (datetime.now() - timedelta(days=365*25)).strftime("%Y-%m-%d")
        
        # Build payload preserving existing data
        payload = {
            "name": current.get("name", "Test Creator"),
            "birth_date": birth_date,
            "gender": "female",
            "document_id": "TEST_DOC_12345",
            "country": "PY",
            "city": current.get("city", "Asunción"),
            "phone_country_code": "+595",
            "phone": current.get("phone", "976750974").replace("+595", ""),
            "categories": current.get("categories", ["Lifestyle"]),
            "bio": current.get("bio", "Test bio"),
            "instagram_username": "testuser",
            "terms_accepted": True,
            "terms_version": "1.0"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ugc/creators/me/complete-profile",
            headers=self.headers,
            json=payload
        )
        
        print(f"Update response: {response.status_code} - {response.text}")
        
        if response.status_code == 200:
            # Verify profile is now complete
            verify_res = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers=self.headers)
            verify_data = verify_res.json()
            
            assert verify_data.get("birth_date") == birth_date, "Birth date should be updated"
            assert verify_data.get("gender") == "female", "Gender should be updated"
            assert verify_data.get("document_id") == "TEST_DOC_12345", "Document ID should be updated"
            
            print(f"Profile updated successfully!")
            print(f"New profile_complete: {verify_data.get('profile_complete')}")
            print(f"New needs_profile_update: {verify_data.get('needs_profile_update')}")


class TestLoginResponse:
    """Tests for login response with creator profile status"""
    
    def test_login_returns_has_creator_profile(self):
        """Test that login response includes has_creator_profile flag"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "has_creator_profile" in data, "Login should return has_creator_profile"
        print(f"has_creator_profile: {data.get('has_creator_profile')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
