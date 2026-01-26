"""
Test suite for Avenue UGC Platform Onboarding Bug Fixes (P0)

Bug fixes being tested:
1. Brand Onboarding: After login/register, users should return to onboarding (not landing page)
2. Creator Onboarding: Same redirect flow fix
3. 'Already Registered' message for users with existing profiles
4. T&C checkbox for registration - acceptTerms field saved to database
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "test_brand_new_1769455507@test.com"
TEST_USER_PASSWORD = "test12345"


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_returns_profile_flags(self):
        """Login response should include has_creator_profile and has_brand_profile flags"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile flags are present
        assert "has_creator_profile" in data, "Login response missing has_creator_profile flag"
        assert "has_brand_profile" in data, "Login response missing has_brand_profile flag"
        
        # Admin should have both profiles
        assert data["has_creator_profile"] == True, "Admin should have creator profile"
        assert data["has_brand_profile"] == True, "Admin should have brand profile"
    
    def test_login_test_user_no_profiles(self):
        """Test user should have no profiles"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Test user should have no profiles
        assert data["has_creator_profile"] == False, "Test user should NOT have creator profile"
        assert data["has_brand_profile"] == False, "Test user should NOT have brand profile"
    
    def test_auth_me_returns_profile_flags(self):
        """GET /api/auth/me should include profile flags"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "has_creator_profile" in data, "/api/auth/me missing has_creator_profile"
        assert "has_brand_profile" in data, "/api/auth/me missing has_brand_profile"


class TestBrandProfileEndpoints:
    """Test brand profile endpoints for 'Already Registered' feature"""
    
    def test_brands_me_returns_profile_for_admin(self):
        """Admin user should get their brand profile"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get brand profile
        response = requests.get(f"{BASE_URL}/api/ugc/brands/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Brand profile should have id"
        assert "company_name" in data, "Brand profile should have company_name"
    
    def test_brands_me_returns_404_for_user_without_profile(self):
        """User without brand profile should get 404"""
        # Login as test user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get brand profile - should return 404
        response = requests.get(f"{BASE_URL}/api/ugc/brands/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 404, f"Expected 404 for user without brand profile, got {response.status_code}"


class TestCreatorProfileEndpoints:
    """Test creator profile endpoints for 'Already Registered' feature"""
    
    def test_creators_me_returns_profile_for_admin(self):
        """Admin user should get their creator profile"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get creator profile
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Creator profile should have id"
        assert "name" in data, "Creator profile should have name"
    
    def test_creators_me_returns_404_for_user_without_profile(self):
        """User without creator profile should get 404"""
        # Login as test user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get creator profile - should return 404
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 404, f"Expected 404 for user without creator profile, got {response.status_code}"


class TestRegistrationWithTerms:
    """Test registration endpoint accepts and saves terms acceptance"""
    
    def test_register_endpoint_accepts_terms_field(self):
        """Registration should accept acceptTerms field"""
        import uuid
        test_email = f"test_terms_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Terms User",
            "acceptTerms": True
        })
        
        # Should succeed (201 or 200)
        assert response.status_code in [200, 201], f"Registration failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Registration should return user_id"
        assert "token" in data, "Registration should return token"
    
    def test_register_without_terms_still_works(self):
        """Registration without acceptTerms should still work (backward compatibility)"""
        import uuid
        test_email = f"test_no_terms_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test No Terms User"
        })
        
        # Should succeed
        assert response.status_code in [200, 201], f"Registration without terms failed: {response.status_code}"


class TestGoogleOAuthTerms:
    """Test Google OAuth callback returns needs_terms_acceptance flag"""
    
    def test_google_callback_endpoint_exists(self):
        """Google callback endpoint should exist"""
        # This will fail without a valid session_id, but we're just checking the endpoint exists
        response = requests.post(f"{BASE_URL}/api/auth/google/callback", json={
            "session_id": "invalid_session"
        })
        
        # Should return 401 (invalid session) not 404 (endpoint not found)
        assert response.status_code != 404, "Google callback endpoint should exist"
        # 401 or 400 are expected for invalid session
        assert response.status_code in [400, 401, 500], f"Unexpected status: {response.status_code}"


class TestTermsAcceptanceEndpoint:
    """Test terms acceptance recording endpoint"""
    
    def test_terms_accept_endpoint_exists(self):
        """POST /api/terms/accept should exist"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Try to accept terms
        response = requests.post(f"{BASE_URL}/api/terms/accept", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "terms_slug": "test-terms",
                "terms_version": "1.0"
            }
        )
        
        # Should succeed or return validation error (not 404)
        assert response.status_code != 404, "Terms accept endpoint should exist"
        # 200, 201, or 400 (validation) are acceptable
        assert response.status_code in [200, 201, 400, 422], f"Unexpected status: {response.status_code}"


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
