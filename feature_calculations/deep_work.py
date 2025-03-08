from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
activity_collection = db["activity"]
summary_collection = db["summary"]
daily_metrics_collection = db["daily_metrics"]  # New collection to store deep work data

# Dictionary to track deep work streaks per user
user_streaks = {}

def convert_timestamp(timestamp):
    """Convert HH:MM:SS string to seconds since midnight."""
    try:
        time_obj = datetime.strptime(timestamp, "%H:%M:%S").time()
        return time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second
    except ValueError:
        print(f"Invalid timestamp format: {timestamp}")
        return None

def process_new_log(new_log):
    """Process a new log entry to calculate deep work time."""
    global user_streaks
    
    username = new_log["username"]
    timestamp = convert_timestamp(new_log["timestamp"])
    if timestamp is None:
        return  # Skip log if timestamp is invalid
    
    # Fetch productivity classification from summary collection
    summary = summary_collection.find_one({"username": username})
    if not summary or "productive_time" not in summary:
        return  # Skip if no productivity data available
    
    # Check if the last log was productive
    last_log = activity_collection.find_one({"username": username}, sort=[("timestamp", -1)])
    if not last_log:
        return
    
    last_timestamp = convert_timestamp(last_log["timestamp"])
    if last_timestamp is None:
        return
    
    time_spent = timestamp - last_timestamp
    
    # Maintain streak count
    if summary["productive_time"] > summary["non_productive_time"]:
        if username not in user_streaks:
            user_streaks[username] = {"streak": 0, "deep_work_time": 0}
        
        user_streaks[username]["streak"] += 1
        user_streaks[username]["deep_work_time"] += time_spent
        
        # Only count deep work if at least 4 consecutive logs are productive
        if user_streaks[username]["streak"] >= 4:
            # Update deep work time in the daily_metrics_collection
            daily_metrics_collection.update_one(
                {"username": username, "date": datetime.today().strftime('%Y-%m-%d')},
                {"$inc": {"deep_work_time": time_spent}},
                upsert=True
            )
            print(f"Deep work time added for {username}: {time_spent}s")
    else:
        user_streaks[username]["streak"] = 0  # Reset streak on non-productive log

def watch_db():
    """Monitor the activity collection for new logs and process them in real-time."""
    print("Listening for new logs...")

    pipeline = [{"$match": {"operationType": "insert"}}]
    log_count = 0  

    with activity_collection.watch(pipeline) as stream:
        for change in stream:
            new_log = change["fullDocument"]
            process_new_log(new_log)  # Replace with respective function

            log_count += 1
            if log_count >= 20:
                print("Processed 20 logs. Stopping watch_db.")

                # Increment shared counter in MongoDB
                db["processing_status"].update_one(
                    {"_id": "watch_db_counter"},
                    {"$inc": {"completed_files": 1}},
                    upsert=True
                )

                break  # Stop watching after 20 logs


# Start monitoring logs
watch_db()
