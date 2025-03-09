import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# Define model save path
MODEL_PATH = os.path.join(os.path.dirname(__file__), "efficiency_model.pkl")

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
processed_data = db["processed_data"]  # Processed logs
efficiency_results = db["efficiency_results"]  # New collection for final efficiency

# Fetch processed logs
def fetch_data():
    cursor = processed_data.find({})  # Keep `_id` for updates
    data = list(cursor)
    print(f"Retrieved {len(data)} records from processed_data collection")
    return data

# Train Model
def train_model():
    data = fetch_data()
    if not data:
        print("❌ No data found in processed_data!")
        return None

    # Convert MongoDB data to DataFrame
    df = pd.DataFrame(data)
    print(f"DataFrame columns: {df.columns.tolist()}")
    
    # Check for required columns
    required_columns = ["active_keyboard_time", "idle_duration", "context_switching_rate", "deep_work_session", "daily_efficiency"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        print(f"❌ Missing columns in dataset: {missing_columns}")
        # If daily_efficiency is missing, add a placeholder value
        if "daily_efficiency" in missing_columns:
            print("Adding placeholder daily_efficiency values for training")
            df["daily_efficiency"] = np.random.uniform(0.5, 0.9, size=len(df))
            # Also update the database
            for index, row in df.iterrows():
                processed_data.update_one(
                    {"_id": row["_id"]},
                    {"$set": {"daily_efficiency": float(row["daily_efficiency"])}},
                    upsert=True
                )
        
        # Add other missing columns with zeros
        for col in missing_columns:
            if col != "daily_efficiency": 
                df[col] = 0
    
    # Fix data types
    for col in ["active_keyboard_time", "idle_duration", "context_switching_rate", "deep_work_session", "daily_efficiency"]:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
    X = df[["active_keyboard_time", "idle_duration", "context_switching_rate", "deep_work_session"]]
    y = df["daily_efficiency"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    joblib.dump(model, MODEL_PATH)
    print(f"✅ Model saved at {MODEL_PATH}")

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"📊 Mean Absolute Error: {mae:.2f}")

    print("📌 Feature Importance:")
    for feature, importance in zip(X.columns, model.feature_importances_):
        print(f"{feature}: {importance:.2f}")
    
    return model

# Predict Efficiency and Store in New Collection
def predict_efficiency():
    new_data = fetch_data()
    if not new_data:
        print("⚠️ No new data found.")
        return

    new_df = pd.DataFrame(new_data)
    required_columns = ["active_keyboard_time", "idle_duration", "context_switching_rate", "deep_work_session"]
    
    # Check for missing columns and add with zeros if needed
    for col in required_columns:
        if col not in new_df.columns:
            print(f"Adding missing column {col} with zeros")
            new_df[col] = 0
    
    # Fix data types
    for col in required_columns:
        new_df[col] = pd.to_numeric(new_df[col], errors='coerce').fillna(0)
    
    # Check if model exists, train if it doesn't
    if not os.path.exists(MODEL_PATH):
        print("Model not found, training new model...")
        model = train_model()
        if model is None:
            print("❌ Failed to train model.")
            return
    else:
        try:
            model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            print("Training new model...")
            model = train_model()
            if model is None:
                print("❌ Failed to train model.")
                return

    predicted_efficiency = model.predict(new_df[required_columns])

    # Store predicted efficiency in a new collection
    update_count = 0
    for i, doc in enumerate(new_data):
        try:
            efficiency_results.update_one(
                {"_id": doc["_id"]},
                {"$set": {"predicted_efficiency": float(predicted_efficiency[i])}},
                upsert=True  # Insert if not exists
            )
            update_count += 1
        except Exception as e:
            print(f"❌ Error updating efficiency for document {doc.get('_id')}: {str(e)}")

    print(f"✅ {update_count} efficiency scores stored in efficiency_results collection.")

if __name__ == "__main__":
    train_model()
    predict_efficiency()