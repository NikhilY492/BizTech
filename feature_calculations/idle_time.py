import time
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0") 
db = client["biztech_db"]  
activity_collection = db["activity"]  

# Initialize total idle time (in seconds)
total_idle_time = 0

def update_idle_time(new_log):
    """Update idle time based on the latest log."""
    global total_idle_time

    timestamp = new_log.get("timestamp")  # Get timestamp of the log
    mouse_clicks = new_log.get("mouse_clicks", 1)  
    keyboard_time = new_log.get("keyboard_activity", 1)  
    app_switches = new_log.get("app_switches", 1)

    # If both are zero, increment idle time
    if mouse_clicks == 0 and keyboard_time == 0 and app_switches == 0:
        total_idle_time += 10  # Since logs are every 10s

    print(f"Updated Idle Time: {total_idle_time} seconds")

def watch_db():
    """Monitor the activity collection for new logs and process them in real-time."""
    print("Listening for new logs...")
    pipeline = [{"$match": {"operationType": "insert"}}]
    with activity_collection.watch(pipeline) as stream:
        for change in stream:
            new_log = change["fullDocument"]
            update_idle_time(new_log)  # Update idle time based on the log

# Start monitoring for new logs
watch_db()
