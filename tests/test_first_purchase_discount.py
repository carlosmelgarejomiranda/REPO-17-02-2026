"""
Test suite for First Purchase Discount feature
Tests the 10% discount banner and auto-apply functionality in checkout
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://creator-central-9.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "avenuepy@gmail.com"
TEST_PASSWORD = "admin123"


class TestFirstPurchaseDiscountEndpoint:
    """Tests for GET /api/shop/first-purchase-discount endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_first_purchase_discount_unauthenticated(self):
        """Test endpoint returns not_logged_in for unauthenticated users"""
        response = self.session.get(f"{BASE_URL}/api/shop/first-purchase-discount")
        
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        assert data["reason"] == "not_logged_in"
        print("✓ Unauthenticated user correctly gets 'not_logged_in' response")
    
    def test_first_purchase_discount_authenticated(self):
        """Test endpoint returns coupon for authenticated user without previous purchases"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/shop/first-purchase-discount")
        
        assert response.status_code == 200
        data = response.json()
        
        # User may or may not be eligible depending on purchase history
        if data.get("eligible"):
            assert "coupon" in data
            assert data["coupon"]["discount_type"] == "percentage"
            assert data["coupon"]["discount_value"] == 10
            assert "code" in data["coupon"]
            print(f"✓ Authenticated user is eligible with coupon: {data['coupon']['code']}")
        else:
            assert "reason" in data
            print(f"✓ Authenticated user not eligible: {data['reason']}")
    
    def test_first_purchase_discount_response_structure(self):
        """Test response structure for authenticated user"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/shop/first-purchase-discount")
        
        assert response.status_code == 200
        data = response.json()
        
        # Response should always have 'eligible' field
        assert "eligible" in data
        assert isinstance(data["eligible"], bool)
        
        if data["eligible"]:
            # If eligible, should have coupon details
            assert "coupon" in data
            coupon = data["coupon"]
            assert "code" in coupon
            assert "discount_type" in coupon
            assert "discount_value" in coupon
            assert coupon["discount_type"] in ["percentage", "fixed"]
            assert isinstance(coupon["discount_value"], (int, float))
            print("✓ Response structure is correct for eligible user")
        else:
            # If not eligible, should have reason
            assert "reason" in data
            assert data["reason"] in ["not_logged_in", "has_previous_purchases", "coupon_expired"]
            print(f"✓ Response structure is correct for ineligible user: {data['reason']}")


class TestAutoApplyFirstPurchaseEndpoint:
    """Tests for POST /api/shop/auto-apply-first-purchase endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_auto_apply_unauthenticated(self):
        """Test auto-apply returns not_logged_in for unauthenticated users"""
        response = self.session.post(
            f"{BASE_URL}/api/shop/auto-apply-first-purchase",
            json={"subtotal": 250000}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["applied"] == False
        assert data["reason"] == "not_logged_in"
        print("✓ Unauthenticated user correctly gets 'not_logged_in' response")
    
    def test_auto_apply_authenticated(self):
        """Test auto-apply for authenticated user"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.post(
            f"{BASE_URL}/api/shop/auto-apply-first-purchase",
            json={"subtotal": 250000}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("applied"):
            assert "coupon" in data
            assert "discount_amount" in data
            # 10% of 250000 = 25000
            assert data["discount_amount"] == 25000
            print(f"✓ Auto-apply successful: discount = {data['discount_amount']}")
        else:
            assert "reason" in data
            print(f"✓ Auto-apply not applied: {data['reason']}")
    
    def test_auto_apply_discount_calculation(self):
        """Test that discount is calculated correctly (10% of subtotal)"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        test_subtotals = [100000, 250000, 500000, 1000000]
        
        for subtotal in test_subtotals:
            response = self.session.post(
                f"{BASE_URL}/api/shop/auto-apply-first-purchase",
                json={"subtotal": subtotal}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            if data.get("applied"):
                expected_discount = subtotal * 0.10
                assert data["discount_amount"] == expected_discount, \
                    f"Expected {expected_discount}, got {data['discount_amount']}"
                print(f"✓ Subtotal {subtotal}: discount = {data['discount_amount']} (correct)")
            else:
                print(f"✓ Subtotal {subtotal}: not applied ({data.get('reason')})")


class TestCouponApplyEndpoint:
    """Tests for POST /api/shop/apply-coupon endpoint with welcome coupons"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_apply_welcome_coupon(self):
        """Test applying a welcome coupon code"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # First get the coupon code
        discount_response = self.session.get(f"{BASE_URL}/api/shop/first-purchase-discount")
        assert discount_response.status_code == 200
        discount_data = discount_response.json()
        
        if not discount_data.get("eligible"):
            pytest.skip(f"User not eligible for discount: {discount_data.get('reason')}")
        
        coupon_code = discount_data["coupon"]["code"]
        
        # Now apply the coupon
        response = self.session.post(
            f"{BASE_URL}/api/shop/apply-coupon",
            json={"code": coupon_code, "subtotal": 250000}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["coupon"]["code"] == coupon_code
        assert data["discount_amount"] == 25000  # 10% of 250000
        print(f"✓ Welcome coupon {coupon_code} applied successfully: discount = {data['discount_amount']}")
    
    def test_apply_invalid_coupon(self):
        """Test applying an invalid coupon code"""
        response = self.session.post(
            f"{BASE_URL}/api/shop/apply-coupon",
            json={"code": "INVALID_CODE_12345", "subtotal": 250000}
        )
        
        assert response.status_code == 404
        print("✓ Invalid coupon correctly returns 404")


class TestCheckoutPageIntegration:
    """Integration tests for checkout page with first purchase discount"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_checkout_page_loads(self):
        """Test that checkout page loads correctly"""
        response = self.session.get(f"{BASE_URL}/shop/checkout")
        assert response.status_code == 200
        print("✓ Checkout page loads successfully")
    
    def test_store_location_endpoint(self):
        """Test store location endpoint used by checkout"""
        response = self.session.get(f"{BASE_URL}/api/shop/store-location")
        assert response.status_code == 200
        data = response.json()
        assert "lat" in data
        assert "lng" in data
        print(f"✓ Store location: {data['lat']}, {data['lng']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
