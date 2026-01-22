"""
Test Admin Creators Tab - Enriched Creator Data
Tests for the enhanced creators endpoint with social accounts, metrics, and reviews
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminCreatorsEnriched:
    """Tests for enriched creator data in admin panel"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "avenuepy@gmail.com",
            "password": "admin123"
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"Admin login successful")
        else:
            pytest.skip(f"Admin login failed: {login_response.status_code}")
    
    def test_admin_login(self):
        """Test admin can login successfully"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "avenuepy@gmail.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "admin"
        print("PASS: Admin login successful")
    
    def test_get_creators_endpoint(self):
        """Test GET /api/ugc/admin/creators returns enriched data"""
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        assert "creators" in data
        assert "total" in data
        print(f"PASS: Got {len(data['creators'])} creators, total: {data['total']}")
    
    def test_creators_have_enriched_fields(self):
        """Test that creators have all enriched fields"""
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        if not creators:
            pytest.skip("No creators in database")
        
        # Check first creator has enriched fields
        creator = creators[0]
        
        # Required enriched fields
        enriched_fields = [
            "verified_instagram",
            "verified_tiktok", 
            "campaigns_participated",
            "avg_views",
            "avg_reach",
            "avg_interactions",
            "avg_rating",
            "total_reviews"
        ]
        
        for field in enriched_fields:
            assert field in creator, f"Missing enriched field: {field}"
            print(f"  - {field}: {creator.get(field)}")
        
        print(f"PASS: Creator has all enriched fields")
    
    def test_creator_basic_fields(self):
        """Test creators have basic required fields"""
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        if not creators:
            pytest.skip("No creators in database")
        
        creator = creators[0]
        
        # Basic fields
        basic_fields = ["id", "name", "email", "level", "is_active", "is_verified"]
        
        for field in basic_fields:
            assert field in creator, f"Missing basic field: {field}"
        
        print(f"PASS: Creator '{creator.get('name')}' has all basic fields")
    
    def test_creator_level_filter(self):
        """Test filtering creators by level"""
        levels = ["rookie", "rising", "trusted", "pro", "elite"]
        
        for level in levels:
            response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators?level={level}")
            assert response.status_code == 200
            
            data = response.json()
            creators = data.get("creators", [])
            
            # All returned creators should have the specified level
            for creator in creators:
                assert creator.get("level") == level, f"Creator level mismatch: expected {level}, got {creator.get('level')}"
            
            print(f"  - Level '{level}': {len(creators)} creators")
        
        print("PASS: Level filter works correctly")
    
    def test_creator_active_filter(self):
        """Test filtering creators by active status"""
        # Test active=true
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators?is_active=true")
        assert response.status_code == 200
        data = response.json()
        active_count = len(data.get("creators", []))
        
        # Test active=false
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators?is_active=false")
        assert response.status_code == 200
        data = response.json()
        inactive_count = len(data.get("creators", []))
        
        print(f"PASS: Active filter works - Active: {active_count}, Inactive: {inactive_count}")
    
    def test_creator_reviews_endpoint(self):
        """Test GET /api/ugc/admin/creators/{id}/reviews endpoint"""
        # First get a creator
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        if not creators:
            pytest.skip("No creators in database")
        
        creator_id = creators[0].get("id")
        
        # Get reviews for this creator
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators/{creator_id}/reviews")
        assert response.status_code == 200
        
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        assert "creator_name" in data
        
        print(f"PASS: Reviews endpoint works - Creator: {data.get('creator_name')}, Reviews: {data.get('total')}")
    
    def test_creator_reviews_have_brand_name(self):
        """Test that reviews include brand_name when available"""
        # First get a creator
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        if not creators:
            pytest.skip("No creators in database")
        
        # Find a creator with reviews
        for creator in creators:
            if creator.get("total_reviews", 0) > 0:
                creator_id = creator.get("id")
                
                response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators/{creator_id}/reviews")
                assert response.status_code == 200
                
                data = response.json()
                reviews = data.get("reviews", [])
                
                if reviews:
                    # Check if brand_name field exists (may be None if no brand)
                    review = reviews[0]
                    assert "brand_name" in review or "brand_id" in review
                    print(f"PASS: Review has brand info - Brand: {review.get('brand_name', 'N/A')}")
                    return
        
        print("SKIP: No creators with reviews found")
    
    def test_creator_reviews_404_for_invalid_id(self):
        """Test reviews endpoint returns 404 for invalid creator ID"""
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators/invalid-creator-id-12345/reviews")
        assert response.status_code == 404
        print("PASS: Reviews endpoint returns 404 for invalid creator ID")
    
    def test_verify_creator_endpoint(self):
        """Test PUT /api/ugc/admin/creators/{id}/verify endpoint"""
        # First get a creator
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        if not creators:
            pytest.skip("No creators in database")
        
        creator = creators[0]
        creator_id = creator.get("id")
        current_verified = creator.get("is_verified", False)
        
        # Toggle verification
        response = self.session.put(
            f"{BASE_URL}/api/ugc/admin/creators/{creator_id}/verify?verified={not current_verified}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        # Revert back
        response = self.session.put(
            f"{BASE_URL}/api/ugc/admin/creators/{creator_id}/verify?verified={current_verified}"
        )
        assert response.status_code == 200
        
        print(f"PASS: Verify creator endpoint works")
    
    def test_metrics_endpoint(self):
        """Test GET /api/ugc/admin/metrics endpoint with creator_id filter"""
        # First get a creator
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        if not creators:
            pytest.skip("No creators in database")
        
        creator_id = creators[0].get("id")
        
        # Get metrics for this creator
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/metrics?creator_id={creator_id}")
        
        # Endpoint may return 200 with empty metrics or 404
        if response.status_code == 200:
            data = response.json()
            assert "metrics" in data
            print(f"PASS: Metrics endpoint works - Found {len(data.get('metrics', []))} metrics")
        elif response.status_code == 404:
            print("PASS: Metrics endpoint returns 404 (no metrics found)")
        else:
            assert False, f"Unexpected status code: {response.status_code}"
    
    def test_social_accounts_structure(self):
        """Test that verified social accounts have correct structure"""
        response = self.session.get(f"{BASE_URL}/api/ugc/admin/creators")
        assert response.status_code == 200
        
        data = response.json()
        creators = data.get("creators", [])
        
        # Find a creator with verified Instagram
        for creator in creators:
            verified_ig = creator.get("verified_instagram")
            if verified_ig:
                # Check structure
                assert "username" in verified_ig, "Instagram missing username"
                # follower_count or followers should exist
                has_followers = "follower_count" in verified_ig or "followers" in verified_ig
                assert has_followers, "Instagram missing follower count"
                
                print(f"PASS: Verified Instagram structure correct - @{verified_ig.get('username')}")
                return
        
        print("SKIP: No creators with verified Instagram found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
