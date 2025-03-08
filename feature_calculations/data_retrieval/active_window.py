import time
import psutil
import pygetwindow as gw

def get_active_application():
    """Returns the currently active application window title."""
    active_window = gw.getActiveWindow()
    return active_window.title if active_window else None

while True:
    active_app = get_active_application()
    print("Active application:", active_app)
    time.sleep(5)  # Check every 5 seconds

