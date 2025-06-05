import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import joblib

# Ruta al CSV con historial
csv_path = os.path.join(os.path.dirname(__file__), '../src/data/historial.csv')

# Leer el CSV
try:
    df = pd.read_csv(csv_path)
except FileNotFoundError:
    print("❌ Error: El archivo historial.csv no existe.")
    exit(1)

# Usar solo las columnas necesarias
df = df[["temperatura", "humedad", "presion", "viento", "lluvia", "nubes"]]

# Escalar los datos entre 0 y 1
scaler = MinMaxScaler()
datos_scaled = scaler.fit_transform(pd.DataFrame(df, columns=['temperatura', 'humedad']))

# Guardar el scaler
joblib.dump(scaler, os.path.join(os.path.dirname(__file__), 'escaler_lstm.pkl'))

# Crear secuencias de 7 días (X) para predecir 1 día (y)
X = []
y = []

for i in range(7, len(datos_scaled)):
    X.append(datos_scaled[i-7:i])  # secuencia de 7 días
    y.append(datos_scaled[i][0])   # solo temperatura como salida

X = np.array(X)
y = np.array(y)

# Construir el modelo LSTM
modelo = Sequential()
modelo.add(LSTM(units=64, activation='tanh', input_shape=(X.shape[1], X.shape[2])))
modelo.add(Dense(1))  # salida: temperatura

modelo.compile(optimizer='adam', loss='mean_squared_error')

# Entrenar el modelo
modelo.fit(X, y, epochs=50, batch_size=8)

# Guardar modelo
modelo.save(os.path.join(os.path.dirname(__file__), 'modelo_lstm.h5'))
print("✅ Modelo LSTM guardado correctamente.")
