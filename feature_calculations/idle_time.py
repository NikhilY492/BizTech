from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/biztech_db?retryWrites=true&w=majority&appName=Cluster0") 
db = client["biztech_db"]  # Replace with your DB name
collection = db["activity"]  # Replace with your collection name

# Initialize total idle time (in seconds)
total_idle_time = 0

# Function to check if the latest entry is idle
def update_idle_time():
    global total_idle_time

    # Get the latest log entry
    latest_log = collection.find_one(sort=[("timestamp", -1)])

    if latest_log:
        mouse_clicks = latest_log.get("mouse_clicks", 1)  # Default to 1 if not found
        keyboard_time = latest_log.get("keyboard_activity", 1)  # Updated field name

        # If both are zero, increment idle time
        if mouse_clicks == 0 and keyboard_time == 0:
            total_idle_time += 10  # Since logs are every 10s

        print(f"Updated Idle Time: {total_idle_time} seconds")

# Run the function
update_idle_time()
