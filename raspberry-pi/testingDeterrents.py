import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

relay_pins = {"IN1": 5, "IN2": 6}

for pin in relay_pins.values():
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.HIGH)

try: 
    while True:
        GPIO.output(relay_pins["IN1"], GPIO.LOW)
        print("Relay 1 ON")
        time.sleep(2)

        GPIO.outpit(relay_pins["IN1"], GPIO.HIGH)
        print("Relay 1 OFF")
        time.sleep(2)

        GPIO.outpit(relay_pins["IN2"], GPIO.LOW)
        print("Relay 2 ON")
        time.sleep(2)

        GPIO.outpit(relay_pins["IN2"], GPIO.HIGH)
        print("Relay 2 OFF")
        time.sleep(2)

except KeyboardInterrupt:
    pass

finally:
    GPIO.cleanup()