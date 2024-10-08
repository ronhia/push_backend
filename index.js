import express from 'express';
import admin from 'firebase-admin';
import fs from 'fs';

// Cargar las credenciales del archivo JSON
const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
console.log(serviceAccount)

// Inicializar Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Crear una instancia de Express
const app = express();
app.use(express.json());

// Ruta para enviar notificación push
app.post('/send-notification', async (req, res) => {
    const { token, title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: 'Faltan campos en el request.' });
    }

    const message = {
        topic: "42",
        notification: {
            title,
            body,
        },
    };

    try {
        // Enviar notificación push usando la API HTTP v1
        const response = await admin.messaging().send(message);
        console.log('Notificación enviada:', response);
        res.status(200).json({ message: 'Notificación enviada correctamente', response });
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        res.status(500).json({ message: 'Error al enviar notificación', error });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});