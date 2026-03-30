import spidev
import json
import datetime
import adafruit_dht
import board
import busio
import adafruit_bh1750
import os
import time

# light sensor
i2c = busio.I2C(board.SCL, board.SDA)
sensor = adafruit_bh1750.BH1750(i2c)

# mcp connecting soil sensor
spi = spidev.SpiDev()
spi.open(0,0) # bus 0, device 0
spi.max_speed_hz = 1350000

# DHT/temp sensor
dht_device1 = adafruit_dht.DHT22(board.D4, use_pulseio=False)
dht_device2 = adafruit_dht.DHT22(board.D17, use_pulseio=False)

# Function to read MCP3008 (ADC) channel
def read_channel(channel):
    adc = spi.xfer2([1, (8+channel) << 4, 0])
    data = ((adc[1] & 3) << 8) + adc[2]
    return data

json_file_name = "testing_data.json"
try:
    # Read sensor 1
    moisture_value_1 = read_channel(0) #channel 0 on ADC is connected to moisture sensor
    moisture_percent_1 = (1023 - moisture_value_1) / 1023 * 100

    moisture_value_2 = read_channel(1) #channel 1 on ADC is connected to moisture sensor
    moisture_percent_2 = (1023 - moisture_value_2) / 1023 * 100

    lux_value = sensor.lux

    # DHT #1
    temp1 = (dht_device1.temperature * 1.8) + 32
    hum1 = dht_device1.humidity

    time.sleep(2)

    # DHT #2
    temp2 = (dht_device2.temperature * 1.8) + 32
    hum2 = dht_device2.humidity

    # Load existing JSON if it exists
    if os.path.exists(json_file_name):
        with open(json_file_name, "r") as file:
            data = json.load(file)
    else:
        # If file doesn't exist, create base structure
        data = {
            "plants": {
                "plant1": {},
                "plant2": {},
                "plant3": {
                    "timestamp": "Manual default",
                    "soil_percentage": 60,
                    "light_lux": 300,
                    "temperature_F": 0,
                    "humidity_%": 0
                }
            }
        }

    # Ensure structure exists
    if "plants" not in data:
        data["plants"] = {}

    # Update plant1 (soil sensor 1)
    data["plants"]["plant1"] = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "soil_percentage": moisture_percent_1,
        "light_lux": lux_value,
        "temperature_F": temp1,
        "humidity_%": hum1
    }

    # Update plant2 (soil sensor 2)
    data["plants"]["plant2"] = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "soil_percentage": moisture_percent_2,
        "light_lux": lux_value,
        "temperature_F": temp2,
        "humidity_%": hum2
    }

    # Save to JSON
    with open(json_file_name, "w") as file:
        json.dump(data, file, indent=4)

    print("Updated plant1 and plant2 successfully!")

except RuntimeError as e:
    print(f"Error: {e}")

finally:
    spi.close()

# initial code for 1 sensor (reference)

# try:
#     moisture_value = read_channel(0) #channel 0 on ADC is connected to moisture sensor
#     moisture_percent = (1023 - moisture_value) / 1023 * 100

#     lux_value = sensor.lux

#     t = (dht_device.temperature * 1.8) + 32
#     h = dht_device.humidity

#     # JSON file creation
#     data = {
#         "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
#         "soil_moisture": moisture_value,
#         "soil_percentage": moisture_percent,
#         "light_lux": lux_value,
#         "temperature_F": t,
#         "humidity_%": h,
#     }

#     with open("testing_data.json", 'w') as json_file:
#         json.dump(data, json_file, indent=4)

# except RuntimeError as e:
#     print(f"Error: {e}")

# finally:
#     spi.close()