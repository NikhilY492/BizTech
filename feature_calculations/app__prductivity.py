import json
from pymongo import MongoClient
from pymongo import ASCENDING
from bson.json_util import loads
import random

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
summary_collection = db["summary"]  # New collection to store productivity summaries

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

from datetime import datetime

def convert_timestamp(timestamp):
    """Convert HH:MM:SS string to seconds since midnight."""
    try:
        time_obj = datetime.strptime(timestamp, "%H:%M:%S").time()
        return time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second
    except ValueError:
        print(f"Invalid timestamp format: {timestamp}")
        return None  # Return None if parsing fails

def process_new_log(new_log):
    """Process a new log entry and update time tracking."""
    global tracked_users, user_productivity

    username = new_log["username"]
    active_window = new_log["active_window"]

    # Convert timestamp to seconds since midnight
    timestamp = convert_timestamp(new_log["timestamp"])
    if timestamp is None:
        return  # Skip log if timestamp is invalid

    # Get job role from users collection
    job_role = get_job_role(username)

    if username in tracked_users:
        last_log = tracked_users[username]
        last_timestamp = last_log["timestamp"]
        last_window = last_log["active_window"]

        # Calculate time spent on previous application
        time_spent = timestamp - last_timestamp
        classification = classify_application(last_window, job_role)

        # Initialize user's productivity tracking if not already set
        if username not in user_productivity:
            user_productivity[username] = {"productive_time": 0, "non_productive_time": 0}

        # Update total time spent on productive & non-productive apps
        if classification == "productive":
            user_productivity[username]["productive_time"] += time_spent
        elif classification == "non_productive":
            user_productivity[username]["non_productive_time"] += time_spent

        # Calculate percentages
        total_time = user_productivity[username]["productive_time"] + user_productivity[username]["non_productive_time"]
        if total_time > 0:
            productive_percentage = (user_productivity[username]["productive_time"] / total_time) * 100
            non_productive_percentage = (user_productivity[username]["non_productive_time"] / total_time) * 100
        else:
            productive_percentage = non_productive_percentage = 0

        # Update the activity log in DB
        activity_collection.update_one(
            {"_id": last_log["_id"]},
            {"$set": {
                "time_spent": time_spent,
                "classification": classification
            }}
        )

        # Store user productivity summary in a separate collection
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

        print(f"User: {username} | Time Spent: {time_spent:.2f}s | App: {last_window} | Classified as: {classification}")
        print(f"Total Productive Time: {user_productivity[username]['productive_time']:.2f}s | Total Non-Productive Time: {user_productivity[username]['non_productive_time']:.2f}s")
        print(f"Productivity %: {productive_percentage:.2f}% | Non-Productivity %: {non_productive_percentage:.2f}%\n")

    # Update last log for the user
    tracked_users[username] = {
        "_id": new_log["_id"],
        "username": username,
        "active_window": active_window,
        "timestamp": timestamp  # Now stored as seconds since midnight
    }

#Testing Function
def process_any_two_logs():
    """Fetch and process any 2 logs randomly for testing."""
    print("Processing any 2 logs...")
    
    all_logs = list(activity_collection.find({"active_window": {"$exists": True}}))  # Ensure logs have 'active_window'
    
    if len(all_logs) < 2:
        print("Not enough logs available to process.")
        return
    
    random_logs = random.sample(all_logs, 2)  # Pick any two logs randomly
    
    for log in random_logs:
        process_new_log(log)



def watch_db():
    """Monitor the activity collection for new logs and process them in real-time."""
    print("Listening for new logs...")
    pipeline = [{"$match": {"operationType": "insert"}}]
    with activity_collection.watch(pipeline) as stream:
        for change in stream:
            new_log = change["fullDocument"]
            process_new_log(new_log)

# Run test processing before starting real-time monitoring
#process_any_two_logs()
watch_db()
