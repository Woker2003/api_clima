# predicir.py (actualizado)
import sys
import json
import joblib
import pandas as pd
import os

# Ruta al modelo
modelo_path = os.path.join(os.path.dirname(__file__), "modelo_temperatura.pkl")

# Cargar modelo entrenado
modelo = joblib.load(modelo_path)

# Leer datos de entrada desde stdin (desde Node.js)
input_data = sys.stdin.read()
valores = json.loads(input_data)

# Convertir a DataFrame
df = pd.DataFrame([valores])

# Predecir temperatura y lluvia
prediccion = modelo.predict(df)[0]  # Resultado: [temperatura, lluvia]

# Imprimir resultado como JSON
print(json.dumps({
    "temperatura_predicha": round(prediccion[0], 2),
    "lluvia_predicha": round(prediccion[1], 2)
}))
