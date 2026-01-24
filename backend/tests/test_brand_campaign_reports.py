"""
Backend tests for Brand Campaign Reports feature
Tests demographics, metrics, and applicants report endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "avenuepy@gmail.com"
TEST_PASSWORD = "admin123"
TEST_CAMPAIGN_ID = "18553c65-08d2-45f9-ac30-6bac89188c53"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for brand user"""
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


class TestDemographicsEndpoint:
    """Tests for /api/ugc/metrics/campaign/{campaign_id}/demographics"""
    
    def test_demographics_returns_200(self, auth_headers):
        """Demographics endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_demographics_has_gender_data(self, auth_headers):
        """Demographics endpoint returns gender distribution"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        data = response.json()
        
        assert "gender" in data, "Missing gender field"
        gender = data["gender"]
        assert "female" in gender, "Missing female in gender"
        assert "male" in gender, "Missing male in gender"
        assert "other" in gender, "Missing other in gender"
        
        # Verify values are percentages (0-100)
        assert 0 <= gender["female"] <= 100, f"Invalid female percentage: {gender['female']}"
        assert 0 <= gender["male"] <= 100, f"Invalid male percentage: {gender['male']}"
        assert 0 <= gender["other"] <= 100, f"Invalid other percentage: {gender['other']}"
    
    def test_demographics_has_age_ranges(self, auth_headers):
        """Demographics endpoint returns age range distribution"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        data = response.json()
        
        assert "age_ranges" in data, "Missing age_ranges field"
        age_ranges = data["age_ranges"]
        assert isinstance(age_ranges, list), "age_ranges should be a list"
        
        if len(age_ranges) > 0:
            for age in age_ranges:
                assert "range" in age, "Missing range in age data"
                assert "percent" in age, "Missing percent in age data"
                assert 0 <= age["percent"] <= 100, f"Invalid age percent: {age['percent']}"
    
    def test_demographics_has_countries(self, auth_headers):
        """Demographics endpoint returns country distribution"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        data = response.json()
        
        assert "countries" in data, "Missing countries field"
        countries = data["countries"]
        assert isinstance(countries, list), "countries should be a list"
        
        if len(countries) > 0:
            for country in countries:
                assert "country" in country, "Missing country name"
                assert "percent" in country, "Missing percent in country data"
                assert 0 <= country["percent"] <= 100, f"Invalid country percent: {country['percent']}"
    
    def test_demographics_has_data_flag(self, auth_headers):
        """Demographics endpoint returns has_data flag"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics",
            headers=auth_headers
        )
        data = response.json()
        
        assert "has_data" in data, "Missing has_data field"
        assert isinstance(data["has_data"], bool), "has_data should be boolean"
    
    def test_demographics_requires_auth(self):
        """Demographics endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_demographics_with_platform_filter(self, auth_headers):
        """Demographics endpoint accepts platform filter"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/demographics?platform=instagram",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_demographics_invalid_campaign(self, auth_headers):
        """Demographics endpoint returns 404 for invalid campaign"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/invalid-campaign-id/demographics",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestDetailedMetricsEndpoint:
    """Tests for /api/ugc/metrics/campaign/{campaign_id}/detailed"""
    
    def test_detailed_metrics_returns_200(self, auth_headers):
        """Detailed metrics endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_detailed_metrics_has_metrics_array(self, auth_headers):
        """Detailed metrics endpoint returns metrics array"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed",
            headers=auth_headers
        )
        data = response.json()
        
        assert "metrics" in data, "Missing metrics field"
        assert isinstance(data["metrics"], list), "metrics should be a list"
        assert "total" in data, "Missing total field"
    
    def test_detailed_metrics_structure(self, auth_headers):
        """Detailed metrics have correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed",
            headers=auth_headers
        )
        data = response.json()
        
        if len(data["metrics"]) > 0:
            metric = data["metrics"][0]
            # Check required fields
            assert "id" in metric, "Missing id in metric"
            assert "campaign_id" in metric, "Missing campaign_id in metric"
            assert "platform" in metric, "Missing platform in metric"
            assert "views" in metric, "Missing views in metric"
            assert "reach" in metric, "Missing reach in metric"
            assert "likes" in metric, "Missing likes in metric"
    
    def test_detailed_metrics_requires_auth(self):
        """Detailed metrics endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_detailed_metrics_with_platform_filter(self, auth_headers):
        """Detailed metrics endpoint accepts platform filter"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed?platform=instagram",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_detailed_metrics_with_month_filter(self, auth_headers):
        """Detailed metrics endpoint accepts month filter"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{TEST_CAMPAIGN_ID}/detailed?month=2026-01",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestApplicantsReportEndpoint:
    """Tests for /api/ugc/campaigns/{campaign_id}/applicants-report"""
    
    def test_applicants_report_returns_200(self, auth_headers):
        """Applicants report endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_applicants_report_has_applicants_array(self, auth_headers):
        """Applicants report endpoint returns applicants array"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report",
            headers=auth_headers
        )
        data = response.json()
        
        assert "applicants" in data, "Missing applicants field"
        assert isinstance(data["applicants"], list), "applicants should be a list"
    
    def test_applicants_report_requires_auth(self):
        """Applicants report endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}/applicants-report"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_applicants_report_invalid_campaign(self, auth_headers):
        """Applicants report endpoint returns 404 for invalid campaign"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/invalid-campaign-id/applicants-report",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestCampaignEndpoint:
    """Tests for /api/ugc/campaigns/{campaign_id}"""
    
    def test_campaign_returns_200(self, auth_headers):
        """Campaign endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_campaign_has_required_fields(self, auth_headers):
        """Campaign endpoint returns required fields"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/campaigns/{TEST_CAMPAIGN_ID}",
            headers=auth_headers
        )
        data = response.json()
        
        assert "id" in data, "Missing id field"
        assert "name" in data, "Missing name field"
        assert "brand_id" in data, "Missing brand_id field"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
