import time
import argparse
import os
import csv
from datetime import datetime

from picamera2 import Picamera2
import board
import busio
import adafruit_bh1750

CAPTURE_DIR = "lighting_test_captures"
LOG_FILE = os.path.join(CAPTURE_DIR, "capture_log.csv")
os.makedirs(CAPTURE_DIR, exist_ok=True)

i2c = busio.I2C(board.SCL, board.SDA)
lux_sensor = adafruit_bh1750.BH1750(i2c)

picam2 = Picamera2()
picam2.configure(picam2.create_still_configuration())
picam2.start()
time.sleep(2)  # let exposure/white balance settle

def capture(species, light_level):
    existing = [f for f in os.listdir(CAPTURE_DIR) if f.startswith(f"{species}_{light_level}_")]
    n = len(existing) + 1
    filename = f"{species}_{light_level}_{n}.jpg"
    filepath = os.path.join(CAPTURE_DIR, filename)

    lux = lux_sensor.lux
    picam2.capture_file(filepath)

    log_exists = os.path.exists(LOG_FILE)
    with open(LOG_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        if not log_exists:
            writer.writerow(["filename", "species", "light_level", "lux", "timestamp"])
        writer.writerow([filename, species, light_level, lux, datetime.now().strftime("%Y-%m-%d %H:%M:%S")])

    print(f"Saved {filename} | lux={lux:.2f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("species", choices=["raccoon", "deer", "squirrel", "control"])
    parser.add_argument("light_level", choices=["bright", "dim", "dark"])
    args = parser.parse_args()
    capture(args.species, args.light_level)