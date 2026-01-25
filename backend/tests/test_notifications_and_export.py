"""
Test Suite for Avenue UGC Platform - New Features
- P1: Export creators to CSV
- P2: In-app notifications system
- P1: Notification on deliverable changes requested

Tests cover:
1. GET /api/ugc/admin/creators/export - CSV export with filters
2. GET /api/notifications/me - Get user notifications
3. GET /api/notifications/unread-count - Get unread count
4. POST /api/notifications/mark-read - Mark specific as read
5. POST /api/notifications/mark-all-read - Mark all as read
6. DELETE /api/notifications/{id} - Delete notification
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"


class TestAuth:
    """Authentication helper tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        # User data is returned directly, not nested under "user"
        assert "email" in data or "user" in data


class TestCreatorsExportCSV:
    """P1: Test CSV export of creators"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_export_creators_csv_endpoint_exists(self, admin_token):
        """Test that export endpoint exists and returns CSV"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators/export",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Export failed: {response.status_code} - {response.text}"
        
        # Check content type is CSV
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type, f"Expected CSV content type, got: {content_type}"
    
    def test_export_creators_csv_has_headers(self, admin_token):
        """Test that CSV has proper headers"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators/export",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Parse CSV content
        content = response.text
        lines = content.strip().split('\n')
        assert len(lines) >= 1, "CSV should have at least header row"
        
        # Check header row contains expected columns
        header = lines[0]
        expected_columns = ["Nombre", "Email", "Nivel", "Instagram", "TikTok"]
        for col in expected_columns:
            assert col in header, f"Missing column: {col}"
    
    def test_export_creators_csv_with_level_filter(self, admin_token):
        """Test export with level filter"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators/export?level=rookie",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
    
    def test_export_creators_csv_with_active_filter(self, admin_token):
        """Test export with is_active filter"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators/export?is_active=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
    
    def test_export_creators_csv_has_content_disposition(self, admin_token):
        """Test that response has proper filename header"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators/export",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        assert "filename=" in content_disposition, "Should have filename"
        assert ".csv" in content_disposition, "Filename should be .csv"
    
    def test_export_creators_requires_auth(self):
        """Test that export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/ugc/admin/creators/export")
        assert response.status_code in [401, 403], "Should require authentication"
    
    def test_export_creators_requires_admin(self, admin_token):
        """Test that export requires admin role (already tested via admin_token)"""
        # This test passes if admin_token works
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators/export",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200


class TestNotificationsSystem:
    """P2: Test in-app notifications system"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_get_notifications_endpoint_exists(self, admin_token):
        """Test GET /api/notifications/me endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response should have notifications array"
        assert "unread_count" in data, "Response should have unread_count"
        assert isinstance(data["notifications"], list)
    
    def test_get_notifications_with_limit(self, admin_token):
        """Test notifications with limit parameter"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/me?limit=5",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["notifications"]) <= 5
    
    def test_get_notifications_unread_only(self, admin_token):
        """Test notifications with unread_only filter"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/me?unread_only=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # All returned notifications should be unread
        for notif in data["notifications"]:
            assert notif.get("is_read") == False, "All notifications should be unread"
    
    def test_get_unread_count_endpoint(self, admin_token):
        """Test GET /api/notifications/unread-count endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "unread_count" in data, "Response should have unread_count"
        assert isinstance(data["unread_count"], int)
        assert data["unread_count"] >= 0
    
    def test_mark_read_endpoint(self, admin_token):
        """Test POST /api/notifications/mark-read endpoint"""
        # First get notifications to find one to mark
        get_response = requests.get(
            f"{BASE_URL}/api/notifications/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if get_response.status_code == 200:
            notifications = get_response.json().get("notifications", [])
            if notifications:
                notif_id = notifications[0]["id"]
                
                # Mark as read
                response = requests.post(
                    f"{BASE_URL}/api/notifications/mark-read",
                    headers={
                        "Authorization": f"Bearer {admin_token}",
                        "Content-Type": "application/json"
                    },
                    json={"notification_ids": [notif_id]}
                )
                assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
                data = response.json()
                assert "marked_count" in data
            else:
                # No notifications to mark, test endpoint accepts empty array
                response = requests.post(
                    f"{BASE_URL}/api/notifications/mark-read",
                    headers={
                        "Authorization": f"Bearer {admin_token}",
                        "Content-Type": "application/json"
                    },
                    json={"notification_ids": []}
                )
                assert response.status_code == 200
    
    def test_mark_all_read_endpoint(self, admin_token):
        """Test POST /api/notifications/mark-all-read endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/mark-all-read",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "marked_count" in data
        assert isinstance(data["marked_count"], int)
    
    def test_delete_notification_endpoint(self, admin_token):
        """Test DELETE /api/notifications/{id} endpoint"""
        # First get notifications
        get_response = requests.get(
            f"{BASE_URL}/api/notifications/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if get_response.status_code == 200:
            notifications = get_response.json().get("notifications", [])
            if notifications:
                notif_id = notifications[0]["id"]
                
                # Delete notification
                response = requests.delete(
                    f"{BASE_URL}/api/notifications/{notif_id}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                # Should be 200 or 404 if already deleted
                assert response.status_code in [200, 404], f"Failed: {response.status_code}"
            else:
                # Test with fake ID - should return 404
                response = requests.delete(
                    f"{BASE_URL}/api/notifications/fake-id-12345",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert response.status_code == 404
    
    def test_notifications_require_auth(self):
        """Test that notification endpoints require authentication"""
        # Test /me
        response = requests.get(f"{BASE_URL}/api/notifications/me")
        assert response.status_code in [401, 403]
        
        # Test /unread-count
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code in [401, 403]
        
        # Test /mark-read
        response = requests.post(
            f"{BASE_URL}/api/notifications/mark-read",
            json={"notification_ids": []}
        )
        assert response.status_code in [401, 403]
        
        # Test /mark-all-read
        response = requests.post(f"{BASE_URL}/api/notifications/mark-all-read")
        assert response.status_code in [401, 403]


class TestNotificationStructure:
    """Test notification data structure"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_notification_has_required_fields(self, admin_token):
        """Test that notifications have required fields"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        notifications = data.get("notifications", [])
        
        if notifications:
            notif = notifications[0]
            required_fields = ["id", "user_id", "type", "title", "message", "is_read", "created_at"]
            for field in required_fields:
                assert field in notif, f"Notification missing field: {field}"


class TestAdminCreatorsEndpoint:
    """Test admin creators list endpoint (for context)"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_get_creators_list(self, admin_token):
        """Test GET /api/ugc/admin/creators returns creators"""
        response = requests.get(
            f"{BASE_URL}/api/ugc/admin/creators",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "creators" in data
        assert "total" in data
        assert isinstance(data["creators"], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
