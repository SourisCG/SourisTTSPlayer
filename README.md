# 🎙️ SourisTTSPlayer

Un bot de Discord de alto rendimiento enfocado en la síntesis de voz (TTS) utilizando voces neuronales de alta calidad. 
Es posible que las voces neuronales estén limitadas dependiendo de tu tipo de cuenta de ElevenLabs.

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Licencia MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

## ✨ Características Principales

* **Síntesis de Voz Neuronal:** Utiliza modelos avanzados para una pronunciación natural y fluida.
* **Integración Nativa:** Se conecta directamente a los canales de voz de Discord.
* **Procesamiento en RAM:** Manejo de buffers de audio directamente en memoria para evitar latencia y errores de lectura de archivos.

## 🛠️ Tecnologías Utilizadas

* **Lenguaje:** JavaScript (Node.js)
* **Librería Principal:** Discord.js v14
* **Audio:** @discordjs/voice y FFmpeg
* **Peticiones:** Axios

## 📋 Requisitos Previos

Si no sabes de programación y es tu primera vez usando un bot local, asegúrate de instalar esto en tu PC primero:
* Descarga e instala [Node.js](https://nodejs.org/es/) (se recomienda la versión LTS). Esto permite que el código del bot funcione en tu computadora.
* Descarga e instala [Git](https://git-scm.com/downloads) para poder descargar los archivos del proyecto fácilmente.

## 🔑 ¿Cómo conseguir los tokens?

Antes de iniciar el bot, necesitas obtener unas "llaves" de acceso para que el bot pueda comunicarse con las distintas plataformas:

* **DISCORD_TOKEN:** 1. Ve al [Discord Developer Portal](https://discord.com/developers/applications).
  2. Haz clic en "New Application" y ponle un nombre a tu bot.
  3. Ve a la pestaña **Bot** en el menú de la izquierda.
  4. Haz clic en "Reset Token", cópialo y guárdalo en un lugar seguro. 
  5. *Importante:* Más abajo en esa misma página, enciende el switch que dice **Message Content Intent** para que el bot pueda leer los comandos que escribes en el chat.
* **ELEVENLABS_API_KEY:** 1. Entra a [ElevenLabs](https://elevenlabs.io/) e inicia sesión.
  2. Haz clic en tu icono de perfil (abajo a la izquierda) y selecciona **Profile + API key**.
  3. Copia la clave secreta que aparece ahí.
* **SPOTIFY_CLIENT_ID y SECRET:** 1. Ve al [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e inicia sesión con tu cuenta.
  2. Haz clic en "Create app", llena los datos básicos y guárdala.
  3. Dentro de tu nueva app, haz clic en "Settings" y ahí verás tu **Client ID** y la opción para revelar el **Client Secret**.

## 🚀 Instalación y Uso

1. Abre tu terminal o símbolo del sistema (cmd) y descarga el proyecto:
   ```bash
   git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
   cd TU_REPOSITORIO
   ```
   *(Asegúrate de cambiar TU_USUARIO y TU_REPOSITORIO por tu enlace real)*

2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```

3. Crea un archivo nuevo llamado exactamente `.env` en la misma carpeta donde está el código y pega tus tokens así:
   ```env
   DISCORD_TOKEN=TuTokenAqui
   ELEVENLABS_API_KEY=TuTokenAqui
   SPOTIFY_CLIENT_ID=TuTokenAqui
   SPOTIFY_CLIENT_SECRET=TuTokenAqui
   ```

4. Inicia el bot:
   ```bash
   node index.js
   ```

## 🎮 Comandos Disponibles

* `!entrar` - El bot se une al canal de voz donde te encuentras.
* `!g [texto]` - Esta es la voz predeterminada, funcionará independientemente de las APIs.
* `!jarvis [texto]` - El bot reproduce el texto introducido con la voz configurada.
* `!h` - Menú de ayuda.
* `!p [link]` - Reproduce la canción del enlace (YouTube o Spotify).

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Eres libre de usar, modificar y distribuir el código.