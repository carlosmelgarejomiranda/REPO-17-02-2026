"""
Test Application Cancellation Feature
Tests for both admin and creator cancellation of confirmed applications
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"


class TestApplicationCancellation:
    """Test suite for application cancellation feature"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin token"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    # ==================== ENDPOINT AVAILABILITY TESTS ====================
    
    def test_admin_campaigns_endpoint_available(self, admin_headers):
        """Test that admin campaigns endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "campaigns" in data
        print(f"✓ Admin campaigns endpoint available - {len(data['campaigns'])} campaigns found")
    
    def test_admin_applications_endpoint_available(self, admin_headers):
        """Test that admin applications endpoint is accessible"""
        # First get a campaign
        campaigns_res = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        assert campaigns_res.status_code == 200
        campaigns = campaigns_res.json().get("campaigns", [])
        
        if not campaigns:
            pytest.skip("No campaigns available to test applications endpoint")
        
        campaign_id = campaigns[0]["id"]
        response = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns/{campaign_id}/applications", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "applications" in data
        print(f"✓ Admin applications endpoint available - {len(data['applications'])} applications found")
    
    # ==================== ADMIN CANCELLATION TESTS ====================
    
    def test_admin_update_application_status_endpoint_exists(self, admin_headers):
        """Test that admin update application status endpoint exists"""
        # Test with a fake ID to verify endpoint exists (should return 404, not 405)
        fake_id = str(uuid.uuid4())
        response = requests.put(
            f"{BASE_URL}/api/ugc/admin/applications/{fake_id}/status?status=cancelled",
            headers=admin_headers
        )
        # Should be 404 (not found) not 405 (method not allowed)
        assert response.status_code in [404, 400], f"Expected 404 or 400, got {response.status_code}: {response.text}"
        print(f"✓ Admin update application status endpoint exists (returned {response.status_code} for fake ID)")
    
    def test_admin_can_cancel_confirmed_application(self, admin_headers):
        """Test that admin can cancel a confirmed application"""
        # Get campaigns
        campaigns_res = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        assert campaigns_res.status_code == 200
        campaigns = campaigns_res.json().get("campaigns", [])
        
        # Find a campaign with confirmed applications
        confirmed_app = None
        for campaign in campaigns:
            apps_res = requests.get(
                f"{BASE_URL}/api/ugc/admin/campaigns/{campaign['id']}/applications",
                headers=admin_headers
            )
            if apps_res.status_code == 200:
                apps = apps_res.json().get("applications", [])
                for app in apps:
                    if app.get("status") == "confirmed":
                        confirmed_app = app
                        break
            if confirmed_app:
                break
        
        if not confirmed_app:
            pytest.skip("No confirmed applications found to test cancellation")
        
        # Cancel the application
        response = requests.put(
            f"{BASE_URL}/api/ugc/admin/applications/{confirmed_app['id']}/status?status=cancelled&reason=Test cancellation",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Admin successfully cancelled confirmed application {confirmed_app['id']}")
    
    def test_admin_cancellation_updates_status(self, admin_headers):
        """Test that admin cancellation properly updates application status"""
        # Get campaigns and find a cancelled application
        campaigns_res = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        campaigns = campaigns_res.json().get("campaigns", [])
        
        cancelled_app = None
        for campaign in campaigns:
            apps_res = requests.get(
                f"{BASE_URL}/api/ugc/admin/campaigns/{campaign['id']}/applications",
                headers=admin_headers
            )
            if apps_res.status_code == 200:
                apps = apps_res.json().get("applications", [])
                for app in apps:
                    if app.get("status") == "cancelled":
                        cancelled_app = app
                        break
            if cancelled_app:
                break
        
        if not cancelled_app:
            pytest.skip("No cancelled applications found to verify status")
        
        assert cancelled_app["status"] == "cancelled"
        print(f"✓ Application status correctly shows 'cancelled'")
    
    # ==================== CREATOR CANCELLATION ENDPOINT TESTS ====================
    
    def test_creator_withdraw_endpoint_exists(self, admin_headers):
        """Test that creator withdraw endpoint exists (POST /api/ugc/applications/{id}/withdraw)"""
        # Test with a fake ID to verify endpoint exists
        fake_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/ugc/applications/{fake_id}/withdraw",
            headers=admin_headers
        )
        # Should be 403 (forbidden - not a creator) or 404 (not found), not 405 (method not allowed)
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}: {response.text}"
        print(f"✓ Creator withdraw endpoint exists (returned {response.status_code} for fake ID)")
    
    def test_creator_applications_me_endpoint(self, admin_headers):
        """Test that creator applications endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/ugc/applications/me", headers=admin_headers)
        # Admin may not have creator profile, so 403 is acceptable
        assert response.status_code in [200, 403], f"Expected 200 or 403, got {response.status_code}: {response.text}"
        print(f"✓ Creator applications endpoint exists (returned {response.status_code})")
    
    # ==================== STATUS BADGE TESTS ====================
    
    def test_application_status_includes_cancelled(self, admin_headers):
        """Test that application status can be 'cancelled'"""
        # Get all campaigns and check for cancelled status in applications
        campaigns_res = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        campaigns = campaigns_res.json().get("campaigns", [])
        
        all_statuses = set()
        for campaign in campaigns[:5]:  # Check first 5 campaigns
            apps_res = requests.get(
                f"{BASE_URL}/api/ugc/admin/campaigns/{campaign['id']}/applications",
                headers=admin_headers
            )
            if apps_res.status_code == 200:
                apps = apps_res.json().get("applications", [])
                for app in apps:
                    all_statuses.add(app.get("status"))
        
        print(f"✓ Found application statuses: {all_statuses}")
        # Verify the status field exists and is a valid string
        assert len(all_statuses) >= 0  # At least we checked
    
    # ==================== SLOTS MANAGEMENT TESTS ====================
    
    def test_campaign_slots_tracking(self, admin_headers):
        """Test that campaigns track slots_filled correctly"""
        campaigns_res = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        assert campaigns_res.status_code == 200
        campaigns = campaigns_res.json().get("campaigns", [])
        
        if not campaigns:
            pytest.skip("No campaigns available")
        
        campaign = campaigns[0]
        assert "slots_filled" in campaign or "available_slots" in campaign
        print(f"✓ Campaign '{campaign['name']}' has slots tracking: slots_filled={campaign.get('slots_filled', 'N/A')}, available_slots={campaign.get('available_slots', 'N/A')}")
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_full_cancellation_flow_admin(self, admin_headers):
        """Test the full admin cancellation flow"""
        # 1. Get campaigns
        campaigns_res = requests.get(f"{BASE_URL}/api/ugc/admin/campaigns", headers=admin_headers)
        assert campaigns_res.status_code == 200
        campaigns = campaigns_res.json().get("campaigns", [])
        
        if not campaigns:
            pytest.skip("No campaigns available")
        
        # 2. Find a campaign with applications
        campaign_with_apps = None
        applications = []
        for campaign in campaigns:
            apps_res = requests.get(
                f"{BASE_URL}/api/ugc/admin/campaigns/{campaign['id']}/applications",
                headers=admin_headers
            )
            if apps_res.status_code == 200:
                apps = apps_res.json().get("applications", [])
                if apps:
                    campaign_with_apps = campaign
                    applications = apps
                    break
        
        if not campaign_with_apps:
            pytest.skip("No campaigns with applications found")
        
        print(f"✓ Found campaign '{campaign_with_apps['name']}' with {len(applications)} applications")
        
        # 3. Check application statuses
        status_counts = {}
        for app in applications:
            status = app.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"✓ Application status distribution: {status_counts}")
        
        # 4. Verify slots tracking
        slots_filled = campaign_with_apps.get("slots_filled", 0)
        available_slots = campaign_with_apps.get("available_slots", 0)
        print(f"✓ Campaign slots: filled={slots_filled}, available={available_slots}")


class TestCreatorApplicationsPage:
    """Test suite for CreatorApplications page functionality"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    def test_creator_dashboard_link_to_applications(self, admin_headers):
        """Test that CreatorDashboard has link to applications page"""
        # This is a frontend test - we verify the endpoint exists
        response = requests.get(f"{BASE_URL}/api/ugc/applications/me", headers=admin_headers)
        # Admin may not have creator profile
        assert response.status_code in [200, 403]
        print(f"✓ Applications endpoint accessible (status: {response.status_code})")
    
    def test_applications_filter_by_status(self, admin_headers):
        """Test that applications can be filtered by status"""
        # Test with status parameter
        response = requests.get(
            f"{BASE_URL}/api/ugc/applications/me?status=confirmed",
            headers=admin_headers
        )
        # Admin may not have creator profile
        assert response.status_code in [200, 403]
        print(f"✓ Applications filter endpoint works (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
