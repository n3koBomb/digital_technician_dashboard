/**
 * Digitaler Techniker Dashboard
 * Application Entry Point
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');

require('dotenv').config({ path: './envs/site.env' });

/* -------------------------------------------------------------------------- */
/* CORE                                                                       */
/* -------------------------------------------------------------------------- */

const Logger = require('./src/core/logger');
const Database = require('./src/core/database');
const Cache = require('./src/core/cache');
const EventBus = require('./src/core/event-bus');
const Realtime = require('./src/core/realtime');
const Scheduler = require('./src/core/scheduler');

/* -------------------------------------------------------------------------- */
/* MIDDLEWARES                                                                */
/* -------------------------------------------------------------------------- */

const authMiddleware = require('./src/middlewares/auth.middleware');
const roleMiddleware = require('./src/middlewares/role.middleware');
const auditMiddleware = require('./src/middlewares/audit.middleware');
const rateLimitMiddleware = require('./src/middlewares/rateLimit.middleware');
const validationMiddleware = require('./src/middlewares/validation.middleware');
const errorMiddleware = require('./src/middlewares/error.middleware');

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                     */
/* -------------------------------------------------------------------------- */

const authRoutes = require('./src/routes/auth.routes');
const devicesRoutes = require('./src/routes/devices.routes');
const jobsRoutes = require('./src/routes/jobs.routes');
const partsRoutes = require('./src/routes/parts.rooutes');
const qcRoutes = require('./src/routes/qc.routes');
const reportsRoutes = require('./src/routes/reports.routes');
const techniciansRoutes = require('./src/routes/technicians.routes');
const workflowRoutes = require('./src/routes/workflow.routes');
const realtimeRoutes = require('./src/routes/realtime.routes');
const systemRoutes = require('./src/routes/system.routes');
const monitoringRoutes = require('./src/routes/monitoring.routes');
const auditRoutes = require('./src/routes/audit.routes');
const plentyRoutes = require('./src/routes/plenty.routes');
const usersRoutes = require('./src/routes/users.routes');

/* -------------------------------------------------------------------------- */
/* APP INIT                                                                   */
/* -------------------------------------------------------------------------- */

const app = express();
fs.ensureDirSync(path.join(__dirname, 'logs'));

/* -------------------------------------------------------------------------- */
/* BOOTSTRAP CORE                                                             */
/* -------------------------------------------------------------------------- */

Logger.init();
Database.init();
Cache.init();
EventBus.init();
Realtime.init();
Scheduler.init();

/* -------------------------------------------------------------------------- */
/* GLOBAL SECURITY & REQUEST MIDDLEWARE                                       */
/* -------------------------------------------------------------------------- */

app.use(helmet());

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload());

app.use(session({
    name: 'techniker-dashboard.sid',
    secret: process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

/* -------------------------------------------------------------------------- */
/* STATIC & VIEW ENGINE                                                       */
/* -------------------------------------------------------------------------- */

app.use(express.static(path.join(__dirname, 'src/public')));

app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'pug');

app.use((req, res, next) => {
    res.locals.appName = 'Digitaler Techniker Dashboard';
    res.locals.appVersion = '1.0.0';
    res.locals.env = process.env.NODE_ENV || 'development';
    res.locals.year = new Date().getFullYear();
    res.locals.user = req.session?.user || null;
    next();
});

/* -------------------------------------------------------------------------- */
/* PUBLIC ROUTES                                                              */
/* -------------------------------------------------------------------------- */

app.get('/', (_, res) => res.render('welcome'));
app.use('/auth', authRoutes);

/* -------------------------------------------------------------------------- */
/* AUTHENTICATED ROUTES                                                       */
/* -------------------------------------------------------------------------- */

app.use(authMiddleware);

app.get('/dashboard', auditMiddleware('DASHBOARD_VIEW'), (req, res) => {
    res.render('dashboard/index');
});

app.use('/devices',
    rateLimitMiddleware({ max: 300 }),
    auditMiddleware(),
    devicesRoutes
);

app.use('/jobs', auditMiddleware(), jobsRoutes);
app.use('/parts', auditMiddleware(), partsRoutes);
app.use('/qc', auditMiddleware(), qcRoutes);
app.use('/reports', roleMiddleware(['admin', 'manager']), auditMiddleware(), reportsRoutes);
app.use('/technicians', auditMiddleware(), techniciansRoutes);
app.use('/workflow', auditMiddleware(), workflowRoutes);
app.use('/realtime', realtimeRoutes);
app.use('/plenty', roleMiddleware('admin'), auditMiddleware(), plentyRoutes);
app.use('/users', roleMiddleware('admin'), auditMiddleware(), usersRoutes);
app.use('/audit', roleMiddleware('admin'), auditRoutes);
app.use('/monitoring', roleMiddleware('admin'), monitoringRoutes);
app.use('/system', roleMiddleware('admin'), systemRoutes);

/* -------------------------------------------------------------------------- */
/* 404                                                                       */
/* -------------------------------------------------------------------------- */

app.use((_, res) => {
    res.status(404).render('error', {
        status: 404,
        title: '404 – Nicht gefunden',
        message: 'Diese Route existiert nicht.'
    });
});

/* -------------------------------------------------------------------------- */
/* ERROR HANDLER                                                              */
/* -------------------------------------------------------------------------- */

app.use(errorMiddleware);

/* -------------------------------------------------------------------------- */
/* SERVER                                                                     */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    Logger.info(`Server läuft auf http://localhost:${PORT}`);
});

Realtime.attach(server);

/* -------------------------------------------------------------------------- */
/* GRACEFUL SHUTDOWN                                                          */
/* -------------------------------------------------------------------------- */

const shutdown = (signal) => {
    Logger.warn(`Shutdown: ${signal}`);
    Scheduler.shutdown();
    Database.close();
    server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);