from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains (restrict in production)

# MongoDB Config (Make sure to add a database name)
app.config["MONGO_URI"] = "mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0"
mongo = PyMongo(app)

# User Signup
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    required_fields = ["fullname", "username", "jobrole", "password"]
    
    if not all(k in data for k in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    # Check if username already exists
    if mongo.db.users.find_one({"username": data["username"]}):
        return jsonify({"error": "Username already exists"}), 409

    # Hash password before storing
    hashed_password = generate_password_hash(data["password"])
    
    # Insert user
    mongo.db.users.insert_one({
        "fullname": data["fullname"],
        "username": data["username"],
        "jobrole": data["jobrole"],
        "password": hashed_password  # Store hashed password
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


if __name__ == '__main__':
    app.run(debug=True)
