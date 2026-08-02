import warnings
warnings.filterwarnings("ignore", category=UserWarning)

import tensorflow.lite as tfile
def preprocess_input(x):
	return x / 127.5 - 1.0
import cv2
from PIL import Image
import numpy as np
import time
import RPi.GPIO as GPIO
from personDetection import detectHuman
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

animals = ['raccoon', 'deer', 'squirrel']
class_model = tfile.Interpreter(model_path = "gardenPal_animal_model.tflite")
class_model.allocate_tensors()
input_det = class_model.get_input_details()
output_det = class_model.get_output_details()

def processImgML(img):
	human = detectHuman(img)
	if human == True:
		logger.info("Person Detected...")
		return "Person"
	if human == None:
		logger.info("Human detector returned None")
		return None
	logger.info("Human detection: no")
	img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
	img_pil = Image.fromarray(img_rgb)
	img_pil = img_pil.resize((224,224), Image.BICUBIC)
	img_data = np.array(img_pil, dtype="float32")
	img_data = preprocess_input(img_data)
	img_data = np.expand_dims(img_data, axis=0)
	# space
	class_model.set_tensor(input_det[0]['index'], img_data)
	class_model.invoke()
	out = class_model.get_tensor(output_det[0]['index'])[0]
	confidence = np.max(out)
	pred = np.argmax(out)
	#if animals[pred] == "cats":
		#pred = np.argsort(out)[-2]
		#return animals[pred]
	if confidence < 0.65:   # tune (0.6–0.8)
		logger.info("confidence low, no deterrents activated")
		return None
	return animals[pred]

relay_pins = {"IN1": 5, "IN2": 6, "IN3": 7}  # IN1=Buzzer, IN2=Floodlight, IN3=Water sprayer

def activateDeterrents(animal):
	GPIO.setmode(GPIO.BCM)
	for pin in relay_pins.values():
		GPIO.setup(pin, GPIO.OUT)
		GPIO.output(pin, GPIO.HIGH)

	try:
		if animal == 'raccoon':
			logger.info("Activating buzzer for raccoon")
			GPIO.output(relay_pins["IN1"], GPIO.LOW)
			time.sleep(3)
			GPIO.output(relay_pins["IN1"], GPIO.HIGH)
		elif animal == 'squirrel':
			logger.info("Activating floodlight for squirrel")
			GPIO.output(relay_pins["IN2"], GPIO.LOW)
			time.sleep(5)
			GPIO.output(relay_pins["IN2"], GPIO.HIGH)
		elif animal == 'deer':
			logger.info("Activating water sprayer for deer")
			GPIO.output(relay_pins["IN3"], GPIO.LOW)
			time.sleep(10)
			GPIO.output(relay_pins["IN3"], GPIO.HIGH)
	except Exception as e:
		logger.error(f"Deterrent activation error: {e}")
	finally:
		GPIO.cleanup()
'''
# testing images
img_dog = "img1_dog.jpg"
img_deer = "deer_test2.jpg"

#prediction = processImgML(img_dog)
prediction2 = processImgML(img_deer)

#print(prediction)
print(prediction2)
'''
