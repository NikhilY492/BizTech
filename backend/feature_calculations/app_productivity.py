import json
from pymongo import MongoClient
from pymongo import ASCENDING
from bson.json_util import loads
import random
from datetime import datetime

# Load job profile data
job_profiles = {
    "Software Developer": {
        "productive": ["VS Code", "GitHub", "Stack Overflow", "AWS", "Jira"],
        "non_productive": ["YouTube (entertainment)", "Facebook", "Steam"]
    },
    "Digital Marketer": {
        "productive": ["Google Analytics", "SEMrush", "LinkedIn"],
        "non_productive": ["Netflix", "TikTok", "Gaming Websites"]
    },
    "Graphic Designer": {
        "productive": ["Photoshop", "Figma", "Behance"],
        "non_productive": ["Reddit", "Steam", "Hulu"]
    },
    "Data Scientist": {
        "productive": ["Jupyter Notebook", "Kaggle", "Tableau"],
        "non_productive": ["YouTube (random)", "Amazon", "Discord"]
    },
    "Content Creator": {
        "productive": ["YouTube (for content)", "OBS Studio", "Twitch"],
        "non_productive": ["Netflix", "YouTube (random watching)", "Steam"]
    }
}

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0")  
db = client["biztech_db"]  
activity_collection = db["activity"]  # Collection with logs (timestamps & active windows)
users_collection = db["users"]  # Collection with usernames & job roles
summary_collection = db["summary"]  # Collection to store productivity summaries
daily_metrics_collection = db["daily_metrics"]  # New collection to store daily metrics

# Initialize tracking variables
tracked_users = {}  # Stores last logs per user
user_productivity = {}  # Tracks productive & non-productive time per user

def get_job_role(username):
    """Fetch the job role from the users collection."""
    user_data = users_collection.find_one({"username": username})
    return user_data["job_role"] if user_data and "job_role" in user_data else "Unknown"

def classify_application(active_window, job_role):
    """Determine if an app is productive or non-productive based on the job role."""
    if job_role in job_profiles:
        for app in job_profiles[job_role]["productive"]:
            if app.lower() in active_window.lower():
                return "productive"
        for app in job_profiles[job_role]["non_productive"]:
            if app.lower() in active_window.lower():
                return "non_productive"
    return "unknown"

def convert_timestamp(timestamp):
    """Convert HH:MM:SS string to seconds since midnight."""
    try:
        time_obj = datetime.strptime(timestamp, "%H:%M:%S").time()
        return time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second
    except ValueError:
        print(f"Invalid timestamp format: {timestamp}")
        return None

def process_new_log(new_log):
    """Process a new log entry and update time tracking."""
    global tracked_users, user_productivity

    username = new_log["username"]
    active_window = new_log["active_window"]
    timestamp = convert_timestamp(new_log["timestamp"])
    if timestamp is None:
        return

    job_role = get_job_role(username)

    if username in tracked_users:
        last_log = tracked_users[username]
        last_timestamp = last_log["timestamp"]
        last_window = last_log["active_window"]

        time_spent = timestamp - last_timestamp
        classification = classify_application(last_window, job_role)

        if username not in user_productivity:
            user_productivity[username] = {"productive_time": 0, "non_productive_time": 0}

        if classification == "productive":
            user_productivity[username]["productive_time"] += time_spent
        elif classification == "non_productive":
            user_productivity[username]["non_productive_time"] += time_spent

        total_time = user_productivity[username]["productive_time"] + user_productivity[username]["non_productive_time"]
        productive_percentage = (user_productivity[username]["productive_time"] / total_time) * 100 if total_time > 0 else 0
        non_productive_percentage = (user_productivity[username]["non_productive_time"] / total_time) * 100 if total_time > 0 else 0

        activity_collection.update_one(
            {"_id": last_log["_id"]},
            {"$set": {"time_spent": time_spent, "classification": classification}}
        )

        summary_collection.update_one(
            {"username": username},
            {"$set": {
                "productive_time": user_productivity[username]["productive_time"],
                "non_productive_time": user_productivity[username]["non_productive_time"],
                "productive_percentage": productive_percentage,
                "non_productive_percentage": non_productive_percentage
            }},
            upsert=True
        )

        # Store daily metrics in MongoDB
        daily_metrics_collection.update_one(
            {"username": username, "date": datetime.today().strftime('%Y-%m-%d')},
            {"$set": {
                "productive_time": user_productivity[username]["productive_time"],
                "non_productive_time": user_productivity[username]["non_productive_time"],
                "productive_percentage": productive_percentage,
                "non_productive_percentage": non_productive_percentage
            }},
            upsert=True
        )

        print(f"User: {username} | Time Spent: {time_spent:.2f}s | App: {last_window} | Classified as: {classification}")
        print(f"Total Productive Time: {user_productivity[username]['productive_time']:.2f}s | Total Non-Productive Time: {user_productivity[username]['non_productive_time']:.2f}s")
        print(f"Productivity %: {productive_percentage:.2f}% | Non-Productivity %: {non_productive_percentage:.2f}%\n")

    tracked_users[username] = {
        "_id": new_log["_id"],
        "username": username,
        "active_window": active_window,
        "timestamp": timestamp
    }
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



watch_db()