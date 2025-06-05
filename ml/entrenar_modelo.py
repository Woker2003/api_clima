import pandas as pd
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

# Ruta del archivo CSV con tus datos
csv_path = os.path.join(os.path.dirname(__file__), '../src/data/historial.csv')
try:
    df = pd.read_csv(csv_path)
except FileNotFoundError:
    print("❌ Error: El archivo historial.csv no existe.")
    exit(1)

# Verificar que hay suficientes datos
if df.empty or len(df) < 10:
    print("❌ Error: No hay suficientes datos para entrenar el modelo.")
    exit(1)

# Asegurarse de que los datos están limpios y bien formateados
columnas_esperadas = ["temperatura","humedad","presion","viento","lluvia","nubes"]
for columna in columnas_esperadas:
    if columna not in df.columns:
        print(f"❌ Faltan columnas necesarias: {columna}")
        exit(1)

# Variables de entrada (X) y salida (y)
X = df[["temperatura","humedad","presion","viento","lluvia","nubes"]]  # puedes añadir más
y = df[['temperatura',"lluvia"]]  # valor a predecir

# Separar los datos en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Crear y entrenar el modelo
modelo_base = RandomForestRegressor(n_estimators=100, random_state=42)
modelo = MultiOutputRegressor(modelo_base)
modelo.fit(X_train, y_train)

# Evaluación del modelo
y_pred = modelo.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print("Predicción de prueba:", modelo.predict(X_test.iloc[[0]])[0])

# Guardar el modelo
modelo_path = os.path.join(os.path.dirname(__file__), 'modelo_temperatura.pkl')
joblib.dump(modelo, modelo_path)
print("Modelo guardado como modelo_temperatura.pkl")
