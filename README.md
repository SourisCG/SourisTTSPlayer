# ![Microfono](https://img.icons8.com/fluency/32/microphone.png) SourisTTSPlayer

Un bot de Discord de alto rendimiento enfocado en la síntesis de voz (TTS) utilizando voces neuronales de alta calidad. 
Es posible que las voces neuronales estén limitadas dependiendo de tu tipo de cuenta de ElevenLabs.

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Licencia MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

## ![Estrellas](https://img.icons8.com/fluency/32/star.png) Características Principales

* **Síntesis de Voz Neuronal:** Utiliza modelos avanzados para una pronunciación natural y fluida.
* **Integración Nativa:** Se conecta directamente a los canales de voz de Discord.
* **Procesamiento en RAM:** Manejo de buffers de audio directamente en memoria para evitar latencia y errores de lectura de archivos.
* **Volumen Independiente:** El nivel de audio de la música se puede ajustar por separado sin afectar el volumen de las voces generadas por el bot.

## ![Herramientas](https://img.icons8.com/fluency/32/hammer.png) Tecnologías Utilizadas

* **Lenguaje:** JavaScript (Node.js)
* **Librería Principal:** Discord.js v14
* **Audio:** @discordjs/voice y FFmpeg
* **Peticiones:** Axios

## ![Lista](https://img.icons8.com/fluency/32/clipboard.png) Requisitos Previos

Si no sabes de programación y es tu primera vez usando un bot local, asegúrate de instalar esto en tu PC primero:
* ![Node](https://img.icons8.com/color/24/nodejs.png) **[Node.js](https://nodejs.org/es/):** (Descarga la versión LTS). Es el motor que hace que el código funcione en tu computadora.
* ![Git](https://img.icons8.com/color/24/git.png) **[Git](https://git-scm.com/downloads) (Opcional):** Herramienta para descargar el código mediante comandos. No es necesario si prefieres descargar el archivo ZIP directamente.

## ![Descarga](https://img.icons8.com/fluency/32/download.png) Descarga

Puedes obtener el código de dos maneras, elige la que se te haga más fácil:

**Opción 1: Descarga directa (Recomendado para principiantes)**

[![Descargar ZIP directo](https://img.shields.io/badge/Descargar_Código-ZIP_Directo-2ea44f?style=for-the-badge)](https://github.com/SourisCG/SourisTTSPlayer/archive/refs/heads/main.zip)

**Opción 2: Usando Git (Para desarrolladores)**

```bash
git clone [https://github.com/SourisCG/SourisTTSPlayer.git](https://github.com/SourisCG/SourisTTSPlayer.git)
cd SourisTTSPlayer
```

---

## ![Llave](https://img.icons8.com/fluency/32/key.png) Guía paso a paso: ¿Cómo conseguir los tokens?

Para que el bot funcione, necesita unas "llaves de acceso" (tokens) para comunicarse con Discord, Spotify y ElevenLabs. Sigue estos pasos para obtenerlos:

### ![Discord](https://img.icons8.com/color/32/discord-logo.png) 1. Discord Token (Para conectar el bot)
1. Entra al [Discord Developer Portal](https://discord.com/developers/applications).
2. Arriba a la derecha, haz clic en el botón azul **"New Application"**, ponle un nombre y acepta.
3. En el menú de la izquierda, entra a la sección **"Bot"**.
4. Busca el botón **"Reset Token"**, dale clic y **copia el código largo** que aparece. *(Este es tu `DISCORD_TOKEN`)*.
5. ![Alerta](https://img.icons8.com/fluency/20/warning-shield.png) **MUY IMPORTANTE:** En esa misma página, baja hasta la sección "Privileged Gateway Intents" y **enciende el interruptor** de **"Message Content Intent"**. Si no haces esto, el bot no podrá leer tus comandos. Guarda los cambios.

### ![Voz](https://img.icons8.com/fluency/32/microphone.png) 2. ElevenLabs API Key (Para las voces neuronales)
1. Entra a [ElevenLabs](https://elevenlabs.io/) e inicia sesión.
2. Haz clic en tu **ícono de perfil** (abajo a la izquierda).
3. Selecciona **"Profile + API key"**.
4. Haz clic en el ícono del ojo para revelar tu llave secreta y cópiala. *(Este es tu `ELEVENLABS_API_KEY`)*.

### ![Spotify](https://img.icons8.com/color/32/spotify--v1.png) 3. Spotify Client ID & Secret (Para reproducir música)
1. Ve al [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e inicia sesión con tu cuenta de Spotify.
2. Haz clic en el botón verde **"Create app"**. Llena los datos básicos (nombre, descripción) y guarda.
3. Dentro de tu nueva aplicación, haz clic en el botón **"Settings"** (Configuración).
4. Ahí verás un código llamado **Client ID**. Cópialo. *(Este es tu `SPOTIFY_CLIENT_ID`)*.
5. Justo debajo, haz clic en **"View client secret"** para revelar el segundo código y cópialo. *(Este es tu `SPOTIFY_CLIENT_SECRET`)*.

---

## ![Cohete](https://img.icons8.com/fluency/32/rocket.png) Instalación y Uso

1. **Prepara los archivos** (Elige según cómo descargaste el código):
   * ![Carpeta](https://img.icons8.com/fluency/20/folder-invoices.png) **Si descargaste el ZIP:** Descomprime el archivo `.zip` en tu PC. Entra a la carpeta extraída, da clic derecho en un espacio en blanco y elige **"Abrir en la terminal"** (o abre tu CMD y usa el comando `cd` para llegar a esa ruta).
   * ![Terminal](https://img.icons8.com/fluency/20/console.png) **Si usas Git:** Abre tu terminal y ejecuta estos comandos:
     ```bash
     git clone [https://github.com/SourisCG/SourisTTSPlayer.git](https://github.com/SourisCG/SourisTTSPlayer.git)
     cd SourisTTSPlayer
     ```

2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```

3. Crea un archivo nuevo llamado **exactamente** `.env` en la misma carpeta donde está el código. Abre ese archivo en un bloc de notas y pega tus tokens así:
   ```env
   DISCORD_TOKEN=PegaTuTokenDeDiscordAqui
   ELEVENLABS_API_KEY=PegaTuKeyDeElevenLabsAqui
   SPOTIFY_CLIENT_ID=PegaTuIdDeSpotifyAqui
   SPOTIFY_CLIENT_SECRET=PegaTuSecretDeSpotifyAqui
   ```

4. Inicia el bot:
   ```bash
   node index.js
   ```

## ![Control](https://img.icons8.com/fluency/32/controller.png) Comandos Disponibles

* `!entrar` - El bot se une al canal de voz donde te encuentras.
* `!g [texto]` - Esta es la voz predeterminada, funcionará independientemente de las APIs.
* `!jarvis [texto]` - El bot reproduce el texto introducido con la voz configurada.
* `!p [link]` - Reproduce la canción del enlace (YouTube o Spotify).
* `!h` - Muestra el menú de ayuda en Discord.

## ![Documento](https://img.icons8.com/fluency/32/document.png) Licencia

Este proyecto está bajo la Licencia MIT. Eres libre de usar, modificar y distribuir el código.