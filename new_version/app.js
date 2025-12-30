const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config({ path: './envs/site.env', debug: false });
const fileUpload = require('express-fileupload');

// const indexRouter = require('./routes/index');
// const dataRouter = require('./routes/data');
// const importExport = require('./routes/import-export');
// const analysisRouter = require('./routes/analysis');

const app = express();

// Middleware
// Security Middleware
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
//             scriptSrc: ["'self'"],
//             imgSrc: ["'self'", "data:", "https:"]
//         }
//     }
// }));

// CORS Configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Rate Limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
}));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    }
}));
app.use(fileUpload());

// Logging Middleware
app.use((req, _, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Statische Dateien
app.use(express.static(path.join(__dirname, 'src/public')));

// View Engine
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'pug');

// Globale Variablen für Templates
app.use((_, res, next) => {
    res.locals.currentYear = new Date().getFullYear();
    res.locals.appName = 'Techniker Dashboard';
    res.locals.appVersion = '0.0.1';
    res.locals.env = process.env.NODE_ENV || 'development';
    next();
});

// Routen
const router = express.Router();

router.get('/', (req, res) => { 
    res.render('app');
})
// app.use('/', indexRouter);
// app.use('/data', dataRouter);
// app.use('/import-export', importExport)
// app.use('/analysis', analysisRouter);

// 404 Handler
app.use((req, res, _) => {
    res.status(404).render('error', {
        title: '404 - Seite nicht gefunden',
        status: 404,
        error: 'Die angeforderte Seite konnte nicht gefunden werden.',
        url: req.url,
        method: req.method
    });
});

// Error Handling Middleware
app.use((err, req, res, _) => {
    console.error('❌ Fehler:', err.stack);

    // Log error to file
    const errorLog = {
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        error: err.message,
        stack: err.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    };

    // Asynchron loggen
    fs.appendFile(
        path.join(__dirname, 'logs', 'errors.log'),
        JSON.stringify(errorLog) + '\n'
    ).catch(logErr => console.error('Fehler beim Loggen:', logErr));

    // Error response
    const status = err.status || 500;
    res.status(status).render('error', {
        title: `${status} - Fehler`,
        status: status,
        error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        url: req.url,
        method: req.method,
        // Remove stack trace to prevent information disclosure
    });
});

// Ensure logs directory exists
fs.ensureDir(path.join(__dirname, 'logs')).catch(err => {
    console.error('Fehler beim Erstellen des Log-Verzeichnisses:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🚀 Server gestartet!
    
    📍 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📁 Environment: ${process.env.NODE_ENV || 'development'}
    
    ✅ Bereit für Verbindungen...
    `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM empfangen. Server wird heruntergefahren...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT empfangen. Server wird heruntergefahren...');
    process.exit(0);
});