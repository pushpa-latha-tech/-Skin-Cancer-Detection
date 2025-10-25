'''from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
import os
import numpy as np
import tensorflow as tf
from PIL import Image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/images/'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load the model
model = tf.keras.models.load_model('melanoma_classification_model.h5')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def predict_skin_cancer(image_path):
    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(150, 150))
    img_array = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)

    # If model has 1 output neuron (sigmoid)
    if prediction.shape[1] == 1:
        prob = prediction[0][0]
        predicted_class = 'Malignant' if prob > 0.5 else 'Benign'
        confidence = prob if predicted_class == 'Malignant' else 1 - prob

    # If model has 2 outputs (softmax)
    else:
        class_idx = np.argmax(prediction[0])   # 0 or 1
        classes = ['Benign', 'Malignant']
        predicted_class = classes[class_idx]
        confidence = prediction[0][class_idx]

    return predicted_class, confidence * 100


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        prediction, confidence = predict_skin_cancer(filepath)
        return render_template('result.html', prediction=prediction, confidence=confidence, image_url=filename)
    return redirect(request.url)

if __name__ == "__main__":
    app.run(debug=True)
'''
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import numpy as np
import tensorflow as tf
from PIL import Image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/images/'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load your trained CNN model
model = tf.keras.models.load_model('melanoma_classification_model.h5')


# --- Helper functions ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def predict_skin_cancer(image_path):
    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(150, 150))
    img_array = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)

    # Single neuron output (sigmoid)
    if prediction.shape[1] == 1:
        prob = prediction[0][0]
        predicted_class = 'Malignant' if prob > 0.5 else 'Benign'
        confidence = prob if predicted_class == 'Malignant' else 1 - prob
    # Two neuron output (softmax)
    else:
        class_idx = np.argmax(prediction[0])
        classes = ['Benign', 'Malignant']
        predicted_class = classes[class_idx]
        confidence = prediction[0][class_idx]

    return predicted_class, confidence * 100


# --- Flask Routes ---
@app.route('/')
def index():
    """Render main SkinGuard AI home page"""
    return render_template('index.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/precautions')
def precautions():
    return render_template('precautions.html')


@app.route('/emergency')
def emergency():
    return render_template('emergency.html')


@app.route('/tips')
def tips():
    return render_template('tips.html')


@app.route('/predict', methods=['POST'])
def predict():
    """Handle image upload from new JS frontend and return JSON response"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        prediction, confidence = predict_skin_cancer(filepath)
        return jsonify({
            'prediction': prediction,
            'confidence': float(confidence)
        })

    return jsonify({'error': 'Invalid file type'}), 400


if __name__ == "__main__":
    app.run(debug=True)
