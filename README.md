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

## 🚀 Instalación y Uso

1. Clona este repositorio en tu máquina local.
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```

3. Obtén tus credenciales desde los portales oficiales:
   * **DISCORD_TOKEN:** Créalo en el [Discord Developer Portal](https://discord.com/developers/applications).
   * **ELEVENLABS_API_KEY:** Obtenlo en tu perfil de [ElevenLabs](https://elevenlabs.io/app/api-keys).
   * **SPOTIFY_CLIENT_ID y SECRET:** Genéralos en el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

4. Crea un archivo `.env` en la raíz del proyecto y añade tus tokens:
   ```env
   DISCORD_TOKEN=tu_token_aqui
   ELEVENLABS_API_KEY=tu_token_aqui
   SPOTIFY_CLIENT_ID=tu_token_aqui
   SPOTIFY_CLIENT_SECRET=tu_token_aqui
   ```

5. Inicia el bot:
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