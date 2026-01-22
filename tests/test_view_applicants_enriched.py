"""
Test Suite: View Applicants with Enriched Creator Data
Tests the admin endpoint /api/ugc/admin/campaigns/{campaign_id}/applications
which returns enriched creator data including social accounts, metrics, and ratings.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"

# Known campaign with applications
CAMPAIGN_ID = "18553c65-08d2-45f9-ac30-6bac89188c53"


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data.get("user", {}).get("email") == ADMIN_EMAIL
        print(f"✓ Admin login successful, token received")


class TestEnrichedApplicationsEndpoint:
    """Test the enriched applications endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_campaign_applications_returns_200(self):
        """Test endpoint returns 200 for valid campaign"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "applications" in data
        assert "total" in data
        print(f"✓ Endpoint returns 200 with {data['total']} applications")
    
    def test_applications_have_creator_data(self):
        """Test each application has enriched creator data"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        applications = data.get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications found for this campaign")
        
        for app in applications:
            # Basic application fields
            assert "id" in app, "Application missing id"
            assert "creator_id" in app, "Application missing creator_id"
            assert "status" in app, "Application missing status"
            
            # Creator object should exist
            creator = app.get("creator")
            assert creator is not None, f"Application {app['id']} missing creator object"
            
            print(f"✓ Application {app['id']} has creator data")
    
    def test_creator_has_social_accounts_info(self):
        """Test creator data includes social accounts (verified_instagram, verified_tiktok)"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        applications = data.get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications found")
        
        for app in applications:
            creator = app.get("creator", {})
            
            # These fields should exist (can be None if not verified)
            assert "verified_instagram" in creator or "social_accounts" in creator, \
                f"Creator missing social account info"
            assert "verified_tiktok" in creator or "social_accounts" in creator, \
                f"Creator missing TikTok info"
            
            # Log what we found
            ig = creator.get("verified_instagram")
            tt = creator.get("verified_tiktok")
            if ig:
                print(f"  ✓ Instagram: @{ig.get('username')} ({ig.get('followers')} followers)")
            if tt:
                print(f"  ✓ TikTok: @{tt.get('username')} ({tt.get('followers')} followers)")
        
        print(f"✓ All {len(applications)} applications have social account info")
    
    def test_creator_has_campaigns_participated(self):
        """Test creator data includes campaigns_participated count"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        applications = data.get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications found")
        
        for app in applications:
            creator = app.get("creator", {})
            assert "campaigns_participated" in creator, \
                f"Creator missing campaigns_participated field"
            assert isinstance(creator["campaigns_participated"], int), \
                "campaigns_participated should be an integer"
            print(f"  ✓ Creator {creator.get('name', 'Unknown')}: {creator['campaigns_participated']} campaigns")
        
        print(f"✓ All creators have campaigns_participated count")
    
    def test_creator_has_avg_metrics(self):
        """Test creator data includes avg_views, avg_reach, avg_interactions"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        applications = data.get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications found")
        
        for app in applications:
            creator = app.get("creator", {})
            
            # Check for average metrics fields
            assert "avg_views" in creator, "Creator missing avg_views"
            assert "avg_reach" in creator, "Creator missing avg_reach"
            assert "avg_interactions" in creator, "Creator missing avg_interactions"
            
            # Values should be numbers (int or float)
            assert isinstance(creator["avg_views"], (int, float)), "avg_views should be numeric"
            assert isinstance(creator["avg_reach"], (int, float)), "avg_reach should be numeric"
            assert isinstance(creator["avg_interactions"], (int, float)), "avg_interactions should be numeric"
            
            print(f"  ✓ Creator metrics: views={creator['avg_views']}, reach={creator['avg_reach']}, interactions={creator['avg_interactions']}")
        
        print(f"✓ All creators have average metrics")
    
    def test_creator_has_rating_info(self):
        """Test creator data includes avg_rating and total_reviews"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        applications = data.get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications found")
        
        for app in applications:
            creator = app.get("creator", {})
            
            # Check for rating fields
            assert "avg_rating" in creator, "Creator missing avg_rating"
            assert "total_reviews" in creator, "Creator missing total_reviews"
            
            # avg_rating should be between 0 and 5
            assert 0 <= creator["avg_rating"] <= 5, f"avg_rating {creator['avg_rating']} out of range"
            assert isinstance(creator["total_reviews"], int), "total_reviews should be integer"
            
            print(f"  ✓ Creator rating: {creator['avg_rating']}/5 ({creator['total_reviews']} reviews)")
        
        print(f"✓ All creators have rating info")
    
    def test_creator_has_level(self):
        """Test creator data includes level (rookie/rising/pro)"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        applications = data.get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications found")
        
        valid_levels = ["rookie", "rising", "trusted", "pro", "elite"]
        
        for app in applications:
            creator = app.get("creator", {})
            level = creator.get("level") or app.get("creator_level")
            
            assert level is not None, "Creator missing level"
            assert level in valid_levels, f"Invalid level: {level}"
            
            print(f"  ✓ Creator {creator.get('name', 'Unknown')}: level={level}")
        
        print(f"✓ All creators have valid level")
    
    def test_invalid_campaign_returns_404(self):
        """Test endpoint returns 404 for non-existent campaign"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/non-existent-campaign-id/applications",
            headers=self.headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid campaign returns 404")
    
    def test_unauthorized_access_returns_401(self):
        """Test endpoint returns 401 without auth token"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthorized access returns {response.status_code}")


class TestApplicationStatusUpdate:
    """Test application status update functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_status_update_endpoint_exists(self):
        """Test the status update endpoint exists"""
        # Get an application ID first
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/campaigns/{CAMPAIGN_ID}/applications",
            headers=self.headers
        )
        
        assert response.status_code == 200
        applications = response.json().get("applications", [])
        
        if len(applications) == 0:
            pytest.skip("No applications to test")
        
        # Just verify the endpoint structure exists (don't actually change status)
        app_id = applications[0]["id"]
        
        # Test with invalid status to verify endpoint exists
        response = requests.put(
            f"{BASE_URL}/api/ugc/admin/applications/{app_id}/status?status=invalid_status",
            headers=self.headers
        )
        
        # Should return 400 or 422 for invalid status, not 404
        assert response.status_code in [200, 400, 422], \
            f"Endpoint may not exist, got {response.status_code}"
        print(f"✓ Status update endpoint exists")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
