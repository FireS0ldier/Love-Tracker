from fastapi import FastAPI, APIRouter, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import logging
from pathlib import Path
import uuid
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'lovetrack')

logger.info(f"Connecting to MongoDB at {mongo_url}")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app and API router
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define models
class Couple(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # User ID of creator
    members: List[str]  # List of user IDs
    start_date: datetime
    pairing_code: Optional[str] = None
    pairing_expires: Optional[datetime] = None

class CoupleCreate(BaseModel):
    created_by: str
    start_date: datetime

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    auth_id: str  # Firebase auth ID
    couple_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    fcm_token: Optional[str] = None

class UserCreate(BaseModel):
    auth_id: str
    fcm_token: Optional[str] = None

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_id: str
    title: str
    description: Optional[str] = None
    date: datetime
    location: Optional[str] = None
    reminder_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    couple_id: str
    title: str
    description: Optional[str] = None
    date: datetime
    location: Optional[str] = None
    reminder_time: Optional[datetime] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    reminder_time: Optional[datetime] = None

# API routes
@api_router.get("/")
async def root():
    return {"message": "LoveTrack+ API is running"}

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"auth_id": user.auth_id})
    if existing_user:
        return User(**existing_user)
    
    # Create new user
    new_user = User(
        auth_id=user.auth_id,
        fcm_token=user.fcm_token
    )
    
    result = await db.users.insert_one(new_user.dict())
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    return User(**created_user)

@api_router.put("/users/{auth_id}/token")
async def update_fcm_token(auth_id: str, token: str = Body(..., embed=True)):
    result = await db.users.update_one(
        {"auth_id": auth_id},
        {"$set": {"fcm_token": token}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True}

@api_router.post("/couples", response_model=Couple)
async def create_couple(couple: CoupleCreate):
    # Generate a random 6-digit code
    from random import randint
    pairing_code = str(randint(100000, 999999))
    
    # Set expiration time (24 hours)
    from datetime import timedelta
    pairing_expires = datetime.utcnow() + timedelta(hours=24)
    
    # Create new couple
    new_couple = Couple(
        created_by=couple.created_by,
        members=[couple.created_by],
        start_date=couple.start_date,
        pairing_code=pairing_code,
        pairing_expires=pairing_expires
    )
    
    result = await db.couples.insert_one(new_couple.dict())
    created_couple = await db.couples.find_one({"_id": result.inserted_id})
    
    # Update the user with the couple ID
    await db.users.update_one(
        {"auth_id": couple.created_by},
        {"$set": {"couple_id": str(created_couple["_id"])}}
    )
    
    return Couple(**created_couple)

@api_router.post("/couples/join")
async def join_couple(auth_id: str = Body(...), code: str = Body(...)):
    # Find couple with matching code
    couple = await db.couples.find_one({"pairing_code": code})
    
    if not couple:
        raise HTTPException(status_code=404, detail="Invalid code or couple not found")
    
    # Check if code is expired
    if couple.get("pairing_expires") and couple["pairing_expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Pairing code has expired")
    
    # Check if user is already a member
    if auth_id in couple["members"]:
        return {"success": True, "couple_id": str(couple["_id"])}
    
    # Add user to members list
    await db.couples.update_one(
        {"_id": couple["_id"]},
        {
            "$addToSet": {"members": auth_id},
            "$unset": {"pairing_code": "", "pairing_expires": ""}
        }
    )
    
    # Update the user with the couple ID
    await db.users.update_one(
        {"auth_id": auth_id},
        {"$set": {"couple_id": str(couple["_id"])}}
    )
    
    return {"success": True, "couple_id": str(couple["_id"])}

@api_router.get("/couples/{couple_id}", response_model=Couple)
async def get_couple(couple_id: str):
    couple = await db.couples.find_one({"id": couple_id})
    
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")
    
    return Couple(**couple)

@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate):
    new_event = Event(
        couple_id=event.couple_id,
        title=event.title,
        description=event.description,
        date=event.date,
        location=event.location,
        reminder_time=event.reminder_time
    )
    
    result = await db.events.insert_one(new_event.dict())
    created_event = await db.events.find_one({"_id": result.inserted_id})
    
    return Event(**created_event)

@api_router.get("/events", response_model=List[Event])
async def get_events(couple_id: str):
    events = await db.events.find({"couple_id": couple_id}).to_list(1000)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_update: EventUpdate):
    # Get current event
    event = await db.events.find_one({"id": event_id})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Prepare update data
    update_data = {
        "updated_at": datetime.utcnow()
    }
    
    # Add only fields that are provided
    for field, value in event_update.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    # Update the event
    await db.events.update_one(
        {"id": event_id},
        {"$set": update_data}
    )
    
    # Get updated event
    updated_event = await db.events.find_one({"id": event_id})
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    result = await db.events.delete_one({"_id": event_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"success": True}

# Add API routes to app
app.include_router(api_router)

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Closed MongoDB connection")
