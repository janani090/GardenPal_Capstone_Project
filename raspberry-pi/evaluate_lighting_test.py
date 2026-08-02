import os
import cv2
import numpy as np
from collections import defaultdict
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

from processImgDeterAnimal import class_model, input_det, output_det, animals, detectHuman
def preprocess_input(x):
	return x / 127.5 - 1.0
from PIL import Image

CAPTURE_DIR = "lighting_test_captures"   # folder with your bright/dim/dark photos
LIGHT_LEVELS = ["bright", "dim", "dark"]
LABEL_MAP = {"raccoon": 0, "deer": 1, "squirrel": 2}
DETERRENT_MAP = {"raccoon": "buzzer", "deer": "water_sprayer", "squirrel": "floodlight"}
CONFIDENCE_THRESHOLD = 0.65

def classify_with_confidence(img):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_pil = Image.fromarray(img_rgb).resize((224, 224), Image.BICUBIC)
    img_data = preprocess_input(np.array(img_pil, dtype="float32"))
    img_data = np.expand_dims(img_data, axis=0)
    class_model.set_tensor(input_det[0]['index'], img_data)
    class_model.invoke()
    out = class_model.get_tensor(output_det[0]['index'])[0]
    return animals[np.argmax(out)], float(np.max(out))

rows = []
control_rows = []

for fname in sorted(os.listdir(CAPTURE_DIR)):
    if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue
    parts = fname.split('_')
    true_species, light_level = parts[0], parts[1]

    if light_level not in LIGHT_LEVELS:
        print(f"skipping unrecognized filename: {fname}")
        continue

    img = cv2.imread(os.path.join(CAPTURE_DIR, fname))
    pred_species, confidence = classify_with_confidence(img)
    fires = confidence >= CONFIDENCE_THRESHOLD

    # control (empty background) shots get scored separately, not folded into accuracy
    if true_species == "control":
        control_rows.append({
            "file": fname, "light": light_level,
            "pred": pred_species, "confidence": confidence,
            "false_positive": fires
        })
        continue

    if true_species not in LABEL_MAP:
        print(f"skipping unrecognized filename: {fname}")
        continue

    predicted_deterrent = DETERRENT_MAP[pred_species] if fires else None
    correct_deterrent = DETERRENT_MAP[true_species]

    if not fires:
        outcome = "missed"
    elif pred_species == true_species:
        outcome = "correct"
    else:
        outcome = "incorrect"

    rows.append({
        "file": fname, "true": true_species, "light": light_level,
        "pred": pred_species, "confidence": confidence, "outcome": outcome
    })

# --- Accuracy by animal ---
print("\n--- Accuracy by animal ---")
for species in LABEL_MAP:
    subset = [r for r in rows if r["true"] == species]
    acc = sum(r["pred"] == r["true"] for r in subset) / len(subset) if subset else float("nan")
    print(f"{species}: {acc:.2%} ({len(subset)} photos)")

# --- Accuracy by light level ---
print("\n--- Accuracy by light level ---")
for level in LIGHT_LEVELS:
    subset = [r for r in rows if r["light"] == level]
    acc = sum(r["pred"] == r["true"] for r in subset) / len(subset) if subset else float("nan")
    avg_conf = np.mean([r["confidence"] for r in subset]) if subset else float("nan")
    print(f"{level}: accuracy={acc:.2%}, avg confidence={avg_conf:.3f} ({len(subset)} photos)")

# --- Confusion matrix ---
y_true = [LABEL_MAP[r["true"]] for r in rows]
y_pred = [LABEL_MAP[r["pred"]] for r in rows]
cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2])
disp = ConfusionMatrixDisplay(cm, display_labels=list(LABEL_MAP.keys()))
disp.plot(cmap="Blues")
plt.title("Lighting Test Confusion Matrix")
plt.savefig("lighting_test_confusion_matrix.png", dpi=150, bbox_inches="tight")
plt.show()

# --- Deterrent correctness ---
print("\n--- Deterrent activation outcomes ---")
outcome_counts = defaultdict(int)
for r in rows:
    outcome_counts[r["outcome"]] += 1
for outcome, count in outcome_counts.items():
    print(f"{outcome}: {count}")

# --- Control (empty background) results ---
print("\n--- Control (empty background) results ---")
for r in control_rows:
    status = "FALSE POSITIVE" if r["false_positive"] else "correctly suppressed"
    print(f"{r['file']} ({r['light']}): predicted={r['pred']}, confidence={r['confidence']:.3f} -> {status}")
