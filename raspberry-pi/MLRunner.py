# ml_runner.py
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

import sys
import cv2
import numpy as np
import datetime
import os
import json
from processImgDeterAnimal import processImgML, activateDeterrents
from processImgDeterAnimal import processImgML
from json_lock import write_to_file, read_from_file
import logging

logger = logging.getLogger("MLRunner.py")
logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s", stream=sys.stderr)

logger.info("MLRunner started")

while True:
    logger.info("MLRunner: waiting for length")
    length_bytes = sys.stdin.buffer.read(4)
    if not length_bytes or len(length_bytes) < 4:
        break

    size = int.from_bytes(length_bytes, "big")
    data_bytes = sys.stdin.buffer.read(size)
    logger.info(f"MLRunner: got image bytes size={size}")

    if not data_bytes or len(data_bytes) < size:
        print("", flush=True)
        continue

    np_arr = np.frombuffer(data_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        print("", flush=True)
        continue

    try:
        animal = processImgML(img)
        logger.info("MLRunner: decoded image successfully")
        
        # Load JSON 
        data = read_from_file()
        logger.info(f"makes json file {data}")
        
        # Ensure structure exists
        if "predator" not in data:
            data["predator"] = {
				"predatorTrue": False,
				"type": None,
				"timestamp": "2026-04-17 14:45:00",
				"plantKey": "plant2"
			}

        predatorTrue = True
        if animal == "Person" or animal is None:
            predatorTrue = False
        
        logger.info("predatorTrue updated")

        if predatorTrue:                          # <-- add this block
            try:
                activateDeterrents(animal)
                logger.info(f"Deterrent activated for {animal}")
            except Exception as e:
                logger.error(f"Deterrent activation failed: {e}")


        # Update predator information
        data["predator"] = {
            "predatorTrue": predatorTrue,
            "type": animal,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "plantKey": "plant2"
        }

        # Save back to JSON
        write_to_file(data)

        print(animal if animal else "", flush=True)

    except Exception as e:
        logger.error(f"ML worker error: {e}")
        print("", flush=True)
