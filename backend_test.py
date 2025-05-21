import requests
import sys
from datetime import datetime, timedelta
import uuid
import json

class LoveTrackAPITester:
    def __init__(self, base_url="https://533580d1-6472-4f3c-808e-18799e6019c1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.couple_id = None
        self.event_id = None
        self.auth_id = str(uuid.uuid4())  # Generate a random auth ID for testing

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test the API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200
        )

    def test_create_user(self):
        """Test creating a new user"""
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data={"auth_id": self.auth_id}
        )
        return success

    def test_create_couple(self):
        """Test creating a new couple"""
        start_date = datetime.utcnow() - timedelta(days=30)  # Relationship started 30 days ago
        
        success, response = self.run_test(
            "Create Couple",
            "POST",
            "couples",
            200,
            data={
                "created_by": self.auth_id,
                "start_date": start_date.isoformat()
            }
        )
        
        if success and "id" in response:
            self.couple_id = response["id"]
            print(f"Created couple with ID: {self.couple_id}")
            print(f"Pairing code: {response.get('pairing_code')}")
            return True
        return False

    def test_get_couple(self):
        """Test getting couple details"""
        if not self.couple_id:
            print("❌ No couple ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Get Couple",
            "GET",
            f"couples/{self.couple_id}",
            200
        )
        
        if success:
            # Verify the couple has the correct start date
            start_date = datetime.fromisoformat(response["start_date"].replace("Z", "+00:00"))
            expected_date = datetime.utcnow() - timedelta(days=30)
            date_diff = abs((start_date - expected_date).total_seconds())
            
            if date_diff < 86400:  # Within 24 hours
                print("✅ Start date is correct")
                return True
            else:
                print(f"❌ Start date is incorrect: {start_date}")
                return False
        return False

    def test_create_event(self):
        """Test creating a new event"""
        if not self.couple_id:
            print("❌ No couple ID available, skipping test")
            return False
            
        event_date = datetime.utcnow() + timedelta(days=7)  # Event in 7 days
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data={
                "couple_id": self.couple_id,
                "title": "Test Anniversary",
                "description": "This is a test event",
                "date": event_date.isoformat(),
                "location": "Test Location"
            }
        )
        
        if success and "id" in response:
            self.event_id = response["id"]
            print(f"Created event with ID: {self.event_id}")
            return True
        return False

    def test_get_events(self):
        """Test getting all events for a couple"""
        if not self.couple_id:
            print("❌ No couple ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Get Events",
            "GET",
            f"events?couple_id={self.couple_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Found {len(response)} events")
            return True
        return False

    def test_get_event(self):
        """Test getting a specific event"""
        if not self.event_id:
            print("❌ No event ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Get Event",
            "GET",
            f"events/{self.event_id}",
            200
        )
        
        if success and "id" in response:
            print(f"✅ Retrieved event: {response['title']}")
            return True
        return False

    def test_update_event(self):
        """Test updating an event"""
        if not self.event_id:
            print("❌ No event ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Update Event",
            "PUT",
            f"events/{self.event_id}",
            200,
            data={
                "title": "Updated Test Event",
                "description": "This event has been updated"
            }
        )
        
        if success and response.get("title") == "Updated Test Event":
            print("✅ Event updated successfully")
            return True
        return False

    def test_delete_event(self):
        """Test deleting an event"""
        if not self.event_id:
            print("❌ No event ID available, skipping test")
            return False
            
        success, _ = self.run_test(
            "Delete Event",
            "DELETE",
            f"events/{self.event_id}",
            200
        )
        
        return success

def main():
    # Setup
    tester = LoveTrackAPITester()
    
    # Run tests
    tester.test_api_root()
    tester.test_create_user()
    tester.test_create_couple()
    tester.test_get_couple()
    tester.test_create_event()
    tester.test_get_events()
    tester.test_get_event()
    tester.test_update_event()
    tester.test_delete_event()

    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())