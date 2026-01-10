"""
Test P0 Features:
- Admin Stats Dashboard (/api/ugc/admin/stats)
- Creator Feedback (/api/ugc/creators/me/feedback)
- File Upload (/api/upload)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"


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
        assert "user" in data, "No user in response"
        return data["token"]


class TestAdminStatsEndpoint:
    """Test /api/ugc/admin/stats endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_stats_endpoint_requires_auth(self):
        """Test stats endpoint returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/ugc/admin/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_stats_endpoint_default_period(self, auth_token):
        """Test stats endpoint with default 30d period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/ugc/admin/stats", headers=headers)
        
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "users" in data, "Missing 'users' in response"
        assert "campaigns" in data, "Missing 'campaigns' in response"
        assert "applications" in data, "Missing 'applications' in response"
        assert "deliverables" in data, "Missing 'deliverables' in response"
        assert "metrics" in data, "Missing 'metrics' in response"
        assert "revenue" in data, "Missing 'revenue' in response"
        assert "top_creators" in data, "Missing 'top_creators' in response"
        assert "period" in data, "Missing 'period' in response"
        
        # Verify users structure
        users = data["users"]
        assert "total_creators" in users
        assert "active_creators" in users
        assert "total_brands" in users
        assert "active_brands" in users
        
        # Verify creators_by_level
        assert "creators_by_level" in data
        levels = data["creators_by_level"]
        assert "rookie" in levels
        assert "trusted" in levels
        assert "pro" in levels
        assert "elite" in levels
        
        # Verify deliverables breakdown
        deliverables = data["deliverables"]
        assert "total" in deliverables
        assert "pending_review" in deliverables
        assert "completed" in deliverables
        
        # Verify metrics
        metrics = data["metrics"]
        assert "total_views" in metrics
        assert "total_likes" in metrics
        assert "avg_engagement" in metrics
        assert "avg_rating" in metrics
        assert "on_time_rate" in metrics
        
        # Verify revenue
        revenue = data["revenue"]
        assert "total" in revenue
        assert "monthly" in revenue
        assert "packages_sold" in revenue
        
        # Verify period
        assert data["period"] == "30d"
    
    def test_stats_endpoint_7d_period(self, auth_token):
        """Test stats endpoint with 7d period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/ugc/admin/stats?period=7d", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "7d"
    
    def test_stats_endpoint_90d_period(self, auth_token):
        """Test stats endpoint with 90d period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/ugc/admin/stats?period=90d", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "90d"
    
    def test_stats_endpoint_all_period(self, auth_token):
        """Test stats endpoint with 'all' period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/ugc/admin/stats?period=all", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "all"


class TestCreatorFeedbackEndpoint:
    """Test /api/ugc/creators/me/feedback endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token (admin can access creator endpoints)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Login failed")
    
    def test_feedback_endpoint_requires_auth(self):
        """Test feedback endpoint returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me/feedback")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_feedback_endpoint_returns_structure(self, auth_token):
        """Test feedback endpoint returns correct structure"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/ugc/creators/me/feedback", headers=headers)
        
        # May return 404 if user is not a creator, which is acceptable
        if response.status_code == 404:
            data = response.json()
            assert "detail" in data
            pytest.skip("User is not a creator - endpoint works but no creator profile")
        
        assert response.status_code == 200, f"Feedback failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "feedback" in data, "Missing 'feedback' in response"
        assert "total_ratings" in data, "Missing 'total_ratings' in response"
        assert "avg_rating" in data, "Missing 'avg_rating' in response"
        
        # Verify feedback is a list
        assert isinstance(data["feedback"], list)
        
        # Verify avg_rating is a number
        assert isinstance(data["avg_rating"], (int, float))
        
        # Verify total_ratings is an integer
        assert isinstance(data["total_ratings"], int)


class TestFileUploadEndpoint:
    """Test /api/upload endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Login failed")
    
    def test_upload_requires_auth(self):
        """Test upload endpoint returns 401 without auth"""
        # Create a simple test image
        files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_upload_rejects_invalid_file_type(self, auth_token):
        """Test upload rejects non-image files"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        files = {"file": ("test.txt", b"text content", "text/plain")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
    
    def test_upload_accepts_jpeg(self, auth_token):
        """Test upload accepts JPEG images"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a minimal valid JPEG (1x1 pixel)
        # This is a valid JPEG header
        jpeg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xA9,
            0x00, 0x00, 0x00, 0x00, 0xFF, 0xD9
        ])
        
        files = {"file": ("test.jpg", jpeg_data, "image/jpeg")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        
        assert "url" in data, "Missing 'url' in response"
        assert "filename" in data, "Missing 'filename' in response"
        assert data["url"].endswith(".jpg"), "URL should end with .jpg"
    
    def test_upload_accepts_png(self, auth_token):
        """Test upload accepts PNG images"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Minimal valid PNG (1x1 pixel, red)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE, 0xD4, 0xEF, 0x00, 0x00,
            0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {"file": ("test.png", png_data, "image/png")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        
        assert "url" in data
        assert "filename" in data


class TestAdminDashboardEndpoint:
    """Test /api/ugc/admin/dashboard endpoint (basic dashboard)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_dashboard_requires_auth(self):
        """Test dashboard endpoint returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/ugc/admin/dashboard")
        assert response.status_code == 401
    
    def test_dashboard_returns_data(self, auth_token):
        """Test dashboard endpoint returns correct structure"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/ugc/admin/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Verify basic structure
        assert "users" in data
        assert "campaigns" in data
        assert "applications" in data
        assert "deliverables" in data
        assert "revenue" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
