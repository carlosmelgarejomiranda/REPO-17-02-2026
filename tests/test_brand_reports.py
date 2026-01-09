"""
Backend Tests for Brand Campaign Reports Feature
Tests the 3 report endpoints: Metrics, Demographics, and Applicants
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "avenuepy@gmail.com"
TEST_PASSWORD = "admin123"
TEST_CAMPAIGN_ID = "e31c0c3b-59ca-46f7-9fd8-270301b3ba4e"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
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
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestMetricsReport:
    """Tests for GET /api/ugc/metrics/campaign/{campaign_id}/detailed"""
    
    def test_metrics_endpoint_returns_200(self, auth_headers):
        """Test that metrics endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_metrics_response_structure(self, auth_headers):
        """Test that metrics response has correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level structure
        assert "metrics" in data, "Response missing 'metrics' field"
        assert "total" in data, "Response missing 'total' field"
        assert isinstance(data["metrics"], list), "'metrics' should be a list"
        assert isinstance(data["total"], int), "'total' should be an integer"
    
    def test_metrics_data_fields(self, auth_headers):
        """Test that each metric has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["total"] > 0:
            metric = data["metrics"][0]
            required_fields = [
                "id", "creator_id", "campaign_id", "platform",
                "views", "reach", "likes", "comments", "shares", "saves",
                "watch_time", "creator"
            ]
            for field in required_fields:
                assert field in metric, f"Metric missing required field: {field}"
            
            # Check creator info
            assert "name" in metric["creator"], "Creator missing 'name'"
    
    def test_metrics_platform_filter_tiktok(self, auth_headers):
        """Test platform filter with tiktok"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed?platform=tiktok",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All metrics should be tiktok
        for metric in data["metrics"]:
            assert metric["platform"] == "tiktok", f"Expected tiktok, got {metric['platform']}"
    
    def test_metrics_platform_filter_instagram(self, auth_headers):
        """Test platform filter with instagram"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed?platform=instagram",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All metrics should be instagram (may be empty if no instagram data)
        for metric in data["metrics"]:
            assert metric["platform"] == "instagram", f"Expected instagram, got {metric['platform']}"
    
    def test_metrics_requires_auth(self):
        """Test that metrics endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_metrics_invalid_campaign_returns_404(self, auth_headers):
        """Test that invalid campaign ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/invalid-campaign-id/detailed",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestDemographicsReport:
    """Tests for GET /api/ugc/metrics/campaign/{campaign_id}/demographics"""
    
    def test_demographics_endpoint_returns_200(self, auth_headers):
        """Test that demographics endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_demographics_response_structure(self, auth_headers):
        """Test that demographics response has correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level structure
        assert "gender" in data, "Response missing 'gender' field"
        assert "age_ranges" in data, "Response missing 'age_ranges' field"
        assert "countries" in data, "Response missing 'countries' field"
    
    def test_demographics_gender_data(self, auth_headers):
        """Test gender distribution data"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        gender = data["gender"]
        assert "male" in gender, "Gender missing 'male'"
        assert "female" in gender, "Gender missing 'female'"
        assert "other" in gender, "Gender missing 'other'"
        
        # Percentages should sum to 100
        total = gender["male"] + gender["female"] + gender["other"]
        assert total == 100, f"Gender percentages should sum to 100, got {total}"
    
    def test_demographics_age_ranges_data(self, auth_headers):
        """Test age ranges distribution data"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        age_ranges = data["age_ranges"]
        assert len(age_ranges) > 0, "Age ranges should not be empty"
        
        for age_range in age_ranges:
            assert "range" in age_range, "Age range missing 'range' field"
            assert "percent" in age_range, "Age range missing 'percent' field"
        
        # Percentages should sum to 100
        total = sum(ar["percent"] for ar in age_ranges)
        assert total == 100, f"Age range percentages should sum to 100, got {total}"
    
    def test_demographics_countries_data(self, auth_headers):
        """Test country distribution data"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        countries = data["countries"]
        assert len(countries) > 0, "Countries should not be empty"
        
        for country in countries:
            assert "country" in country, "Country missing 'country' field"
            assert "percent" in country, "Country missing 'percent' field"
        
        # Percentages should sum to 100
        total = sum(c["percent"] for c in countries)
        assert total == 100, f"Country percentages should sum to 100, got {total}"
    
    def test_demographics_platform_filter_changes_age(self, auth_headers):
        """Test that platform filter affects age distribution (TikTok has younger audience)"""
        # Get default demographics
        response_all = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response_all.status_code == 200
        data_all = response_all.json()
        
        # Get TikTok demographics
        response_tiktok = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics?platform=tiktok",
            headers=auth_headers
        )
        assert response_tiktok.status_code == 200
        data_tiktok = response_tiktok.json()
        
        # TikTok should have higher 13-17 percentage
        age_13_17_all = next((ar["percent"] for ar in data_all["age_ranges"] if ar["range"] == "13-17"), 0)
        age_13_17_tiktok = next((ar["percent"] for ar in data_tiktok["age_ranges"] if ar["range"] == "13-17"), 0)
        
        assert age_13_17_tiktok >= age_13_17_all, "TikTok should have higher 13-17 percentage"
    
    def test_demographics_requires_auth(self):
        """Test that demographics endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_demographics_invalid_campaign_returns_404(self, auth_headers):
        """Test that invalid campaign ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/invalid-campaign-id/demographics",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestApplicantsReport:
    """Tests for GET /api/ugc/campaigns/{campaign_id}/applicants-report"""
    
    def test_applicants_endpoint_returns_200(self, auth_headers):
        """Test that applicants report endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_applicants_response_structure(self, auth_headers):
        """Test that applicants response has correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level structure
        assert "applicants" in data, "Response missing 'applicants' field"
        assert isinstance(data["applicants"], list), "'applicants' should be a list"
    
    def test_applicants_data_fields(self, auth_headers):
        """Test that each applicant has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["applicants"]) > 0:
            applicant = data["applicants"][0]
            required_fields = [
                "id", "name", "level",
                "avg_views", "avg_reach", "avg_interactions", "avg_watch_time",
                "avg_interaction_rate", "avg_retention_rate",
                "avg_rating", "dot_percent", "avg_delay"
            ]
            for field in required_fields:
                assert field in applicant, f"Applicant missing required field: {field}"
    
    def test_applicants_level_values(self, auth_headers):
        """Test that applicant levels are valid"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        valid_levels = ["rookie", "trusted", "pro", "elite"]
        for applicant in data["applicants"]:
            assert applicant["level"] in valid_levels, f"Invalid level: {applicant['level']}"
    
    def test_applicants_dot_percent_range(self, auth_headers):
        """Test that DOT% is within valid range (0-100)"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        for applicant in data["applicants"]:
            assert 0 <= applicant["dot_percent"] <= 100, f"DOT% out of range: {applicant['dot_percent']}"
    
    def test_applicants_sorted_by_dot_percent(self, auth_headers):
        """Test that applicants are sorted by DOT% descending"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["applicants"]) > 1:
            dot_percents = [a["dot_percent"] for a in data["applicants"]]
            assert dot_percents == sorted(dot_percents, reverse=True), "Applicants should be sorted by DOT% descending"
    
    def test_applicants_requires_auth(self):
        """Test that applicants report endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_applicants_invalid_campaign_returns_404(self, auth_headers):
        """Test that invalid campaign ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/invalid-campaign-id/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestCampaignAccess:
    """Tests for campaign access and navigation"""
    
    def test_get_campaign_details(self, auth_headers):
        """Test getting campaign details"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Campaign missing 'id'"
        assert "name" in data, "Campaign missing 'name'"
        assert data["id"] == TEST_CAMPAIGN_ID, "Campaign ID mismatch"
    
    def test_get_brand_campaigns(self, auth_headers):
        """Test getting all brand campaigns"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/me/all",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "campaigns" in data, "Response missing 'campaigns'"
        
        # Find our test campaign
        campaign_ids = [c["id"] for c in data["campaigns"]]
        assert TEST_CAMPAIGN_ID in campaign_ids, f"Test campaign {TEST_CAMPAIGN_ID} not found in brand campaigns"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
