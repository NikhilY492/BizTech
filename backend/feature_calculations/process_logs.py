import time
import pandas as pd
from pymongo import MongoClient
from predict_context_switch import predict_context_switch_fun
from app_productivity import process_new_log
from idle_time import update_idle_time
from deep_work import process_new_log1
from model import train_model, predict_efficiency
from bson import ObjectId

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
activity = db["activity"]
processed_data = db["processed_data"]

def fetch_logs():
    logs = list(activity.find({}))
    if not logs:
        print("⚠️ No logs found in MongoDB. Check if `activity` collection has data.")
    else:
        print(f"✅ Retrieved {len(logs)} logs from `activity`.")
    return logs

def process_all_logs():
    logs = fetch_logs()
    if not logs:
        return
    
    processed_count = 0
    error_count = 0

    for log in logs:
        log_id = log.get("_id")
        if not log_id:
            print("❌ Skipping log with missing `_id`:", log)
            continue

        try:
            # Add debug prints to check input/output of each function
            print(f"Processing log ID: {log_id}")
            
            # Process each metric with better error handling
            try:
                predicted_rate = predict_context_switch_fun(log)
                print(f"Context switch rate: {predicted_rate}")
            except Exception as e:
                print(f"Error calculating context switch rate: {str(e)}")
                predicted_rate = 0
            
            try:
                idle_time_value = update_idle_time(log)
                print(f"Idle time: {idle_time_value}")
            except Exception as e:
                print(f"Error calculating idle time: {str(e)}")
                idle_time_value = 0
            
            try:
                productivity = process_new_log(log)
                print(f"Productivity: {productivity}")
            except Exception as e:
                print(f"Error calculating productivity: {str(e)}")
                productivity = 0
            
            try:
                deep_work_value = process_new_log1(log)
                print(f"Deep work: {deep_work_value}")
            except Exception as e:
                print(f"Error calculating deep work: {str(e)}")
                deep_work_value = 0
            
            # Ensure we're using ObjectId correctly
            if isinstance(log_id, str):
                try:
                    log_id = ObjectId(log_id)
                except Exception as e:
                    print(f"Error converting ID to ObjectId: {str(e)}")
            
            # Add sample daily_efficiency for training purposes
            # In a real system, this would come from user feedback or other metrics
            sample_efficiency = 0.7  # This is just a placeholder
            
            # Update processed_data collection
            result = processed_data.update_one(
                {"_id": log_id},
                {"$set": {
                    "app_productivity": productivity,
                    "idle_duration": idle_time_value,
                    "context_switching_rate": predicted_rate,
                    "deep_work_session": deep_work_value,
                    "active_keyboard_time": log.get("active_keyboard_time", 0),  # Ensure this field exists
                    "daily_efficiency": sample_efficiency  # Add this for model training
                }},
                upsert=True
            )
            
            if result.modified_count > 0 or result.upserted_id:
                print(f"✅ Updated log {log_id} in `processed_data`.")
                processed_count += 1
            else:
                print(f"⚠️ No changes made for log {log_id}.")
                
        except Exception as e:
            print(f"❌ Error processing log {log_id}: {str(e)}")
            error_count += 1

    print(f"🎯 Processing complete: {processed_count} logs processed, {error_count} errors.")

def verify_processed_data():
    count = processed_data.count_documents({})
    if count == 0:
        print("❌ No data found in `processed_data`. Ensure logs are being processed correctly.")
    else:
        print(f"✅ `processed_data` contains {count} processed logs.")
        # Print a sample document to verify structure
        sample = processed_data.find_one({})
        print("Sample document structure:")
        print(sample)

if __name__ == "__main__":
    process_all_logs()
    verify_processed_data()
    print("🚀 Training Model and Predicting Efficiency...")
    train_model()
    predict_efficiency()
    print("🎯 All tasks completed successfully!")