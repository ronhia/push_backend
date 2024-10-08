// index.js

import express from 'express';
import { JWT } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';

// Cargar las credenciales del archivo JSON
const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

// URL del endpoint de FCM HTTP v1
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

// Inicializar JWT con las credenciales de servicio
const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

// Crear una instancia de Express
const app = express();
app.use(express.json());

// Función para obtener el token OAuth 2.0
async function getAccessToken() {
    const tokens = await jwtClient.authorize();
    return tokens.access_token;
}

// Ruta para enviar notificación push
app.post('/send-notification', async (req, res) => {
    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: 'Faltan campos en el request.' });
    }

    const message = {
        message: {
            topic: "42",
            notification: {
                title,
                body,
            },
        },
    };

    try {
        // Obtener el token de acceso OAuth 2.0
        const accessToken = await getAccessToken();

        // Enviar la notificación a través de HTTP v1 API con el token OAuth
        const response = await axios.post(FCM_URL, message, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Notificación enviada:', response.data);
        res.status(200).json({ message: 'Notificación enviada correctamente', response: response.data });
    } catch (error) {
        console.error('Error al enviar notificación:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error al enviar notificación', error: error.response?.data || error.message });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
