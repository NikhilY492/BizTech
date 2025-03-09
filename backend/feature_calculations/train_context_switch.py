import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib  

# Define model save path
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "context_switch_model.pkl")

def train_context_switch_model():
    """Trains and saves the context switching rate prediction model."""
    
    # Ensure the models directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Sample dataset (Replace with real collected data)
    data = pd.DataFrame({
        "time_spent": [120, 60, 30, 90, 45, 20, 75, 15, 200, 100, 50, 25],
        "keystrokes": [50, 10, 5, 40, 15, 8, 30, 3, 60, 25, 12, 6],
        "mouse_clicks": [10, 5, 3, 8, 4, 2, 6, 1, 15, 7, 4, 2],
        "app_switches_per_hour": [5, 15, 20, 7, 25, 30, 8, 35, 3, 10, 18, 28],  # New Feature
        "context_switch_rate": [0.2, 0.7, 0.9, 0.3, 0.8, 0.95, 0.4, 1.0, 0.1, 0.75, 0.85, 0.92]  # Rate from 0 to 1
    })
    
    # Splitting dataset into features (X) and target (y)
    X = data.drop(columns=["context_switch_rate"])
    y = data["context_switch_rate"]
    
    # Split data into training and testing sets (80% training, 20% testing)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train the Random Forest Regressor
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Mean Absolute Error: {mae:.2f}")
    
    # Save the trained model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved as {MODEL_PATH}")

if __name__ == "__main__":
    train_context_switch_model()