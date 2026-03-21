import spidev
import json
import datetime
import adafruit_dht
import board
import busio
import adafruit_bh1750

i2c = busio.I2C(board.SCL, board.SDA)
sensor = adafruit_bh1750.BH1750(i2c)

spi = spidev.SpiDev()
spi.open(0,0) #bus 0, device 0
spi.max_speed_hz = 1350000

dht_device = adafruit_dht.DHT22(board.D4, use_pulseio=False)

# Function to read MCP3008 (ADC) channel
def read_channel(channel):
    adc = spi.xfer2([1, (8+channel) << 4, 0])
    data = ((adc[1] & 3) << 8) + adc[2]
    return data

try:
    moisture_value = read_channel(0) #channel 0 on ADC is connected to moisture sensor
    moisture_percent = (1023 - moisture_value) / 1023 * 100

    lux_value = sensor.lux

    t = (dht_device.temperature * 1.8) + 32
    h = dht_device.humidity

    # JSON file creation
    data = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "soil_moisture": moisture_value,
        "soil_percentage": moisture_percent,
        "light_lux": lux_value,
        "temperature_F": t,
        "humidity_%": h,
    }

    with open("testing_data.json", 'w') as json_file:
        json.dump(data, json_file, indent=4)

except RuntimeError as e:
    print(f"Error: {e}")

finally:
    spi.close()