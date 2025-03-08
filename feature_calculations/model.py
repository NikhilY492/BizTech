import os
import time
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib  # For saving and loading models

# Define model save path
MODEL_DIR = os.path.join(os.path.dirname(__file__), "feature_calculations", "models")
os.makedirs(MODEL_DIR, exist_ok=True)  # Ensure directory exists
MODEL_PATH = os.path.join(MODEL_DIR, "efficiency_model.pkl")

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
daily_metrics_collection = db["daily_metrics_collection"]
processing_status_collection = db["processing_status"]

# Wait until all watch_db functions have completed processing 20 logs each
def wait_for_all_logs():
    """Waits until all four watch_db functions have processed 20 logs each."""
    while True:
        status = processing_status_collection.find_one({"_id": "watch_db_counter"})
        completed_files = status["completed_files"] if status else 0

        if completed_files >= 4:
            print("All four processes completed. Running model.py...")
            return  # Exit loop and proceed with efficiency calculation

        print(f"Waiting... {completed_files}/4 files completed.")
        time.sleep(5)  # Wait for 5 seconds before checking again

# Fetching data from MongoDB
def fetch_data():
    cursor = daily_metrics_collection.find({}, {"_id": 0})  # Exclude _id field
    return list(cursor)

# Function to train the model
def train_model():
    data = fetch_data()
    if not data:
        print("No data found in daily_metrics_collection!")
        return

    data = pd.DataFrame(data)

    # Selecting only the required four parameters and the target variable
    data = data[["active_keyboard_time", "idle_duration", "context_switching_rate", "deep_work_session", "daily_efficiency"]]

    # Splitting into features and target
    X = data.drop(columns=["daily_efficiency"])
    y = data["daily_efficiency"]

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train the Random Forest Model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Save trained model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    # Predict on test data
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Mean Absolute Error: {mae:.2f}")

    # Feature importance
    importances = model.feature_importances_
    feature_names = X.columns
    print("Feature weightage:")
    for feature, importance in zip(feature_names, importances):
        print(f"{feature}: {importance:.2f}")

# Function to predict efficiency for new data
def predict_efficiency():
    new_data = fetch_data()
    if not new_data:
        print("No new data found.")
        return

    new_df = pd.DataFrame(new_data)[["active_keyboard_time", "idle_duration", "context_switching_rate", "deep_work_session"]]
    
    model = joblib.load(MODEL_PATH)
    predicted_efficiency = model.predict(new_df)
    
    # Update predictions in MongoDB
    for i, doc in enumerate(new_data):
        daily_metrics_collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"predicted_efficiency": predicted_efficiency[i]}}
        )
    print("Efficiency scores updated in MongoDB.")

if __name__ == "__main__":
    wait_for_all_logs()  # Wait until all four files finish processing 20 logs
    train_model()  # Train the model after all logs are processed
    predict_efficiency()  # Run efficiency predictions
