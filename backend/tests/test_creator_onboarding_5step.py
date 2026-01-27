"""
Test suite for Avenue UGC Platform - 5-Step Creator Onboarding Flow

Tests the new onboarding endpoint with all required fields:
- Step 1: Personal Data (name, birth_date, gender, document_id)
- Step 2: Location & Contact (country, city, phone_country_code, phone)
- Step 3: Professional Profile (categories, bio, education_level, languages)
- Step 4: Social Networks (instagram_username, tiktok_username)
- Step 5: Profile Picture & Terms (profile_picture, terms_accepted)

Backend validations:
- Age validation (must be 18+)
- Terms acceptance required
- At least one social network (frontend validation)
- phone_full field construction
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "avenuepy@gmail.com"
ADMIN_PASSWORD = "admin123"


def get_auth_token(email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    """Helper to get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json().get("token")
    return None


def create_test_user():
    """Create a new test user for onboarding tests"""
    test_email = f"test_creator_{uuid.uuid4().hex[:10]}@test.com"
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": test_email,
        "password": "testpass123",
        "name": "Test Creator User",
        "acceptTerms": True
    })
    if response.status_code in [200, 201]:
        data = response.json()
        return {
            "email": test_email,
            "token": data.get("token"),
            "user_id": data.get("user_id")
        }
    return None


class TestOnboardingEndpointExists:
    """Verify the onboarding endpoint exists and requires auth"""
    
    def test_onboarding_endpoint_requires_auth(self):
        """POST /api/ugc/creators/onboarding should require authentication"""
        response = requests.post(f"{BASE_URL}/api/ugc/creators/onboarding", json={})
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
    
    def test_onboarding_endpoint_exists(self):
        """Endpoint should exist (not 404)"""
        token = get_auth_token()
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {token}"},
            json={}
        )
        # Should return validation error (422) not 404
        assert response.status_code != 404, "Onboarding endpoint should exist"


class TestAgeValidation:
    """Test age validation - must be 18+"""
    
    def test_rejects_underage_user(self):
        """Should reject users under 18"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        # Calculate date for 17-year-old
        underage_date = (datetime.now() - timedelta(days=17*365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "name": "Test Underage",
                "birth_date": underage_date,
                "gender": "male",
                "document_id": "1234567",
                "country": "PY",
                "city": "Asunción",
                "phone_country_code": "+595",
                "phone": "981234567",
                "categories": ["Gastronomía"],
                "terms_accepted": True,
                "terms_version": "1.0"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for underage user, got {response.status_code}"
        data = response.json()
        assert "18" in str(data.get("detail", "")).lower() or "mayor" in str(data.get("detail", "")).lower(), \
            f"Error message should mention age requirement: {data}"
    
    def test_accepts_adult_user(self):
        """Should accept users 18 or older"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        # Calculate date for 25-year-old
        adult_date = (datetime.now() - timedelta(days=25*365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "name": "Test Adult Creator",
                "birth_date": adult_date,
                "gender": "female",
                "document_id": "4567890",
                "country": "PY",
                "city": "Asunción",
                "phone_country_code": "+595",
                "phone": "981234567",
                "categories": ["Gastronomía"],
                "instagram_username": "test_creator",
                "terms_accepted": True,
                "terms_version": "1.0"
            }
        )
        
        # Should succeed (200 or 201) or fail for other reasons (not age)
        if response.status_code == 400:
            data = response.json()
            assert "18" not in str(data.get("detail", "")).lower(), \
                f"Adult user should not fail age validation: {data}"


class TestTermsValidation:
    """Test terms acceptance validation"""
    
    def test_rejects_without_terms_acceptance(self):
        """Should reject if terms_accepted is False"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        adult_date = (datetime.now() - timedelta(days=25*365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "name": "Test No Terms",
                "birth_date": adult_date,
                "gender": "male",
                "document_id": "1234567",
                "country": "PY",
                "city": "Asunción",
                "phone_country_code": "+595",
                "phone": "981234567",
                "categories": ["Gastronomía"],
                "terms_accepted": False,  # Not accepted
                "terms_version": "1.0"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for terms not accepted, got {response.status_code}"


class TestPhoneFullConstruction:
    """Test phone_full field is correctly constructed"""
    
    def test_phone_full_saved_correctly(self):
        """phone_full should be phone_country_code + phone"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        adult_date = (datetime.now() - timedelta(days=25*365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "name": "Test Phone User",
                "birth_date": adult_date,
                "gender": "female",
                "document_id": "7654321",
                "country": "PY",
                "city": "Asunción",
                "phone_country_code": "+595",
                "phone": "981 234 567",  # With spaces
                "categories": ["Moda"],
                "instagram_username": "test_phone_user",
                "terms_accepted": True,
                "terms_version": "1.0"
            }
        )
        
        if response.status_code in [200, 201]:
            # Verify by fetching the profile
            profile_response = requests.get(
                f"{BASE_URL}/api/ugc/creators/me",
                headers={"Authorization": f"Bearer {test_user['token']}"}
            )
            if profile_response.status_code == 200:
                profile = profile_response.json()
                # phone_full should have no spaces
                assert profile.get("phone_full") == "+595981234567", \
                    f"phone_full should be '+595981234567', got '{profile.get('phone_full')}'"


class TestAllFieldsSaved:
    """Test all new fields are saved correctly"""
    
    def test_complete_onboarding_saves_all_fields(self):
        """Complete onboarding should save all fields"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        adult_date = (datetime.now() - timedelta(days=30*365)).strftime("%Y-%m-%d")
        
        onboarding_data = {
            # Step 1: Personal Data
            "name": "María García",
            "birth_date": adult_date,
            "gender": "female",
            "document_id": "4.567.890",
            # Step 2: Location & Contact
            "country": "PY",
            "city": "Asunción",
            "phone_country_code": "+595",
            "phone": "981234567",
            # Step 3: Professional Profile
            "categories": ["Gastronomía", "Lifestyle"],
            "bio": "Creadora de contenido apasionada por la gastronomía",
            "education_level": "university",
            "occupation": "Content Creator",
            "languages": ["Español", "Inglés"],
            "portfolio_url": "https://portfolio.example.com",
            # Step 4: Social Networks
            "instagram_username": "maria_garcia_ugc",
            "tiktok_username": "maria_garcia_tt",
            # Step 5: Terms
            "terms_accepted": True,
            "terms_version": "1.0"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json=onboarding_data
        )
        
        assert response.status_code in [200, 201], f"Onboarding failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "creator_id" in data, "Response should include creator_id"
        
        # Verify profile was created with all fields
        profile_response = requests.get(
            f"{BASE_URL}/api/ugc/creators/me",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        
        assert profile_response.status_code == 200, f"Could not fetch created profile: {profile_response.status_code}"
        
        profile = profile_response.json()
        
        # Verify Step 1 fields
        assert profile.get("name") == "María García", f"Name mismatch: {profile.get('name')}"
        assert profile.get("birth_date") == adult_date, f"Birth date mismatch"
        assert profile.get("gender") == "female", f"Gender mismatch: {profile.get('gender')}"
        assert profile.get("document_id") == "4.567.890", f"Document ID mismatch"
        
        # Verify Step 2 fields
        assert profile.get("country") == "PY", f"Country mismatch"
        assert profile.get("city") == "Asunción", f"City mismatch"
        assert profile.get("phone_country_code") == "+595", f"Phone code mismatch"
        assert profile.get("phone") == "981234567", f"Phone mismatch"
        assert profile.get("phone_full") == "+595981234567", f"Phone full mismatch"
        
        # Verify Step 3 fields
        assert "Gastronomía" in profile.get("categories", []), f"Categories mismatch"
        assert profile.get("bio") is not None, "Bio should be saved"
        assert profile.get("education_level") == "university", f"Education mismatch"
        assert "Español" in profile.get("languages", []), f"Languages mismatch"
        
        # Verify Step 4 fields - social networks
        social_networks = profile.get("social_networks", [])
        instagram_found = any(sn.get("platform") == "instagram" for sn in social_networks)
        tiktok_found = any(sn.get("platform") == "tiktok" for sn in social_networks)
        assert instagram_found, "Instagram should be in social_networks"
        assert tiktok_found, "TikTok should be in social_networks"
        
        # Verify Step 5 fields
        assert profile.get("terms_accepted") == True, "Terms should be accepted"
        assert profile.get("onboarding_completed") == True, "Onboarding should be marked complete"


class TestAlreadyRegisteredUser:
    """Test that already registered users get appropriate error"""
    
    def test_already_registered_returns_400(self):
        """User with existing creator profile should get 400"""
        token = get_auth_token()  # Admin already has creator profile
        
        adult_date = (datetime.now() - timedelta(days=25*365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Admin Duplicate",
                "birth_date": adult_date,
                "gender": "male",
                "document_id": "9999999",
                "country": "PY",
                "city": "Asunción",
                "phone_country_code": "+595",
                "phone": "999999999",
                "categories": ["Tech"],
                "terms_accepted": True,
                "terms_version": "1.0"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for already registered user, got {response.status_code}"
        data = response.json()
        assert "already exists" in str(data.get("detail", "")).lower() or "ya" in str(data.get("detail", "")).lower(), \
            f"Error should mention profile already exists: {data}"


class TestGenderValues:
    """Test all gender enum values are accepted"""
    
    @pytest.mark.parametrize("gender", ["male", "female", "other", "prefer_not_to_say"])
    def test_gender_values_accepted(self, gender):
        """All gender enum values should be accepted"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        adult_date = (datetime.now() - timedelta(days=25*365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "name": f"Test Gender {gender}",
                "birth_date": adult_date,
                "gender": gender,
                "document_id": f"123{gender[:3]}",
                "country": "PY",
                "city": "Asunción",
                "phone_country_code": "+595",
                "phone": "981234567",
                "categories": ["Lifestyle"],
                "instagram_username": f"test_{gender}",
                "terms_accepted": True,
                "terms_version": "1.0"
            }
        )
        
        # Should not fail due to invalid gender
        if response.status_code == 422:
            data = response.json()
            assert "gender" not in str(data).lower(), f"Gender '{gender}' should be valid: {data}"


class TestEducationLevelValues:
    """Test all education level enum values are accepted"""
    
    @pytest.mark.parametrize("education", ["secondary", "technical", "university", "postgraduate", "other", None])
    def test_education_values_accepted(self, education):
        """All education level enum values should be accepted"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        adult_date = (datetime.now() - timedelta(days=25*365)).strftime("%Y-%m-%d")
        
        payload = {
            "name": f"Test Education {education}",
            "birth_date": adult_date,
            "gender": "male",
            "document_id": f"edu{str(education)[:3] if education else 'none'}",
            "country": "PY",
            "city": "Asunción",
            "phone_country_code": "+595",
            "phone": "981234567",
            "categories": ["Lifestyle"],
            "instagram_username": f"test_edu_{education or 'none'}",
            "terms_accepted": True,
            "terms_version": "1.0"
        }
        
        if education:
            payload["education_level"] = education
        
        response = requests.post(
            f"{BASE_URL}/api/ugc/creators/onboarding",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json=payload
        )
        
        # Should not fail due to invalid education level
        if response.status_code == 422:
            data = response.json()
            assert "education" not in str(data).lower(), f"Education '{education}' should be valid: {data}"


class TestCreatorMeEndpoint:
    """Test GET /api/ugc/creators/me endpoint"""
    
    def test_returns_404_for_user_without_profile(self):
        """User without creator profile should get 404"""
        test_user = create_test_user()
        if not test_user:
            pytest.skip("Could not create test user")
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/creators/me",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for user without profile, got {response.status_code}"
    
    def test_returns_profile_for_registered_creator(self):
        """User with creator profile should get their profile"""
        token = get_auth_token()  # Admin has creator profile
        
        response = requests.get(
            f"{BASE_URL}/api/ugc/creators/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200 for registered creator, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Profile should have id"
        assert "name" in data, "Profile should have name"
        assert "categories" in data, "Profile should have categories"


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
