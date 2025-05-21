import requests
import sys
import json
from datetime import datetime, timedelta

def test_frontend_backend_integration():
    """
    Test the integration between frontend and backend by simulating the frontend API calls
    """
    # Get the backend URL from the frontend .env file
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if 'REACT_APP_BACKEND_URL' in line:
                    backend_url = line.split('=')[1].strip()
                    break
    except Exception as e:
        print(f"Error reading .env file: {str(e)}")
        backend_url = "https://533580d1-6472-4f3c-808e-18799e6019c1.preview.emergentagent.com"
    
    print(f"Using backend URL: {backend_url}")
    
    # Test creating a couple (simulating what the frontend should do)
    print("\n🔍 Testing Create Couple API...")
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    try:
        response = requests.post(
            f"{backend_url}/api/couples",
            json={"start_date": start_date, "created_by": "test_user"},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            print(f"✅ Passed - Status: {response.status_code}")
            couple_data = response.json()
            couple_id = couple_data.get('id')
            couple_code = couple_data.get('code')
            print(f"Created couple with ID: {couple_id} and code: {couple_code}")
            
            # Test getting the couple
            print("\n🔍 Testing Get Couple API...")
            response = requests.get(
                f"{backend_url}/api/couples/{couple_id}",
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                print(f"✅ Passed - Status: {response.status_code}")
                couple = response.json()
                print(f"Couple details: {json.dumps(couple, indent=2)}")
                
                # Verify the start date
                if couple.get('start_date') == start_date:
                    print("✅ Start date is correct")
                else:
                    print(f"❌ Start date mismatch: expected {start_date}, got {couple.get('start_date')}")
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
            
            # Test creating an event
            print("\n🔍 Testing Create Event API...")
            event_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
            event_data = {
                "couple_id": couple_id,
                "title": "Test Event",
                "description": "This is a test event",
                "date": event_date,
                "location": "Test Location",
                "created_by": "test_user"
            }
            
            response = requests.post(
                f"{backend_url}/api/events",
                json=event_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                print(f"✅ Passed - Status: {response.status_code}")
                event = response.json()
                event_id = event.get('id')
                print(f"Created event with ID: {event_id}")
                
                # Test getting events
                print("\n🔍 Testing Get Events API...")
                response = requests.get(
                    f"{backend_url}/api/events",
                    params={"couple_id": couple_id},
                    headers={'Content-Type': 'application/json'}
                )
                
                if response.status_code == 200:
                    print(f"✅ Passed - Status: {response.status_code}")
                    events = response.json()
                    print(f"Found {len(events)} events")
                else:
                    print(f"❌ Failed - Status: {response.status_code}")
                    print(f"Response: {response.text}")
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
        else:
            print(f"❌ Failed - Status: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ Failed - Error: {str(e)}")

if __name__ == "__main__":
    test_frontend_backend_integration()