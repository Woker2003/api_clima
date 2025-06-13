# ☀️ Estación Meteorológica Inteligente

Este proyecto es una **estación meteorológica casera** conectada a **sensores reales mediante Arduino**, combinada con una interfaz web desarrollada con **Node.js y Express** que permite:

* Visualizar datos **en tiempo real** desde el Arduino.
* Consultar datos climáticos **históricos desde una API externa**.
* Almacenar la información en archivos **CSV** y **JSON**.
* Controlar la lectura desde el navegador.

---

## 🚀 Tecnologías utilizadas

* **Node.js** + **Express**
* **Arduino UNO/Nano**
* **Sensores físicos reales**
* **Bootstrap 5** (interfaz web)
* **WeatherAPI** (API externa)
* **JavaScript / HTML / CSS**

---

## ⚙️ Instalación y configuración

### Requisitos previos:

* Tener [Node.js](https://nodejs.org/) instalado
* Tener Arduino IDE y drivers para tu placa
* Cuenta gratuita en [https://www.weatherapi.com](https://www.weatherapi.com) para obtener tu API Key

### Pasos:

1. Clona el repositorio:

```bash
git clone https://github.com/tuusuario/estacion-meteorologica.git
cd estacion-meteorologica
```

2. Instala las dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con lo siguiente:

```env
PORT=3000
API_KEY=tu_api_key_aqui
LAT=latitud_de_tu_ciudad
LON=longitud_de_tu_ciudad
SERIAL_PORT=COM4 # o /dev/ttyUSB0 en Linux
BAUD_RATE=9600
```

4. Inicia el servidor:

```bash
node src/app.js
```

5. Abre en tu navegador:

```
http://localhost:3000
```

---

## 📊 Sensores utilizados

* **BME280** – Temperatura, humedad y presión atmosférica.
* **KY-013** – Sensor de temperatura analógico acoplado a un **anemómetro 3D impreso** para estimar velocidad del viento.
* **Sensor de lluvia (2 pines + 1 intermedio)** – Detecta presencia de lluvia.

---

## 📈 Características principales

* Visualización en tiempo real de datos del Arduino.
* Consulta de historial meteorológico desde API externa.
* Lectura manual o automática desde interfaz web.
* Almacenamiento en:

    * `clima.json` (estructura completa)
    * `historial.csv` (datos planos por hora)
* Agrupación y promediado por hora
* Interfaz responsive compatible con móviles

---

## 🗂️ Estructura del proyecto

```
├── .env                     # Variables de entorno (API key, puerto, coordenadas, etc.)
├── README.md                # Documentación del proyecto
├── data/                    # Archivos de datos locales
│   ├── clima.json           # Datos meteorológicos externos
│   └── historial.csv        # Datos meteorológicos en CSV
├── public/                  # Interfaz web (HTML, JS, CSS)
│   └── index.html
├── src/                     # Código fuente de la aplicación
│   ├── app.js               # Entrada principal del servidor
│   ├── config.js            # Carga de variables de entorno
│   ├── logger.js            # Sistema de logging
│   ├── controllers/         # Controladores de rutas
│   │   ├── lecturasController.js
│   │   └── weatherController.js
│   └── services/            # Servicios y lógica
│       ├── archivoService.js
│       ├── serialService.js
│       └── weatherService.js
```

---

## 📸 Capturas de pantalla

> *Aquí puedes agregar imágenes de la interfaz funcionando, tu Arduino conectado, el anemómetro 3D, etc.*

---

## 🔐 Licencia

Este proyecto **no posee licencia oficial**. Se comparte con fines educativos y de demostración. No se permite la reproducción del mismo con fines comerciales sin autorización del autor.

---

*Proyecto desarrollado con pasión para futuras aplicaciones científicas, educativas y como parte de un portafolio personal.*
