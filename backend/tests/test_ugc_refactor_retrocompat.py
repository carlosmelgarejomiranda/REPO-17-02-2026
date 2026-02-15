"""
UGC Platform - Retrocompatibility Tests for Database Schema Refactoring

Tests the refactored UGC endpoints to ensure they work with both:
- Old schema: uses brand_id/creator_id/campaign_id as PKs
- New schema: uses 'id' as universal PK

Test database uses old schema, so these tests verify retrocompatibility.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CREATOR_EMAIL = "testcreator@example.com"
CREATOR_PASSWORD = "test123"
BRAND_EMAIL = "testbrand@example.com"
BRAND_PASSWORD = "brand123"


def get_creator_token():
    """Get creator authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CREATOR_EMAIL,
        "password": CREATOR_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    return None


def get_brand_token():
    """Get brand authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BRAND_EMAIL,
        "password": BRAND_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    return None


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_creator_login(self):
        """Test creator can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CREATOR_EMAIL,
            "password": CREATOR_PASSWORD
        })
        assert response.status_code == 200, f"Creator login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user_id" in data, "user_id not returned"
        assert data["email"] == CREATOR_EMAIL
        assert data["role"] == "creator"
        assert data["has_creator_profile"] == True
    
    def test_brand_login(self):
        """Test brand can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BRAND_EMAIL,
            "password": BRAND_PASSWORD
        })
        assert response.status_code == 200, f"Brand login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not returned"
        assert data["email"] == BRAND_EMAIL
        assert data["role"] == "brand"
        assert data["has_brand_profile"] == True
    
    def test_invalid_login(self):
        """Test invalid credentials return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestBrandDashboard:
    """Test Brand Dashboard endpoint - /api/ugc/brands/me/dashboard"""
    
    def test_brand_dashboard_returns_profile(self):
        """Dashboard should return brand profile"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        
        data = response.json()
        assert "profile" in data, "Profile not in response"
        
        profile = data["profile"]
        # Old schema uses brand_id, new uses id - both should work
        assert "brand_id" in profile or "id" in profile, "No brand identifier in profile"
        assert "user_id" in profile, "user_id not in profile"
    
    def test_brand_dashboard_returns_stats(self):
        """Dashboard should return campaign statistics"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "stats" in data, "Stats not in response"
        
        stats = data["stats"]
        assert "total_campaigns" in stats
        assert "active_campaigns" in stats
        assert "pending_reviews" in stats
        assert "deliveries_remaining" in stats
    
    def test_brand_dashboard_returns_campaigns(self):
        """Dashboard should return campaigns list with stats"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "campaigns" in data, "Campaigns not in response"
        
        campaigns = data["campaigns"]
        if len(campaigns) > 0:
            campaign = campaigns[0]
            # Each campaign should have an id field (retrocompat adds it)
            assert "id" in campaign or "campaign_id" in campaign, "No campaign identifier"
            assert "name" in campaign
            assert "status" in campaign
            assert "applications_count" in campaign
            assert "confirmed_count" in campaign
    
    def test_brand_dashboard_returns_recent_applications(self):
        """Dashboard should return recent applications"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "recent_applications" in data, "Recent applications not in response"
    
    def test_brand_dashboard_requires_auth(self):
        """Dashboard should require authentication"""
        response = requests.get(f"{BASE_URL}/api/ugc/brands/me/dashboard")
        assert response.status_code == 401


class TestBrandCampaignsList:
    """Test Brand Campaigns List endpoint - /api/ugc/campaigns/me/all"""
    
    def test_get_my_campaigns(self):
        """Brand should be able to list their campaigns"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/me/all",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get campaigns failed: {response.text}"
        
        data = response.json()
        assert "campaigns" in data, "Campaigns not in response"
        
        campaigns = data["campaigns"]
        assert isinstance(campaigns, list)
        
        if len(campaigns) > 0:
            campaign = campaigns[0]
            # Retrocompat: should have id field
            assert "id" in campaign or "campaign_id" in campaign
            assert "name" in campaign
            assert "brand_id" in campaign
            assert "applications_count" in campaign
    
    def test_get_my_campaigns_requires_brand_profile(self):
        """Creator without brand profile should get 403"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/me/all",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403


class TestCampaignDetail:
    """Test Campaign Detail endpoint - /api/ugc/campaigns/{id}"""
    
    def test_get_campaign_detail_with_brand_info(self):
        """Campaign detail should include brand information"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        # First get available campaigns to get a campaign_id
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        campaigns = data.get("campaigns", [])
        
        if len(campaigns) == 0:
            pytest.skip("No available campaigns to test")
        
        campaign_id = campaigns[0].get("id") or campaigns[0].get("campaign_id")
        
        # Get campaign detail
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{campaign_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Campaign detail failed: {response.text}"
        
        data = response.json()
        assert "brand" in data, "Brand info not in campaign detail"
        
        brand = data["brand"]
        if brand:
            # company_name should be set (retrocompat maps brand_name to company_name)
            assert "company_name" in brand, "company_name not in brand info"
    
    def test_get_campaign_detail_shows_slots_available(self):
        """Campaign detail should show available slots"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        campaigns = response.json().get("campaigns", [])
        
        if len(campaigns) == 0:
            pytest.skip("No available campaigns")
        
        campaign_id = campaigns[0].get("id") or campaigns[0].get("campaign_id")
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{campaign_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "slots_available" in data, "slots_available not in response"
        assert isinstance(data["slots_available"], int)
    
    def test_campaign_not_found(self):
        """Non-existent campaign should return 404"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/non-existent-id-12345",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404


class TestAvailableCampaigns:
    """Test Available Campaigns endpoint - /api/ugc/campaigns/available"""
    
    def test_get_available_campaigns(self):
        """Creator should be able to list available campaigns"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Available campaigns failed: {response.text}"
        
        data = response.json()
        assert "campaigns" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
    
    def test_available_campaigns_include_brand_info(self):
        """Available campaigns should include brand information"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        campaigns = data.get("campaigns", [])
        
        if len(campaigns) > 0:
            campaign = campaigns[0]
            assert "brand" in campaign, "Brand not in campaign"
            
            brand = campaign["brand"]
            if brand:
                # Retrocompat: company_name should be set
                assert "company_name" in brand, "company_name not in brand"
    
    def test_available_campaigns_show_has_applied(self):
        """Available campaigns should show if creator has applied"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        campaigns = data.get("campaigns", [])
        
        if len(campaigns) > 0:
            campaign = campaigns[0]
            assert "has_applied" in campaign, "has_applied not in campaign"
            assert isinstance(campaign["has_applied"], bool)
    
    def test_available_campaigns_show_slots_available(self):
        """Available campaigns should show available slots"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        campaigns = data.get("campaigns", [])
        
        if len(campaigns) > 0:
            campaign = campaigns[0]
            assert "slots_available" in campaign, "slots_available not in campaign"
            assert campaign["slots_available"] > 0, "Campaign with 0 slots should not be visible"


class TestCreatorProfile:
    """Test Creator Profile endpoints"""
    
    def test_get_creator_profile(self):
        """Creator should be able to get their profile"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/creators/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        
        data = response.json()
        # Retrocompat: should have id field
        assert "id" in data or "creator_id" in data, "No creator identifier"
        assert "user_id" in data
        assert "profile_complete" in data
        assert "needs_profile_update" in data
    
    def test_creator_profile_has_name(self):
        """Creator profile should have name field"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/creators/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "name" in data, "Name not in profile"
    
    def test_creator_profile_requires_auth(self):
        """Creator profile should require authentication"""
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me")
        assert response.status_code == 401


class TestCreatorApplications:
    """Test Creator Applications endpoint - /api/ugc/applications/me"""
    
    def test_get_my_applications(self):
        """Creator should be able to list their applications"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get applications failed: {response.text}"
        
        data = response.json()
        assert "applications" in data, "Applications not in response"
        assert isinstance(data["applications"], list)
    
    def test_applications_include_campaign_info(self):
        """Applications should include campaign information"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        applications = data.get("applications", [])
        
        # Test creator may not have applications, that's OK
        if len(applications) > 0:
            app = applications[0]
            assert "campaign" in app, "Campaign not in application"
            
            campaign = app["campaign"]
            if campaign:
                assert "brand" in campaign, "Brand not in campaign"
    
    def test_applications_requires_creator_profile(self):
        """Brand without creator profile should get 403"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403


class TestBrandProfile:
    """Test Brand Profile endpoints"""
    
    def test_get_brand_profile(self):
        """Brand should be able to get their profile"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get brand profile failed: {response.text}"
        
        data = response.json()
        # Retrocompat: should have brand_id or id
        assert "brand_id" in data or "id" in data, "No brand identifier"
        assert "user_id" in data
    
    def test_brand_profile_requires_auth(self):
        """Brand profile should require authentication"""
        response = requests.get(f"{BASE_URL}/api/ugc/brands/me")
        assert response.status_code == 401


class TestRetrocompatibility:
    """Test specific retrocompatibility features"""
    
    def test_brand_dashboard_uses_or_query_for_brand_id(self):
        """Dashboard should work with both id and brand_id schemas"""
        token = get_brand_token()
        assert token, "Failed to get brand token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # If we get here, the $or query for brand_id worked
        data = response.json()
        assert data["stats"]["total_campaigns"] >= 0
    
    def test_campaign_detail_uses_or_query(self):
        """Campaign detail should work with both id and campaign_id"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/available",
            headers={"Authorization": f"Bearer {token}"}
        )
        campaigns = response.json().get("campaigns", [])
        
        if len(campaigns) == 0:
            pytest.skip("No campaigns available")
        
        # Try with campaign_id (old schema)
        campaign_id = campaigns[0].get("campaign_id")
        if campaign_id:
            response = requests.get(
                f"{BASE_URL}/api/ugc/campaigns/{campaign_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200, "Failed with campaign_id"
        
        # Try with id (new schema)
        campaign_id = campaigns[0].get("id")
        if campaign_id:
            response = requests.get(
                f"{BASE_URL}/api/ugc/campaigns/{campaign_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200, "Failed with id"
    
    def test_applications_enriched_with_brand_company_name(self):
        """Applications should have brand.company_name (mapped from brand_name)"""
        token = get_creator_token()
        assert token, "Failed to get creator token"
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        applications = data.get("applications", [])
        
        for app in applications:
            campaign = app.get("campaign")
            if campaign:
                brand = campaign.get("brand")
                if brand:
                    # company_name should be set (retrocompat)
                    assert "company_name" in brand, f"company_name missing in brand: {brand}"


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_unauthorized_access_returns_401(self):
        """Endpoints should return 401 for unauthorized access"""
        endpoints = [
            "/api/ugc/brands/me/dashboard",
            "/api/ugc/campaigns/me/all",
            "/api/ugc/applications/me",
            "/api/ugc/creators/me",
            "/api/ugc/brands/me"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"{endpoint} should return 401"
    
    def test_invalid_token_returns_401(self):
        """Invalid token should return 401"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/brands/me/dashboard",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
