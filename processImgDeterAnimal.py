import warnings
warnings.filterwarnings("ignore", category=UserWarning)

import tflite_runtime.interpreter as tflite
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import cv2
from PIL import Image
import numpy as np
import time
from personDetection import detectHuman
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

animals = ['red_fox','raccoon','mountain_beaver','deer','coyote', 'cats', 'dogs', 'squirrel', 'rabbit']
class_model = tflite.Interpreter(model_path = "gardenPal_animal_model.tflite")
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
	if animals[pred] == "cats":
		pred = np.argsort(out)[-2]
		return animals[pred]
	if confidence < 0.65:   # tune (0.6–0.8)
		logger.info("confidence low, no deterrents activated")
		return None
	return animals[pred]

'''
# testing images
img_dog = "img1_dog.jpg"
img_deer = "deer_test2.jpg"

#prediction = processImgML(img_dog)
prediction2 = processImgML(img_deer)

#print(prediction)
print(prediction2)
'''
