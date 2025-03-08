from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import time
import pygetwindow as gw
from pynput import keyboard, mouse

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# MongoDB Config
app.config["MONGO_URI"] = "mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0"
mongo = PyMongo(app)

# Global counters for keyboard & mouse tracking
keyboard_presses = 0
mouse_clicks = 0
app_switches = 0
previous_window = None

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

@app.route('/get_activity/<username>', methods=['GET'])
def get_activity(username):
    activities = list(mongo.db.activity.find({"username": username}))
    for activity in activities:
        activity["_id"] = str(activity["_id"])
    return jsonify(activities), 200

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

    # Count app switches
    if previous_window and previous_window != active_window:
        app_switches += 1
    previous_window = active_window

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

    # Reset counters after storing
    keyboard_presses = 0
    mouse_clicks = 0
    app_switches = 0

    return jsonify({"message": "Activity updated successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)
