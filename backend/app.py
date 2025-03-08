from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import time
import pygetwindow as gw
from pynput import keyboard, mouse
import threading

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})

# MongoDB Config
app.config["MONGO_URI"] = "mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0"
mongo = PyMongo(app)

# Global counters for keyboard & mouse tracking
keyboard_presses = 0
mouse_clicks = 0
app_switches = 0
previous_window = None
tracking_initialized = False

# Keyboard event listener
def on_key_press(key):
    global keyboard_presses
    keyboard_presses += 1

keyboard_listener = keyboard.Listener(on_press=on_key_press)
keyboard_listener.start()

# Mouse event listener
def on_click(x, y, button, pressed):
    global mouse_clicks
    if pressed:
        mouse_clicks += 1

mouse_listener = mouse.Listener(on_click=on_click)
mouse_listener.start()

# Handle CORS preflight requests
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    response = make_response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# User Signup
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    required_fields = ["fullname", "username", "jobrole", "password"]
    
    if not all(k in data for k in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    if mongo.db.users.find_one({"username": data["username"]}):
        return jsonify({"error": "Username already exists"}), 409

    hashed_password = generate_password_hash(data["password"])
    mongo.db.users.insert_one({
        "fullname": data["fullname"],
        "username": data["username"],
        "jobrole": data["jobrole"],
        "password": hashed_password
    })
    
    return jsonify({"message": "User registered successfully"}), 201

# User Login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = mongo.db.users.find_one({"username": data["username"]})

    if user and check_password_hash(user["password"], data["password"]):
        return jsonify({"message": "Login successful", "jobrole": user["jobrole"]}), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# Get Active Window
def get_active_window():
    try:
        window = gw.getActiveWindow()
        return window.title.lower() if window else ""
    except:
        return ""

# Classify Window Productivity
def classify_window(title):
    productive_apps = ["visual studio code", "github", "pycharm", "slack"]
    unproductive_apps = ["youtube", "netflix", "facebook"]

    if any(app in title for app in productive_apps):
        return "productive"
    elif any(app in title for app in unproductive_apps):
        return "unproductive"
    return "unknown"

# Track User Activity
@app.route('/update_activity', methods=['POST'])
def update_activity():
    global keyboard_presses, mouse_clicks
    
    data = request.json
    username = data.get("username")
    
    if not username:
        return jsonify({"error": "Username required"}), 400
    
    # Capture active window
    active_window = get_active_window()
    productivity_status = classify_window(active_window)

    # Fetch app switch count from MongoDB
    tracking_data = mongo.db.activity.find_one({"username": "global_tracking"})
    app_switches = tracking_data.get("app_switches", 0) if tracking_data else 0

    # Get system time in HH:MM:SS format
    system_time = time.strftime('%H:%M:%S')

    # Store data in MongoDB
    mongo.db.activity.insert_one({
        "username": username,
        "keyboard_activity": keyboard_presses,
        "mouse_clicks": mouse_clicks,
        "active_window": active_window,
        "productivity_status": productivity_status,
        "timestamp": system_time,
        "app_switches": app_switches
    })

    # Reset only keyboard and mouse counters
    keyboard_presses = 0
    mouse_clicks = 0

    return jsonify({
        "message": "Activity updated successfully",
        "app_switches": app_switches
    }), 200


# Initialize global tracking if not exists
def initialize_tracking():
    global tracking_initialized
    
    if not tracking_initialized:
        # Set initial values if global tracking document doesn't exist
        current_window = get_active_window()
        mongo.db.activity.update_one(
            {"username": "global_tracking"},
            {"$setOnInsert": {
                "last_active_window": current_window,
                "app_switches": 0
            }},
            upsert=True
        )
        tracking_initialized = True

# Background Task to Track App Switches
def track_app_switches():
    global previous_window
    
    # Wait for Flask to fully initialize before starting tracking
    time.sleep(2)
    
    # Initialize tracking data
    initialize_tracking()
    
    while True:
        try:
            active_window = get_active_window()
            
            if active_window:
                # Fetch last known active window from MongoDB
                stored_data = mongo.db.activity.find_one({"username": "global_tracking"})
                
                if stored_data:
                    last_window = stored_data.get("last_active_window", "")
                    current_switches = stored_data.get("app_switches", 0)
                    
                    # If window has changed, increment the counter
                    if last_window and last_window != active_window:
                        current_switches += 1
                        
                        # Update the global tracking document
                        mongo.db.activity.update_one(
                            {"username": "global_tracking"},
                            {"$set": {
                                "last_active_window": active_window,
                                "app_switches": current_switches
                            }}
                        )
                        print(f"Window switched from '{last_window}' to '{active_window}'. Total switches: {current_switches}")
            
            time.sleep(1.5)  # Check every 1.5 seconds
        except Exception as e:
            print(f"Error in tracking thread: {e}")
            time.sleep(5)  # Wait longer if there's an error


# Start the tracking thread manually
def start_tracking():
    threading.Thread(target=track_app_switches, daemon=True).start()
    print("App switch tracking started")

# In Flask 2.0+, we need to use a different approach instead of before_first_request
# We'll use the app context directly

# Create a special route to initialize tracking only once
tracking_started = False


@app.route('/init_tracking', methods=['GET'])
def init_tracking():
    global tracking_started
    if not tracking_started:
        start_tracking()
        tracking_started = True
    return jsonify({"message": "Tracking initialized"}), 200

if __name__ == '__main__':
    # Start tracking thread before running the app
    start_tracking()
    app.run(debug=True)