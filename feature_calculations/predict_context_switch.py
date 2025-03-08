import os
import joblib
import time
from pymongo import MongoClient
import pandas as pd
from bson.json_util import loads
import random

# Define model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "context_switch_model.pkl")

# Load the trained model
model = joblib.load(MODEL_PATH)

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
collection = db["activity"]
daily_metrics_collection = db["daily_metrics"]  # Collection for daily metrics


def predict_context_switch(log):
    """Predicts the context-switching rate based on the latest log and updates DB."""
    username = log.get("username", "Unknown")  # Get username from log
    features = {
        "time_spent": 60,  # Placeholder if not present in logs
        "keystrokes": log.get("keyboard_activity", 0),
        "mouse_clicks": log.get("mouse_clicks", 0),
        "app_switches_per_hour": log.get("app_switches", 0),
    }

    # Convert to DataFrame for prediction
    input_df = pd.DataFrame([features])
    predicted_rate = model.predict(input_df)[0]
    
    print(f"Predicted Context Switch Rate for {username}: {predicted_rate:.2f}")
    
    # Update the daily_metrics_collection with context-switch rate
    daily_metrics_collection.update_one(
        {"username": username, "date": time.strftime('%Y-%m-%d')},
        {"$set": {"context_switch_rate": predicted_rate}},
        upsert=True
    )

    return predicted_rate

def watch_db():
    """Monitor the activity collection for new logs and process them in real-time."""
    print("Listening for new logs...")

    pipeline = [{"$match": {"operationType": "insert"}}]
    log_count = 0  

    with collection.watch(pipeline) as stream:
        for change in stream:
            new_log = change["fullDocument"]
            predict_context_switch(new_log)  # Replace with respective function

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



# Testing function
def process_any_two_logs():
    """Fetch and process any 2 logs randomly for testing."""
    print("Processing any 2 logs...")
    
    all_logs = list(collection.find({"active_window": {"$exists": True}}))  # Ensure logs have 'active_window'
    
    if len(all_logs) < 2:
        print("Not enough logs available to process.")
        return
    
    random_logs = random.sample(all_logs, 2)  # Pick any two logs randomly
    
    for log in random_logs:
        predict_context_switch(log)

if __name__ == "__main__":
    watch_db()

# if __name__ == "__main__":
#     process_any_two_logs()
