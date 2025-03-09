from pymongo import MongoClient

client = MongoClient("mongodb+srv://Nikhil:chandu@cluster0.gape4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["biztech_db"]
daily_metrics_collection = db["daily_metrics_collection"]

# logs = list(daily_metrics_collection.find({}))
# print(f"Total Logs Found: {len(logs)}")
# print(logs[:2])  # Print first two logs to verify structure

print(db.list_collection_names())

