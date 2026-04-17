import tflite_runtime.interpreter as tflite
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import numpy as np
import time
import RPi.GPIO as GPIO 
from personDetection import detectHuman

animals = ['red_fox','raccoon','mountain_beaver','deer','coyote', 'cats', 'dogs', 'squirrel']
class_model = tflite.Interpreter(model_path = "gardenPal_animal_model.tflite")
class_model.allocate_tensors()
input_det = class_model.get_input_details()
output_det = class_model.get_output_details()

def processImgML(img):
    if detectHuman(img) == True or detectHuman(img) == None:
        return
    img = img.resize(224,224)
    img_data = np.array(img, dtype="float32")
    img_data = preprocess_input(img_data)
    img_data = np.expand_dims(img_data, axis=0)
    
    class_model.set_tensor(input_det[0]['index'], img_data)
    class_model.invoke()
    out = class_model.get_tensor(output_det[0]['index'])
    pred = np.argmax(out, axis=1)[0]
    return animals[pred]

def activateDeterrents(animal):
    GPIO.setmode(GPIO.BCM)

    relay_pins = {"IN1": 5,"IN2": 6, "IN3": 7} #pins for deterrents (IN3 is water sprayer, change pin if necessary)

    for pin in relay_pins.values():
        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, GPIO.HIGH)

    try:
        if animal == 'red_fox' or animal == 'dogs' or animal == 'coyote' or animal == 'raccoon':
            GPIO.output(relay_pins["IN1"], GPIO.LOW) #Buzzer
            time.sleep(3)
            GPIO.output(relay_pins["IN1"], GPIO.HIGH)
        if animal == 'deer' or animal == 'cat':
            GPIO.output(relay_pins["IN2"], GPIO.LOW) #Light
            time.sleep(3)
            GPIO.output(relay_pins["IN2"], GPIO.HIGH)
            time.sleep(5)
            GPIO.output(relay_pins["IN3"], GPIO.LOW) #Water
            time.sleep(10)
            GPIO.output(relay_pins["IN3"], GPIO.HIGH)
        if animal == 'mountain_beaver':
            GPIO.output(relay_pins["IN1"], GPIO.LOW) #Buzzer
            time.sleep(3)
            GPIO.output(relay_pins["IN1"], GPIO.HIGH)
            time.sleep(5)
            GPIO.output(relay_pins["IN3"], GPIO.LOW) #Water
            time.sleep(10)
            GPIO.output(relay_pins["IN3"], GPIO.HIGH)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        GPIO.cleanup()

# testing images
img_dog = Image.open("img1_dog.jpg")
img_deer = Image.open("img8_deer.jpg")

prediction = processImgML(img_dog)
prediction2 = processImgML(img_deer)

print(prediction)
print(prediction2)
