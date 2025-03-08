import os
import joblib
import pandas as pd

# Define the path to the trained model
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "context_switch_model.pkl")

def predict_context_switch(time_spent, keystrokes, mouse_clicks, app_switches_per_hour):
    """Loads the model and predicts context switching rate."""
    
    # Load the trained model
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}. Train the model first.")
    
    model = joblib.load(MODEL_PATH)
    
    # Prepare input data
    new_data = pd.DataFrame([[time_spent, keystrokes, mouse_clicks, app_switches_per_hour]], 
                            columns=["time_spent", "keystrokes", "mouse_clicks", "app_switches_per_hour"])
    
    # Predict context switching rate (continuous value)
    context_switch_rate = model.predict(new_data)[0]

    # Ensure the value stays in the 0-1 range
    return min(max(context_switch_rate, 0), 1)

# Example Usage
if __name__ == "__main__":
    result = predict_context_switch(40, 10, 3, 20)
    print(f"Estimated Context Switching Rate: {result:.2f}")
