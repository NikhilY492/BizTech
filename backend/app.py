from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

MONGO_URI="mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/?retryWrites=true&w=majority"
app.config["MONGO_URI"] = MONGO_URI

mongo = PyMongo(app)
bcrypt = Bcrypt(app)
users_collection = mongo.db.users  # Define users collection

# Root Endpoint - Health Check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Server is running!"}), 200


# User Login
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"message": "Username and password required"}), 400

        user = users_collection.find_one({"username": username})

        if user and bcrypt.check_password_hash(user["password"], password):
            return jsonify({
                "message": "Login successful",
                "username": username,
                "fullname": user.get("fullname", username)
            }), 200
        else:
            return jsonify({"message": "Invalid username or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Get User by Username
@app.route("/user/<username>", methods=["GET"])
def get_user(username):
    try:
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Remove sensitive data
        user.pop("password", None)  # Remove password field
        user["_id"] = str(user["_id"])  # Convert ObjectId to string

        return jsonify(user), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Add User (Manually)
@app.route("/add_user", methods=["POST"])
def add_user():
    try:
        data = request.json
        username = data.get("username")
        fullname = data.get("fullname")
        password = data.get("password")
        user_type = data.get("user_type", "student")  # Default to student

        if not username or not password or not fullname:
            return jsonify({"message": "Missing required fields"}), 400

        # Check if user already exists
        if users_collection.find_one({"username": username}):
            return jsonify({"message": "Username already exists"}), 409

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        user_data = {
            "username": username,
            "fullname": fullname,
            "password": hashed_password,
            "user_type": user_type
        }

        users_collection.insert_one(user_data)
        return jsonify({"message": "User added successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)