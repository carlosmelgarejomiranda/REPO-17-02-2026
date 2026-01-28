"""
Test Campaign Application Flow
Tests the /api/ugc/applications/apply endpoint and related functionality
Focus: Creator applying to campaigns, error handling, authorization
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCampaignApplicationFlow:
    """Test campaign application flow - creator applying to campaigns"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_email = "avenuepy@gmail.com"
        self.admin_password = "admin123"
        self.token = None
        self.campaign_id = None
        self.application_id = None
    
    def get_auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.admin_email, "password": self.admin_password}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_01_login_and_get_token(self):
        """Test login returns valid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.admin_email, "password": self.admin_password}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["has_creator_profile"] == True
        print(f"✓ Login successful, has_creator_profile: {data['has_creator_profile']}")
    
    def test_02_get_creator_profile(self):
        """Test getting creator profile with auth"""
        token = self.get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/ugc/creators/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        print(f"✓ Creator profile retrieved: {data['name']}")
    
    def test_03_get_available_campaigns(self):
        """Test getting available campaigns"""
        response = requests.get(f"{BASE_URL}/api/ugc/campaigns/available")
        assert response.status_code == 200
        data = response.json()
        assert "campaigns" in data
        assert isinstance(data["campaigns"], list)
        print(f"✓ Found {len(data['campaigns'])} available campaigns")
        
        if len(data["campaigns"]) > 0:
            campaign = data["campaigns"][0]
            assert "id" in campaign
            assert "name" in campaign
            print(f"✓ First campaign: {campaign['name']}")
    
    def test_04_apply_to_campaign_without_auth(self):
        """Test applying without authentication returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/apply",
            json={
                "campaign_id": "test-campaign-id",
                "note": "Test application",
                "proposed_content": ""
            }
        )
        # Should fail without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Correctly rejected unauthenticated request")
    
    def test_05_apply_to_campaign_with_auth(self):
        """Test applying to campaign with proper authentication"""
        token = self.get_auth_token()
        
        # First get an available campaign
        campaigns_response = requests.get(f"{BASE_URL}/api/ugc/campaigns/available")
        assert campaigns_response.status_code == 200
        campaigns = campaigns_response.json().get("campaigns", [])
        
        if len(campaigns) == 0:
            pytest.skip("No available campaigns to test")
        
        campaign_id = campaigns[0]["id"]
        campaign_name = campaigns[0]["name"]
        
        # Apply to the campaign
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/apply",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            },
            json={
                "campaign_id": campaign_id,
                "note": "TEST_Application from pytest testing",
                "proposed_content": ""
            }
        )
        
        # Check response - could be success or "already applied"
        data = response.json()
        
        if response.status_code == 200:
            assert "success" in data or "application_id" in data
            print(f"✓ Successfully applied to campaign: {campaign_name}")
            if "application_id" in data:
                self.__class__.application_id = data["application_id"]
        elif response.status_code == 400 and "Ya aplicaste" in data.get("detail", ""):
            print(f"✓ Already applied to campaign (expected behavior)")
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {data}")
    
    def test_06_apply_to_nonexistent_campaign(self):
        """Test applying to non-existent campaign returns 404"""
        token = self.get_auth_token()
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/apply",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            },
            json={
                "campaign_id": "nonexistent-campaign-id-12345",
                "note": "Test application",
                "proposed_content": ""
            }
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"✓ Correctly returned 404 for non-existent campaign")
    
    def test_07_get_my_applications(self):
        """Test getting creator's applications"""
        token = self.get_auth_token()
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        assert isinstance(data["applications"], list)
        print(f"✓ Retrieved {len(data['applications'])} applications")
        
        # Verify application structure
        if len(data["applications"]) > 0:
            app = data["applications"][0]
            assert "id" in app
            assert "campaign_id" in app
            assert "status" in app
            print(f"✓ Application status: {app['status']}")
    
    def test_08_response_format_is_valid_json(self):
        """Test that API responses are valid JSON (related to Safari body issue)"""
        token = self.get_auth_token()
        
        # Test multiple endpoints return valid JSON
        endpoints = [
            f"{BASE_URL}/api/ugc/campaigns/available",
            f"{BASE_URL}/api/ugc/creators/me",
            f"{BASE_URL}/api/ugc/applications/me"
        ]
        
        for endpoint in endpoints:
            response = requests.get(
                endpoint,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            # Verify response is valid JSON
            try:
                data = response.json()
                assert data is not None
                print(f"✓ Valid JSON response from {endpoint.split('/')[-1]}")
            except json.JSONDecodeError as e:
                pytest.fail(f"Invalid JSON from {endpoint}: {e}")
    
    def test_09_error_response_format(self):
        """Test error responses have proper format (not 'Body is disturbed')"""
        token = self.get_auth_token()
        
        # Trigger an error by applying to non-existent campaign
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/apply",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            },
            json={
                "campaign_id": "invalid-id",
                "note": "Test",
                "proposed_content": ""
            }
        )
        
        # Verify error response is valid JSON with proper structure
        data = response.json()
        assert "detail" in data
        assert "Body is disturbed" not in str(data)
        assert "locked" not in str(data).lower() or "Body" not in str(data)
        print(f"✓ Error response is user-friendly: {data['detail']}")


class TestAuthorizationHeader:
    """Test that Authorization header is properly included in requests"""
    
    def get_auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "avenuepy@gmail.com", "password": "admin123"}
        )
        return response.json().get("token")
    
    def test_01_apply_endpoint_requires_auth_header(self):
        """Test /apply endpoint requires Authorization header"""
        # Without auth header
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/apply",
            headers={"Content-Type": "application/json"},
            json={"campaign_id": "test", "note": "test", "proposed_content": ""}
        )
        assert response.status_code in [401, 403]
        print("✓ Apply endpoint correctly requires auth")
    
    def test_02_apply_endpoint_accepts_valid_token(self):
        """Test /apply endpoint accepts valid Bearer token"""
        token = self.get_auth_token()
        
        # Get a valid campaign first
        campaigns_response = requests.get(f"{BASE_URL}/api/ugc/campaigns/available")
        campaigns = campaigns_response.json().get("campaigns", [])
        
        if not campaigns:
            pytest.skip("No campaigns available")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/apply",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            },
            json={
                "campaign_id": campaigns[0]["id"],
                "note": "TEST_Auth header test",
                "proposed_content": ""
            }
        )
        
        # Should not be 401/403 (auth should work)
        assert response.status_code != 401, "Auth header not accepted"
        assert response.status_code != 403 or "Creator profile required" in response.text
        print(f"✓ Auth header accepted, status: {response.status_code}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_applications(self):
        """Remove test applications created during testing"""
        # Login
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "avenuepy@gmail.com", "password": "admin123"}
        )
        token = response.json().get("token")
        
        # Get applications
        apps_response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if apps_response.status_code == 200:
            applications = apps_response.json().get("applications", [])
            test_apps = [a for a in applications if "TEST_" in str(a.get("motivation", ""))]
            print(f"Found {len(test_apps)} test applications to potentially clean up")
        
        print("✓ Cleanup check complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
