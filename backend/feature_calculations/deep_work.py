import time
from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
activity_collection = db["activity"]
daily_metrics_collection = db["daily_metrics"]  # New collection for daily idle time tracking

# Initialize total idle time (in seconds)
total_idle_time = 0

def update_idle_time(new_log):
    """Update idle time based on the latest log and save to daily_metrics_collection."""
    global total_idle_time

    username = new_log.get("username")
    timestamp = new_log.get("timestamp")
    mouse_clicks = new_log.get("mouse_clicks", 1)
    keyboard_time = new_log.get("keyboard_activity", 1)
    app_switches = new_log.get("app_switches", 1)

    # If no activity is detected, increment idle time
    if mouse_clicks == 0 and keyboard_time == 0 and app_switches == 0:
        total_idle_time += 10  # Since logs are every 10s

        # Store idle time in daily_metrics_collection
        daily_metrics_collection.update_one(
            {"username": username, "date": datetime.today().strftime('%Y-%m-%d')},
            {"$inc": {"idle_time": 10}},
            upsert=True
        )

    print(f"Updated Idle Time: {total_idle_time} seconds")