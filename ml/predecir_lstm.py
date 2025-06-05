import json
import sys
import numpy as np
import os
import joblib
from tensorflow.keras.models import load_model

# ✅ Cargar el modelo sin compilar (evita warnings innecesarios)
modelo = load_model(os.path.join(os.path.dirname(__file__), "modelo_lstm.h5"), compile=False)
scaler = joblib.load(os.path.join(os.path.dirname(__file__), "escaler_lstm.pkl"))

# ✅ Leer los datos desde stdin que manda Node.js
input_data = sys.stdin.read()
ultimos_7_dias = json.loads(input_data)  # Lista de 7 objetos climáticos

# ✅ Convertir a numpy y escalar
X = np.array([
    [dia["temperatura"], dia["humedad"], dia["presion"], dia["viento"], dia["lluvia"], dia["nubes"]]
    for dia in ultimos_7_dias
])
X_scaled = scaler.transform(X)
X_scaled = np.expand_dims(X_scaled, axis=0)  # -> (1, 7, 6)

# ✅ Hacer predicción
pred_scaled = modelo.predict(X_scaled)[0][0]  # predicción escala normalizada

# ✅ Invertir escala solo para temperatura
inverso = scaler.inverse_transform([[pred_scaled, 0, 0, 0, 0, 0]])  # resto ceros
temp_pred = inverso[0][0]

# ✅ Imprimir JSON para Node.js (solo uno!)
print(json.dumps({
    "temperatura_predicha": round(temp_pred, 2)
}))
