"""
Test suite for /api/ugc/metrics/campaign/{campaign_id}/detailed endpoint
Verifies that creator names are returned correctly in the metrics response

Bug fix verification: Creator names were not appearing in the brand metrics panel
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"
CAMPAIGN_ID = "22dde9fa-1c80-4377-aff8-fa82ca214f9f"

# Expected creator names from the campaign
EXPECTED_CREATOR_NAMES = [
    "Pauli Mateos",
    "Christian Zavala",
    "Elias Benítez",
    "José Arthur Silva",
    "Sofía Noemí Ramírez Zárate"
]


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    return session


class TestMetricsDetailedEndpoint:
    """Tests for /api/ugc/metrics/campaign/{campaign_id}/detailed endpoint"""

    def test_endpoint_returns_200(self, api_client):
        """Test that the endpoint returns 200 OK"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_response_has_metrics_array(self, api_client):
        """Test that response contains metrics array"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        assert "metrics" in data, "Response missing 'metrics' field"
        assert isinstance(data["metrics"], list), "'metrics' should be a list"

    def test_response_has_total_count(self, api_client):
        """Test that response contains total count"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        assert "total" in data, "Response missing 'total' field"
        assert data["total"] == 5, f"Expected 5 metrics, got {data['total']}"

    def test_each_metric_has_creator_object(self, api_client):
        """Test that each metric has a creator object"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            assert "creator" in metric, f"Metric {idx} missing 'creator' field"
            assert isinstance(metric["creator"], dict), f"Metric {idx} 'creator' should be a dict"

    def test_each_creator_has_name_field(self, api_client):
        """Test that each creator object has a name field - BUG FIX VERIFICATION"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            creator = metric.get("creator", {})
            assert "name" in creator, f"Metric {idx} creator missing 'name' field"
            assert creator["name"] is not None, f"Metric {idx} creator name is None"
            assert creator["name"] != "", f"Metric {idx} creator name is empty"
            assert creator["name"] != "Creator", f"Metric {idx} has default 'Creator' name instead of actual name"

    def test_creator_names_match_expected(self, api_client):
        """Test that creator names match the expected names"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        actual_names = [m["creator"]["name"] for m in data["metrics"]]
        
        for expected_name in EXPECTED_CREATOR_NAMES:
            assert expected_name in actual_names, f"Expected creator '{expected_name}' not found in response"

    def test_metrics_have_required_fields(self, api_client):
        """Test that each metric has all required fields: views, reach, likes, comments, shares, saves, engagement_rate"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        required_fields = ["views", "reach", "likes", "comments", "shares", "saves", "engagement_rate"]
        
        for idx, metric in enumerate(data["metrics"]):
            for field in required_fields:
                assert field in metric, f"Metric {idx} missing required field '{field}'"

    def test_metrics_views_are_numeric(self, api_client):
        """Test that views field contains numeric values"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            views = metric.get("views")
            assert views is not None, f"Metric {idx} views is None"
            assert isinstance(views, (int, float)), f"Metric {idx} views should be numeric, got {type(views)}"
            assert views >= 0, f"Metric {idx} views should be non-negative"

    def test_metrics_likes_are_numeric(self, api_client):
        """Test that likes field contains numeric values"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            likes = metric.get("likes")
            assert likes is not None, f"Metric {idx} likes is None"
            assert isinstance(likes, (int, float)), f"Metric {idx} likes should be numeric"

    def test_metrics_engagement_rate_is_numeric(self, api_client):
        """Test that engagement_rate field contains numeric values"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            engagement_rate = metric.get("engagement_rate")
            assert engagement_rate is not None, f"Metric {idx} engagement_rate is None"
            assert isinstance(engagement_rate, (int, float)), f"Metric {idx} engagement_rate should be numeric"

    def test_platform_filter_instagram(self, api_client):
        """Test platform filter with instagram"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed?platform=instagram"
        )
        assert response.status_code == 200
        data = response.json()
        
        # All metrics in this campaign are instagram
        for metric in data["metrics"]:
            assert metric.get("platform") == "instagram", f"Expected instagram platform, got {metric.get('platform')}"

    def test_platform_filter_all(self, api_client):
        """Test platform filter with 'all' value"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed?platform=all"
        )
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data

    def test_month_filter_all(self, api_client):
        """Test month filter with 'all' value"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed?month=all"
        )
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data

    def test_combined_filters(self, api_client):
        """Test combined platform and month filters"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed?platform=instagram&month=all"
        )
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data


class TestMetricsCreatorDataIntegrity:
    """Tests for creator data integrity in metrics response"""

    def test_creator_has_user_id(self, api_client):
        """Test that creator objects have user_id"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            creator = metric.get("creator", {})
            assert "user_id" in creator, f"Metric {idx} creator missing 'user_id'"

    def test_creator_has_creator_id(self, api_client):
        """Test that creator objects have creator_id"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        for idx, metric in enumerate(data["metrics"]):
            creator = metric.get("creator", {})
            assert "creator_id" in creator, f"Metric {idx} creator missing 'creator_id'"

    def test_creator_names_are_not_default(self, api_client):
        """Test that no creator has the default 'Creator' name - BUG FIX VERIFICATION"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        default_name_count = sum(1 for m in data["metrics"] if m.get("creator", {}).get("name") == "Creator")
        assert default_name_count == 0, f"Found {default_name_count} metrics with default 'Creator' name"

    def test_all_five_creators_have_unique_names(self, api_client):
        """Test that all 5 creators have unique names"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        data = response.json()
        
        names = [m["creator"]["name"] for m in data["metrics"]]
        unique_names = set(names)
        
        assert len(unique_names) == 5, f"Expected 5 unique creator names, got {len(unique_names)}: {names}"


class TestInvalidCampaignId:
    """Tests for invalid campaign ID handling"""

    def test_invalid_campaign_returns_404(self, api_client):
        """Test that invalid campaign ID returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/invalid-campaign-id/detailed"
        )
        assert response.status_code == 404, f"Expected 404 for invalid campaign, got {response.status_code}"


class TestUnauthenticatedAccess:
    """Tests for unauthenticated access"""

    def test_unauthenticated_returns_401(self):
        """Test that unauthenticated request returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/metrics/campaign/{CAMPAIGN_ID}/detailed"
        )
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
