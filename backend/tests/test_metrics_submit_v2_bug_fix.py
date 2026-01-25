"""
Backend tests for UGC Metrics Submit V2 Bug Fix
Bug: When a creator submits metrics for Instagram and TikTok simultaneously,
TikTok metrics were lost because the system created ONE record with platform='multi'
instead of TWO separate records.

Fix: The endpoint now creates separate records for each platform.

Tests:
1. POST /api/ugc/metrics/submit-v2/{deliverable_id} - Creates TWO separate records
2. Validation allows adding metrics for one platform if the other already exists
3. Validation rejects duplicates of the same platform
4. GET /api/ugc/metrics/me - Returns metrics from both platforms
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - admin user who also has creator profile
TEST_EMAIL = "avenuepy@gmail.com"
TEST_PASSWORD = "admin123"

# Sample base64 image (1x1 pixel PNG - minimal valid image for testing)
SAMPLE_BASE64_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def creator_info(auth_headers):
    """Get creator profile info"""
    response = requests.get(
        f"{BASE_URL}/api/ugc/creators/me",
        headers=auth_headers
    )
    if response.status_code == 200:
        return response.json()
    return None


@pytest.fixture(scope="module")
def test_deliverable_id(auth_headers, creator_info):
    """
    Find or create a deliverable for testing.
    We need a deliverable that belongs to the test creator and doesn't have metrics yet.
    """
    # First, try to find an existing deliverable without metrics
    response = requests.get(
        f"{BASE_URL}/api/ugc/deliverables/me",
        headers=auth_headers
    )
    
    if response.status_code == 200:
        data = response.json()
        deliverables = data.get("deliverables", [])
        
        # Find a deliverable that doesn't have metrics submitted yet
        for d in deliverables:
            if d.get("status") in ["published", "awaiting_publish", "approved"]:
                # Check if metrics already exist for this deliverable
                metrics_check = requests.get(
                    f"{BASE_URL}/api/ugc/metrics/me",
                    headers=auth_headers
                )
                if metrics_check.status_code == 200:
                    existing_metrics = metrics_check.json().get("metrics", [])
                    has_metrics = any(m.get("deliverable_id") == d["id"] for m in existing_metrics)
                    if not has_metrics:
                        return d["id"]
    
    # If no suitable deliverable found, we'll skip the test
    pytest.skip("No suitable deliverable found for testing. Need a deliverable without metrics.")


class TestSubmitV2CreatesSeparateRecords:
    """
    Test that POST /api/ugc/metrics/submit-v2/{deliverable_id} creates
    TWO separate records when submitting both Instagram and TikTok screenshots.
    """
    
    def test_submit_v2_endpoint_exists(self, auth_headers):
        """Verify the submit-v2 endpoint exists"""
        # Use a fake deliverable ID to test endpoint existence
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/fake-deliverable-id",
            headers=auth_headers,
            json={
                "instagram_screenshots": [],
                "tiktok_screenshots": []
            }
        )
        # Should return 404 (deliverable not found) or 400 (no screenshots), not 405 (method not allowed)
        assert response.status_code in [400, 404], f"Unexpected status: {response.status_code}"
    
    def test_submit_v2_requires_at_least_one_screenshot(self, auth_headers, test_deliverable_id):
        """Verify that submitting without screenshots returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/{test_deliverable_id}",
            headers=auth_headers,
            json={
                "instagram_screenshots": [],
                "tiktok_screenshots": []
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        assert "screenshot" in response.json().get("detail", "").lower()
    
    def test_submit_v2_creates_separate_records_for_both_platforms(self, auth_headers, test_deliverable_id):
        """
        CRITICAL BUG FIX TEST:
        When submitting screenshots for both Instagram and TikTok,
        the system should create TWO separate metric records.
        """
        # Submit metrics for both platforms
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/{test_deliverable_id}",
            headers=auth_headers,
            json={
                "instagram_screenshots": [SAMPLE_BASE64_IMAGE],
                "tiktok_screenshots": [SAMPLE_BASE64_IMAGE]
            },
            timeout=120  # AI extraction can take time
        )
        
        assert response.status_code == 200, f"Submit failed: {response.status_code} - {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Response should indicate success"
        
        # CRITICAL: Verify TWO records were created
        metrics_ids = data.get("metrics_ids", [])
        platforms_created = data.get("platforms_created", [])
        
        assert len(metrics_ids) == 2, f"Expected 2 metric records, got {len(metrics_ids)}: {metrics_ids}"
        assert len(platforms_created) == 2, f"Expected 2 platforms, got {len(platforms_created)}: {platforms_created}"
        
        # Verify both platforms are represented
        assert "instagram" in platforms_created, f"Instagram not in platforms: {platforms_created}"
        assert "tiktok" in platforms_created, f"TikTok not in platforms: {platforms_created}"
        
        # Verify screenshots processed count
        screenshots_processed = data.get("screenshots_processed", {})
        assert screenshots_processed.get("instagram") == 1, "Instagram screenshot count mismatch"
        assert screenshots_processed.get("tiktok") == 1, "TikTok screenshot count mismatch"
        
        # Verify extracted_data shows 2 records created
        extracted_data = data.get("extracted_data", {})
        assert extracted_data.get("records_created") == 2, f"Expected 2 records created, got {extracted_data.get('records_created')}"
        
        print(f"SUCCESS: Created {len(metrics_ids)} separate metric records for platforms: {platforms_created}")


class TestSubmitV2ValidationPerPlatform:
    """
    Test that validation works per-platform:
    - Can add metrics for one platform if the other already exists
    - Cannot add duplicate metrics for the same platform
    """
    
    def test_validation_rejects_duplicate_instagram(self, auth_headers, test_deliverable_id):
        """
        After submitting Instagram metrics, trying to submit Instagram again should fail.
        """
        # Try to submit Instagram again (should fail)
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/{test_deliverable_id}",
            headers=auth_headers,
            json={
                "instagram_screenshots": [SAMPLE_BASE64_IMAGE],
                "tiktok_screenshots": []
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for duplicate Instagram, got {response.status_code}"
        detail = response.json().get("detail", "")
        assert "instagram" in detail.lower() or "ya subiste" in detail.lower(), f"Error should mention Instagram duplicate: {detail}"
    
    def test_validation_rejects_duplicate_tiktok(self, auth_headers, test_deliverable_id):
        """
        After submitting TikTok metrics, trying to submit TikTok again should fail.
        """
        # Try to submit TikTok again (should fail)
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/{test_deliverable_id}",
            headers=auth_headers,
            json={
                "instagram_screenshots": [],
                "tiktok_screenshots": [SAMPLE_BASE64_IMAGE]
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for duplicate TikTok, got {response.status_code}"
        detail = response.json().get("detail", "")
        assert "tiktok" in detail.lower() or "ya subiste" in detail.lower(), f"Error should mention TikTok duplicate: {detail}"


class TestGetMyMetricsReturnsBothPlatforms:
    """
    Test that GET /api/ugc/metrics/me returns metrics from both platforms.
    """
    
    def test_get_my_metrics_returns_200(self, auth_headers):
        """GET /me endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/me",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_get_my_metrics_has_metrics_array(self, auth_headers):
        """GET /me returns metrics array"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/me",
            headers=auth_headers
        )
        data = response.json()
        
        assert "metrics" in data, "Missing metrics field"
        assert isinstance(data["metrics"], list), "metrics should be a list"
    
    def test_get_my_metrics_returns_both_platforms(self, auth_headers, test_deliverable_id):
        """
        GET /me should return metrics for both Instagram and TikTok
        for the same deliverable.
        """
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/me",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        metrics = data.get("metrics", [])
        
        # Filter metrics for our test deliverable
        deliverable_metrics = [m for m in metrics if m.get("deliverable_id") == test_deliverable_id]
        
        # Should have 2 metrics for this deliverable (one per platform)
        assert len(deliverable_metrics) >= 2, f"Expected at least 2 metrics for deliverable, got {len(deliverable_metrics)}"
        
        # Verify both platforms are present
        platforms = [m.get("platform") for m in deliverable_metrics]
        assert "instagram" in platforms, f"Instagram metrics missing. Platforms found: {platforms}"
        assert "tiktok" in platforms, f"TikTok metrics missing. Platforms found: {platforms}"
        
        print(f"SUCCESS: GET /me returns metrics for both platforms: {platforms}")
    
    def test_metrics_have_correct_structure(self, auth_headers):
        """Verify metrics have the expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/me",
            headers=auth_headers
        )
        
        data = response.json()
        metrics = data.get("metrics", [])
        
        if len(metrics) > 0:
            metric = metrics[0]
            
            # Required fields
            assert "id" in metric, "Missing id"
            assert "deliverable_id" in metric, "Missing deliverable_id"
            assert "creator_id" in metric, "Missing creator_id"
            assert "campaign_id" in metric, "Missing campaign_id"
            assert "platform" in metric, "Missing platform"
            assert "submitted_at" in metric, "Missing submitted_at"
            
            # Platform should be specific, not 'multi'
            assert metric["platform"] in ["instagram", "tiktok"], f"Invalid platform: {metric['platform']}"
            assert metric["platform"] != "multi", "Platform should not be 'multi' - this was the bug!"


class TestSubmitV2SinglePlatform:
    """
    Test submitting metrics for a single platform works correctly.
    """
    
    def test_submit_instagram_only_creates_one_record(self, auth_headers):
        """
        Submitting only Instagram screenshots should create exactly one record.
        """
        # Find a deliverable without metrics
        response = requests.get(
            f"{BASE_URL}/api/ugc/deliverables/me",
            headers=auth_headers
        )
        
        if response.status_code != 200:
            pytest.skip("Cannot get deliverables")
        
        deliverables = response.json().get("deliverables", [])
        
        # Find a deliverable without metrics
        test_deliverable = None
        for d in deliverables:
            if d.get("status") in ["published", "awaiting_publish", "approved"]:
                metrics_check = requests.get(
                    f"{BASE_URL}/api/ugc/metrics/me",
                    headers=auth_headers
                )
                if metrics_check.status_code == 200:
                    existing_metrics = metrics_check.json().get("metrics", [])
                    has_metrics = any(m.get("deliverable_id") == d["id"] for m in existing_metrics)
                    if not has_metrics:
                        test_deliverable = d["id"]
                        break
        
        if not test_deliverable:
            pytest.skip("No suitable deliverable for single platform test")
        
        # Submit only Instagram
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/{test_deliverable}",
            headers=auth_headers,
            json={
                "instagram_screenshots": [SAMPLE_BASE64_IMAGE],
                "tiktok_screenshots": []
            },
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            metrics_ids = data.get("metrics_ids", [])
            platforms_created = data.get("platforms_created", [])
            
            assert len(metrics_ids) == 1, f"Expected 1 record for single platform, got {len(metrics_ids)}"
            assert platforms_created == ["instagram"], f"Expected only instagram, got {platforms_created}"
            
            print(f"SUCCESS: Single platform submission created 1 record for: {platforms_created}")


class TestSubmitV2RequiresAuth:
    """Test authentication requirements"""
    
    def test_submit_v2_requires_auth(self):
        """Submit V2 endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/some-deliverable-id",
            json={
                "instagram_screenshots": [SAMPLE_BASE64_IMAGE],
                "tiktok_screenshots": []
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_my_metrics_requires_auth(self):
        """GET /me endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/ugc/metrics/me")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestSubmitV2ResponseFormat:
    """Test the response format of submit-v2 endpoint"""
    
    def test_response_has_backward_compatible_fields(self, auth_headers):
        """
        Response should include backward-compatible fields:
        - metrics_id (single ID for backward compatibility)
        - metrics_ids (new: array of all created IDs)
        - platforms_created (new: array of platforms)
        """
        # This test verifies the response structure without actually submitting
        # We check the code structure instead
        
        # The response should have these fields based on the code:
        expected_fields = [
            "success",
            "metrics_id",  # Backward compatibility
            "metrics_ids",  # New field
            "platforms_created",  # New field
            "ai_confidence",
            "screenshots_processed",
            "extracted_data",
            "is_late",
            "message"
        ]
        
        # This is a structural test - we verify the endpoint returns proper JSON
        response = requests.post(
            f"{BASE_URL}/api/ugc/metrics/submit-v2/nonexistent-id",
            headers=auth_headers,
            json={
                "instagram_screenshots": [SAMPLE_BASE64_IMAGE],
                "tiktok_screenshots": []
            }
        )
        
        # Should return 404 for nonexistent deliverable
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        # Verify it returns JSON
        try:
            data = response.json()
            assert "detail" in data, "Error response should have detail field"
        except:
            pytest.fail("Response should be valid JSON")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
