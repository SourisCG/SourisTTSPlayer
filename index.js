require('dotenv').config();
require('ffmpeg-static');

const { 
    Client, 
    Events, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    NoSubscriberBehavior, 
    StreamType,
    AudioPlayerStatus
} = require('@discordjs/voice');

const { ElevenLabsClient } = require('elevenlabs');
const play = require('play-dl');
const youtubedl = require('youtube-dl-exec'); 
const path = require('path');
const fs = require('fs');
const os = require('os'); 
const http = require('http'); 
const { spawn } = require('child_process');

const spotify = require('spotify-url-info')(fetch);

// =====================================================================
//   PUERTO WEB DUMMY
// =====================================================================
if (process.env.PORT) {
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot de música activo y operando 24/7\n');
    }).listen(process.env.PORT, () => console.log(`Servidor HTTP Dummy escuchando en puerto ${process.env.PORT}`));
}

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates 
    ] 
});

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// =====================================================================
//  SISTEMA MULTI-SERVIDOR CON COLA UNIFICADA
// =====================================================================
const servidores = new Map();

function obtenerServidor(guildId) {
    if (!servidores.has(guildId)) {
        const reproductorMusica = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
        const reproductorVoz = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

        const estadoServidor = {
            conexionActual: null,
            canalMensajes: null,
            colaMusica: [],      
            indiceActual: 0,     
            saltoManual: null,   
            reproduciendoMusica: false,
            volumenActual: 0.05,
            repetirActual: 'off', 
            mensajeReproductor: null,
            procesoAudio: null,
            reproductorMusica: reproductorMusica,
            reproductorVoz: reproductorVoz,
            rutaAudioTemp: null,
            vistaActual: 'reproductor', 
            paginaCola: 0,
            temporizadorAFK: null,
            // FIX: Variables Anti-Spam y Mutex
            bloqueoInteraccion: 0, 
            enTransicion: false 
        };

        reproductorMusica.on(AudioPlayerStatus.Idle, () => {
            if (reproductorMusica.state.status !== 'paused') {
                if (estadoServidor.reproduciendoMusica) {
                    if (estadoServidor.saltoManual !== null) {
                        estadoServidor.indiceActual = estadoServidor.saltoManual;
                        estadoServidor.saltoManual = null;
                    } else if (estadoServidor.repetirActual === 'queue') {
                        estadoServidor.indiceActual++; 
                        if (estadoServidor.indiceActual >= estadoServidor.colaMusica.length) {
                            estadoServidor.indiceActual = 0; 
                        }
                    } else if (estadoServidor.repetirActual === 'off') {
                        estadoServidor.indiceActual++; 
                    }
                }
                reproducirSiguiente(guildId);
            }
        });

        reproductorVoz.on(AudioPlayerStatus.Idle, () => {
            if (estadoServidor.rutaAudioTemp && fs.existsSync(estadoServidor.rutaAudioTemp)) {
                try { fs.unlinkSync(estadoServidor.rutaAudioTemp); } catch(e) {}
                estadoServidor.rutaAudioTemp = null;
            }
            if (estadoServidor.conexionActual && reproductorMusica.state.status === 'paused') {
                estadoServidor.conexionActual.subscribe(reproductorMusica);
                reproductorMusica.unpause(); 
            }
        });

        servidores.set(guildId, estadoServidor);
    }
    return servidores.get(guildId);
}

// =====================================================================
//  RENDERIZADO DE INTERFAZ (UI)
// =====================================================================
async function refrescarInterfaz(guildId, forzarBajarCaja = false) {
    const server = obtenerServidor(guildId);
    if (!server.canalMensajes || server.indiceActual >= server.colaMusica.length) return;

    if (server.vistaActual === 'cola') {
        await renderizarPanelCola(guildId, forzarBajarCaja);
    } else {
        await renderizarPanelMusica(guildId, forzarBajarCaja);
    }
}

function obtenerDatosBucle(estadoBucle) {
    if (estadoBucle === 'song') return { texto: 'Canción 🔂', emoji: '🔂', estilo: ButtonStyle.Success };
    if (estadoBucle === 'queue') return { texto: 'Cola 🔁', emoji: '🔁', estilo: ButtonStyle.Primary };
    return { texto: 'Apagado ➡', emoji: '➡', estilo: ButtonStyle.Secondary };
}

async function renderizarPanelMusica(guildId, nuevaCaja = false) {
    const server = obtenerServidor(guildId);
    const cancionActual = server.colaMusica[server.indiceActual];
    const cfgBucle = obtenerDatosBucle(server.repetirActual);

    const embed = new EmbedBuilder()
        .setColor('#FF66AA') 
        .setAuthor({ name: "🧊 Souris's player 🧊", iconURL: client.user.displayAvatarURL() })
        .setTitle(cancionActual.titulo)
        .setURL(cancionActual.url || 'https://discord.com') 
        .setThumbnail(cancionActual.thumbnail || 'https://i.imgur.com/Qk2vXQZ.png')
        .addFields(
            { name: '⏱️ Duración', value: cancionActual.duracion || 'Desconocida', inline: true },
            { name: '📺 Canal', value: cancionActual.canal || 'Desconocido', inline: true },
            { name: '⚙️ Estado', value: `Volumen: **${Math.round(server.volumenActual * 100)}%**\nBucle: **${cfgBucle.texto}**`, inline: false }
        )
        .setFooter({ text: `Pista #${server.indiceActual + 1} de ${server.colaMusica.length} en la cola` })
        .setTimestamp();

    const filaBotones = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_prev').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_replay').setEmoji('⏪').setStyle(ButtonStyle.Secondary), 
        new ButtonBuilder().setCustomId('btn_pause').setEmoji('⏯️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_loop').setEmoji(cfgBucle.emoji).setStyle(cfgBucle.estilo) 
    );

    const filaVolumen = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_voldown').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_volup').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_queue').setLabel('Ver Cola').setEmoji('📋').setStyle(ButtonStyle.Primary)
    );

    if (nuevaCaja && server.mensajeReproductor) {
        try { await server.mensajeReproductor.delete(); } catch(e) {}
        server.mensajeReproductor = null;
    }

    try {
        if (server.mensajeReproductor) {
            await server.mensajeReproductor.edit({ embeds: [embed], components: [filaBotones, filaVolumen] });
        } else {
            server.mensajeReproductor = await server.canalMensajes.send({ embeds: [embed], components: [filaBotones, filaVolumen] });
        }
    } catch (error) {}
}

async function renderizarPanelCola(guildId, nuevaCaja = false) {
    const server = obtenerServidor(guildId);

    const elementosPorPagina = 10;
    const totalPaginas = Math.ceil(server.colaMusica.length / elementosPorPagina) || 1;
    
    if (server.paginaCola >= totalPaginas) server.paginaCola = totalPaginas - 1;
    if (server.paginaCola < 0) server.paginaCola = 0;

    const inicio = server.paginaCola * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const cancionesPagina = server.colaMusica.slice(inicio, fin);
    const cancionActual = server.colaMusica[server.indiceActual];

    let descripcion = `**🎶 Sonando ahora:**\n[${cancionActual ? cancionActual.titulo : 'Nada'}](${cancionActual ? cancionActual.url || 'https://discord.com' : 'https://discord.com'})\n\n`;
    
    if (server.colaMusica.length === 0) {
        descripcion += "*La cola está vacía.*";
    } else {
        descripcion += `**Lista Completa (Página ${server.paginaCola + 1}/${totalPaginas}):**\n`;
        cancionesPagina.forEach((c, i) => {
            const indexGlobal = inicio + i;
            if (indexGlobal === server.indiceActual) {
                descripcion += `▶️ **${indexGlobal + 1}. ${c.titulo}**\n`;
            } else {
                descripcion += `**${indexGlobal + 1}.** ${c.titulo}\n`;
            }
        });
    }

    const cfgBucle = obtenerDatosBucle(server.repetirActual);
    const embed = new EmbedBuilder()
        .setColor('#1DB954') 
        .setAuthor({ name: 'Cola de Reproducción', iconURL: client.user.displayAvatarURL() })
        .setDescription(descripcion)
        .setFooter({ text: `Total de pistas: ${server.colaMusica.length} | Bucle: ${cfgBucle.texto}` });

    const filaNavegacion = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_q_prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(server.paginaCola === 0),
        new ButtonBuilder().setCustomId('btn_q_back').setLabel('Volver al Reproductor').setEmoji('🎵').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_q_next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(server.paginaCola >= totalPaginas - 1)
    );

    if (nuevaCaja && server.mensajeReproductor) {
        try { await server.mensajeReproductor.delete(); } catch(e) {}
        server.mensajeReproductor = null;
    }

    try {
        if (server.mensajeReproductor) {
            await server.mensajeReproductor.edit({ embeds: [embed], components: [filaNavegacion] });
        } else {
            server.mensajeReproductor = await server.canalMensajes.send({ embeds: [embed], components: [filaNavegacion] });
        }
    } catch (error) {}
}

// --- MOTOR DE REPRODUCCIÓN (JIT CON MUTEX) ---
async function reproducirSiguiente(guildId) {
    const server = obtenerServidor(guildId);

    if (server.enTransicion) return; 

    if (server.indiceActual >= server.colaMusica.length) {
        server.reproduciendoMusica = false;
        if (server.mensajeReproductor) {
            try { await server.mensajeReproductor.delete(); } catch(e) {}
            server.mensajeReproductor = null;
        }

        if (server.canalMensajes) {
            const embedFin = new EmbedBuilder().setColor('#FF0000').setDescription('🏁 **La lista de reproducción ha terminado. Se vació la cola para ahorrar recursos.**');
            server.canalMensajes.send({ embeds: [embedFin] }).catch(()=>{});
        }
        server.colaMusica = [];
        server.historialMusica = [];
        server.indiceActual = 0;
        server.saltoManual = null;
        server.cancionActual = null;
        server.repetirActual = 'off';
        server.enTransicion = false;
        return;
    }

    server.enTransicion = true;
    server.reproduciendoMusica = true;
    const cancion = server.colaMusica[server.indiceActual]; 
    server.vistaActual = 'reproductor'; 
    let urlFinal = cancion.url;

    try {
        if (cancion.tipo === 'busqueda') {
            const res = await play.search(cancion.query, { limit: 1 });
            if (res.length > 0) {
                urlFinal = res[0].url;
                cancion.url = urlFinal;
                cancion.thumbnail = res[0].thumbnails[0]?.url;
                cancion.duracion = res[0].durationRaw;
                cancion.canal = res[0].channel?.name;
            } else {
                if (server.canalMensajes) server.canalMensajes.send(`No encontré audio para: **${cancion.titulo}**`);
                server.indiceActual++; 
                server.enTransicion = false;
                return reproducirSiguiente(guildId); 
            }
        } else if (cancion.tipo === 'url') {
            try {
                const info = await play.video_info(urlFinal);
                cancion.thumbnail = info.video_details.thumbnails[0]?.url;
                cancion.duracion = info.video_details.durationRaw;
                cancion.canal = info.video_details.channel?.name;
            } catch (e) {}
        }

        server.procesoAudio = youtubedl.exec(urlFinal, {
            output: '-',
            format: 'bestaudio',
            rmCacheDir: true,
        }, { stdio: ['ignore', 'pipe', 'ignore'] });

        server.procesoAudio.catch(err => { /* Silenciar crashes de saltos */ });

        const recursoMusica = createAudioResource(server.procesoAudio.stdout, { 
            inputType: StreamType.Arbitrary,
            inlineVolume: true 
        });

        recursoMusica.volume.setVolume(server.volumenActual); 
        server.reproductorMusica.play(recursoMusica);
        server.enTransicion = false;
        
        refrescarInterfaz(guildId, true);

    } catch (error) {
        console.error("Error reproduciendo:", error);
        if (server.canalMensajes) server.canalMensajes.send(`Error tocando **${cancion.titulo}**. Saltando...`);
        server.indiceActual++;
        server.enTransicion = false;
        reproducirSiguiente(guildId);
    }
}

// --- LÓGICA DE LOS BOTONES (CON ANTI-SPAM) ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    
    const server = obtenerServidor(interaction.guildId);

    const ahora = Date.now();
    if (ahora - server.bloqueoInteraccion < 1500) {
        return interaction.reply({ content: '⏳ ¡Pérate we, no presiones los botones tan rápido!', ephemeral: true }).catch(()=>{});
    }
    server.bloqueoInteraccion = ahora;

    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === 'btn_pause') {
        if (server.reproductorMusica.state.status === 'playing') server.reproductorMusica.pause();
        else if (server.reproductorMusica.state.status === 'paused') server.reproductorMusica.unpause();
    }
    else if (interaction.customId === 'btn_skip') {
        if (server.repetirActual === 'song') server.repetirActual = 'off';
        server.saltoManual = server.indiceActual + 1; 
        
        if (server.repetirActual === 'queue' && server.saltoManual >= server.colaMusica.length) {
            server.saltoManual = 0;
        }
        
        if (server.procesoAudio) server.procesoAudio.kill(); 
        server.reproductorMusica.stop(); 
    }
    else if (interaction.customId === 'btn_replay') {
        server.saltoManual = server.indiceActual; 
        if (server.procesoAudio) server.procesoAudio.kill(); 
        server.reproductorMusica.stop(); 
    }
    else if (interaction.customId === 'btn_prev') {
        if (server.repetirActual === 'song') server.repetirActual = 'off';
        server.saltoManual = server.indiceActual - 1; 
        
        if (server.repetirActual === 'queue' && server.saltoManual < 0) {
            server.saltoManual = server.colaMusica.length - 1;
        } else if (server.saltoManual < 0) {
            server.saltoManual = 0;
        }

        if (server.procesoAudio) server.procesoAudio.kill(); 
        server.reproductorMusica.stop(); 
    }
    else if (interaction.customId === 'btn_loop') {
        if (server.repetirActual === 'off') server.repetirActual = 'song';
        else if (server.repetirActual === 'song') server.repetirActual = 'queue';
        else server.repetirActual = 'off';
        refrescarInterfaz(interaction.guildId); 
    }
    else if (interaction.customId === 'btn_voldown') {
        server.volumenActual = Math.max(0.01, server.volumenActual - 0.02); 
        const recurso = server.reproductorMusica.state.resource;
        if (recurso && recurso.volume) recurso.volume.setVolume(server.volumenActual);
        refrescarInterfaz(interaction.guildId);
    }
    else if (interaction.customId === 'btn_volup') {
        server.volumenActual = Math.min(1.0, server.volumenActual + 0.02); 
        const recurso = server.reproductorMusica.state.resource;
        if (recurso && recurso.volume) recurso.volume.setVolume(server.volumenActual);
        refrescarInterfaz(interaction.guildId);
    }
    else if (interaction.customId === 'btn_queue') {
        server.vistaActual = 'cola';
        server.paginaCola = Math.floor(server.indiceActual / 10);
        refrescarInterfaz(interaction.guildId);
    }
    else if (interaction.customId === 'btn_q_back') {
        server.vistaActual = 'reproductor';
        refrescarInterfaz(interaction.guildId);
    }
    else if (interaction.customId === 'btn_q_prev') {
        server.paginaCola--;
        refrescarInterfaz(interaction.guildId);
    }
    else if (interaction.customId === 'btn_q_next') {
        server.paginaCola++;
        refrescarInterfaz(interaction.guildId);
    }
});

// =====================================================================
//  MONITOR DE AFK
// =====================================================================
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const guildId = oldState.guild.id;
    const server = servidores.get(guildId);
    if (!server) return;

    const botChannel = oldState.guild.members.me.voice.channel;

    if (!botChannel && server.conexionActual) {
        server.colaMusica = [];
        server.historialMusica = [];
        server.indiceActual = 0;
        server.saltoManual = null;
        server.reproduciendoMusica = false;
        server.cancionActual = null;
        server.repetirActual = 'off';
        server.enTransicion = false;
        if (server.procesoAudio) server.procesoAudio.kill();
        server.reproductorMusica.stop();
        server.conexionActual = null;
        if (server.mensajeReproductor) {
            try { server.mensajeReproductor.delete(); } catch(e){}
            server.mensajeReproductor = null;
        }
        if (server.temporizadorAFK) {
            clearTimeout(server.temporizadorAFK);
            server.temporizadorAFK = null;
        }
        return;
    }

    if (botChannel) {
        const humanos = botChannel.members.filter(m => !m.user.bot).size;

        if (humanos === 0) {
            if (!server.temporizadorAFK) {
                server.temporizadorAFK = setTimeout(async () => {
                    server.colaMusica = [];
                    server.historialMusica = [];
                    server.indiceActual = 0;
                    server.saltoManual = null;
                    server.reproduciendoMusica = false;
                    server.cancionActual = null;
                    server.repetirActual = 'off';
                    server.enTransicion = false;
                    if (server.procesoAudio) server.procesoAudio.kill();
                    server.reproductorMusica.stop();
                    if (server.conexionActual) server.conexionActual.destroy();
                    server.conexionActual = null;
                    if (server.mensajeReproductor) {
                        try { await server.mensajeReproductor.delete(); } catch(e){}
                        server.mensajeReproductor = null;
                    }
                    if (server.canalMensajes) {
                        server.canalMensajes.send("💤 Estuve 5 minutos solo en el canal. Me salí de la llamada y limpié la cola para no gastar RAM.");
                    }
                    server.temporizadorAFK = null;
                }, 5 * 60 * 1000); 
            }
        } else {
            if (server.temporizadorAFK) {
                clearTimeout(server.temporizadorAFK);
                server.temporizadorAFK = null;
            }
        }
    }
});

client.on(Events.ClientReady, readyClient => {
    console.log(`Bot conectado como ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;

    const server = obtenerServidor(message.guild.id);

    if (message.content.startsWith('!')) {
        const ahora = Date.now();
        if (ahora - server.bloqueoInteraccion < 1000) {
            return message.reply('⏳ Calma, el bot está procesando. No mandes comandos tan rápido.').then(m => setTimeout(() => m.delete().catch(()=>{}), 3000)).catch(()=>{});
        }
        server.bloqueoInteraccion = ahora;
    }

    if (message.content === '!h' || message.content === '!ayuda') {
        const embedHelp = new EmbedBuilder()
            .setColor('#FF66AA')
            .setAuthor({ name: 'Panel de Comandos', iconURL: client.user.displayAvatarURL() })
            .addFields(
                { name: '🎵 Música', value: '`!p [canción/url]` - Añade a la cola\n`!p [num]` - Salta a cualquier canción exacta (ej: `!p 2`)\n`!skip` - Salta la actual\n`!cola` - Menú interactivo de la cola' },
                { name: '🗣️ Voces TTS', value: '`!jarvis [texto] (tiene limite de caracteres)`\n`!loquendo [texto] (tiene limite de caracteres)`\n`!okarin [texto] (tiene limite de caracteres)`\n`!normi [texto] (Ilimitado)`\n`!g [texto] (Ilimitado)`' },
                { name: '⚙️ Utilidad', value: '`!entrar` - Conecta al bot al canal\n`!limpiar` - Vacía la cola, borra la caja y desconecta\n`!h` - Muestra este menú' }
            )
            .setFooter({ text: 'Sistema Multi-Servidor 🚀' });
        
        await message.reply({ embeds: [embedHelp] });
        if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
        return;
    }

    if (message.content === '!entrar') {
        const canalDeVoz = message.member.voice.channel;
        if (canalDeVoz){
            server.conexionActual = joinVoiceChannel({
                channelId: canalDeVoz.id,
                guildId: canalDeVoz.guild.id,
                adapterCreator: canalDeVoz.guild.voiceAdapterCreator
            });
            server.conexionActual.subscribe(server.reproductorMusica);
            server.canalMensajes = message.channel; 
            message.reply(`Conectado al canal de voz.`);
        }
    }

    if (message.content === '!limpiar') {
        server.colaMusica = [];
        server.indiceActual = 0;
        server.saltoManual = null;
        server.reproduciendoMusica = false;
        server.repetirActual = 'off';
        server.enTransicion = false;
        if (server.procesoAudio) server.procesoAudio.kill();
        server.reproductorMusica.stop();
        if (server.conexionActual) server.conexionActual.destroy();
        server.conexionActual = null;
        if (server.temporizadorAFK) {
            clearTimeout(server.temporizadorAFK);
            server.temporizadorAFK = null;
        }
        if (server.mensajeReproductor) {
            try { await server.mensajeReproductor.delete(); } catch(e){}
            server.mensajeReproductor = null;
        }
        return message.reply("🧹 Toda la cola vaciada y bot desconectado de la sala.");
    }

    // NAVEGACIÓN ABSOLUTA (!p 3)
    const matchSalto = message.content.match(/^!p\s*(\d+)$/);
    if (matchSalto || message.content.startsWith('!saltar ')) {
        if (!server.conexionActual) return message.reply("Utiliza el comando !entrar primero.");
        
        const indexStr = matchSalto ? matchSalto[1] : message.content.split(' ')[1];
        const num = parseInt(indexStr);

        if (isNaN(num) || num <= 0 || num > server.colaMusica.length) {
            const errEmbed = new EmbedBuilder().setColor('#FF0000').setDescription(`❌ Número inválido. Hay **${server.colaMusica.length}** canciones registradas. Usa un número del 1 al ${server.colaMusica.length}.`);
            await message.reply({ embeds: [errEmbed] });
            if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
            return;
        }

        if (server.repetirActual === 'song') server.repetirActual = 'off';
        server.saltoManual = num - 1; 
        
        if (server.procesoAudio) server.procesoAudio.kill();
        server.reproductorMusica.stop();

        return message.reply({ embeds: [new EmbedBuilder().setColor('#FF66AA').setDescription(`⏭️ Viajando directamente a la posición **#${num}**...`)] });
    }

    if (message.content === '!skip') {
        if (!server.conexionActual || !server.reproduciendoMusica) return message.reply("No hay música en reproducción.");
        if (server.repetirActual === 'song') server.repetirActual = 'off';
        server.saltoManual = server.indiceActual + 1;
        
        if (server.repetirActual === 'queue' && server.saltoManual >= server.colaMusica.length) {
            server.saltoManual = 0;
        }
        
        if (server.procesoAudio) server.procesoAudio.kill();
        server.reproductorMusica.stop(); 
    }

    if (message.content === '!cola') {
        if (server.colaMusica.length === 0) return message.reply("La cola de reproducción está vacía.");
        server.vistaActual = 'cola';
        server.paginaCola = Math.floor(server.indiceActual / 10);
        refrescarInterfaz(message.guild.id, true); 
    }

    if (message.content.startsWith('!p ')) {
        const query = message.content.replace('!p ', '').trim();
        if (!server.conexionActual) return message.reply("Utiliza el comando !entrar primero.");
        server.canalMensajes = message.channel; 

        try {
            if (query.includes('spotify.com')) {
                try {
                    const tracks = await spotify.getTracks(query);
                    if (!tracks || tracks.length === 0) return message.reply("No se pudieron extraer los datos de Spotify.");
                    
                    tracks.forEach(t => {
                        let artista = "Desconocido";
                        if (t.artist) {
                            artista = typeof t.artist === 'string' ? t.artist : t.artist.name;
                        } else if (t.artists && t.artists.length > 0) {
                            artista = typeof t.artists[0] === 'string' ? t.artists[0] : t.artists[0].name;
                        }
                        const tituloStr = `${t.name} - ${artista}`;
                        const queryBusqueda = `${t.name} ${artista} audio`; 
                        
                        server.colaMusica.push({ query: queryBusqueda, tipo: 'busqueda', titulo: tituloStr });
                    });
                    
                    if (tracks.length === 1) {
                        message.reply({ embeds: [new EmbedBuilder().setColor('#1DB954').setDescription(`✅ Agregado a la cola: **${tracks[0].name}**`)] });
                    } else {
                        message.reply({ embeds: [new EmbedBuilder().setColor('#1DB954').setDescription(`✅ Se agregaron **${tracks.length}** pistas de Spotify.`)] });
                    }
                } catch (e) {
                    message.reply("Hubo un error al leer el enlace de Spotify.");
                }
            } 
            else if (play.yt_validate(query) === 'playlist') {
                const playlist = await play.playlist_info(query, { incomplete: true });
                const videos = await playlist.all_videos();
                videos.forEach(v => {
                    server.colaMusica.push({ url: v.url, tipo: 'url', titulo: v.title });
                });
                message.reply({ embeds: [new EmbedBuilder().setColor('#FF0000').setDescription(`✅ Se agregaron **${videos.length}** pistas de YouTube.`)] });
            } 
            else {
                if (!query.includes('http')) {
                    server.colaMusica.push({ query: query, tipo: 'busqueda', titulo: query });
                } else {
                    server.colaMusica.push({ url: query, tipo: 'url', titulo: "Enlace de YouTube" });
                }
                message.reply({ embeds: [new EmbedBuilder().setColor('#FF66AA').setDescription(`✅ Pista agregada a la cola.`)] });
            }

            if (!server.reproduciendoMusica) {
                reproducirSiguiente(message.guild.id);
            } else {
                refrescarInterfaz(message.guild.id, true);
            }

        } catch (error) { 
            message.reply("Ocurrió un error al procesar el enlace.");
        }
    }

    const prepararVoz = () => {
        if (!server.conexionActual) return false;
        server.reproductorMusica.pause(); 
        server.conexionActual.subscribe(server.reproductorVoz); 
        return true;
    };

    if (message.content.startsWith('!jarvis ')) {
        if (!prepararVoz()) return;
        const texto = message.content.replace('!jarvis ', '');
        const stream = await elevenlabs.generate({ voice: "HMisYaQUzH2pblrrIuuq", model_id: "eleven_multilingual_v2", text: texto, stream: true });
        const rVoz = createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
        rVoz.volume.setVolume(1.0); 
        server.reproductorVoz.play(rVoz);
        if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
    }

    if (message.content.startsWith('!loquendo ')) {
        if (!prepararVoz()) return;
        const texto = message.content.replace('!loquendo ', '');
        const stream = await elevenlabs.generate({ voice: "MpOr6ixKHGtcYY9WTyGt", model_id: "eleven_multilingual_v2", text: texto, stream: true });
        const rVoz = createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
        rVoz.volume.setVolume(1.0);
        server.reproductorVoz.play(rVoz);
        if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
    }

    if (message.content.startsWith('!okarin ')) {
        if (!prepararVoz()) return;
        const texto = message.content.replace('!okarin ', '');
        const stream = await elevenlabs.generate({ voice: "GBv7mTt0atIp3Br8iCZE", model_id: "eleven_multilingual_v2", text: texto, stream: true });
        const rVoz = createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
        rVoz.volume.setVolume(1.0);
        server.reproductorVoz.play(rVoz);
        if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
    }

    if (message.content.startsWith('!normi ')) {
        if (!prepararVoz()) return;
        const texto = message.content.replace('!normi ', '').trim();
        const res = await fetch("https://tiktok-tts.weilnet.workers.dev/api/generation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: texto, voice: "es_mx_002" })
        });
        const data = await res.json();
        const { Readable } = require("stream");
        const rVoz = createAudioResource(Readable.from(Buffer.from(data.data, "base64")), { inlineVolume: true });
        rVoz.volume.setVolume(1.0);
        server.reproductorVoz.play(rVoz);
        if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
    }

    if (message.content.startsWith('!g ')) {
        if (!prepararVoz()) return;
        const texto = message.content.replace('!g ', '').trim();
        const carpetaPiper = path.join(__dirname, 'piper');
        const rutaAudio = path.join(os.tmpdir(), `piper_${message.guild.id}_${Date.now()}.wav`);
        server.rutaAudioTemp = rutaAudio; 

        const modeloVoz = path.join(carpetaPiper, 'es_ES-sharvard-medium.onnx');
        const ejecutablePiper = process.platform === 'win32' ? path.join(carpetaPiper, 'piper.exe') : path.join(carpetaPiper, 'piper');

        const piper = spawn(ejecutablePiper, ['-m', modeloVoz, '-f', rutaAudio]);
        piper.stdin.write(texto);
        piper.stdin.end();
        
        piper.on('close', (code) => {
            if (code === 0 && fs.existsSync(rutaAudio)) {
                const rVoz = createAudioResource(rutaAudio, { inlineVolume: true });
                rVoz.volume.setVolume(1.0);
                server.reproductorVoz.play(rVoz);
                if (server.reproduciendoMusica) refrescarInterfaz(message.guild.id, true);
            } else {
                server.reproductorMusica.unpause();
                server.conexionActual.subscribe(server.reproductorMusica);
            }
        });
    }
});

// =====================================================================
//  ESCUDOS ANTI-CRASH
// =====================================================================
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

client.login(process.env.DISCORD_TOKEN);