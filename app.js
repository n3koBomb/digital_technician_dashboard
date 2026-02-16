/**
 * Digitaler Techniker Dashboard
 * Application Entry Point
 */

import express from 'express';
import path from 'path';
import session from 'express-session';
import { randomBytes } from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import flash from 'connect-flash';
import { ensureDirSync } from 'fs-extra';

import open from 'open';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: './envs/site.env', encoding: 'UTF-8', quiet: true, debug: true })

/* -------------------------------------------------------------------------- */
/* Variables                                                                      */
/* -------------------------------------------------------------------------- */
let isDev = process.env.NODE_ENV;



/* -------------------------------------------------------------------------- */
/* CORE                                                                       */
/* -------------------------------------------------------------------------- */

import { initLogger, info, warn } from './src/core/logger.js';
// import { initDatabase, close } from './src/core/database.js';
// import { initCache } from './src/core/cache.js';
// import { initEventBus } from './src/core/event-bus.js';
// import { initRealtime, attach } from './src/core/realtime.js';
// import { initScheduler } from './src/core/scheduler.js';

/* -------------------------------------------------------------------------- */
/* MIDDLEWARES                                                                */
/* -------------------------------------------------------------------------- */

// import authMiddleware from './src/middlewares/auth.middleware.js';
// import roleMiddleware from './src/middlewares/role.middleware.js';
// import auditMiddleware from './src/middlewares/audit.middleware.js';
// import rateLimitMiddleware from './src/middlewares/rateLimit.middleware.js';
// import validationMiddleware from './src/middlewares/validation.middleware.js';
import { errorMiddleware } from './src/middlewares/error.middleware.js';

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                     */
/* -------------------------------------------------------------------------- */

import authRoutes from './src/routes/auth.routes.js';
// import devicesRoutes from './src/routes/devices.routes.js';
// import jobsRoutes from './src/routes/jobs.routes.js';
// import partsRoutes from './src/routes/parts.rooutes.js';
// import qcRoutes from './src/routes/qc.routes.js';
// import reportsRoutes from './src/routes/reports.routes.js';
// import techniciansRoutes from './src/routes/technicians.routes.js';
// import workflowRoutes from './src/routes/workflow.routes.js';
// import realtimeRoutes from './src/routes/realtime.routes.js';
// import systemRoutes from './src/routes/system.routes.js';
// import monitoringRoutes from './src/routes/monitoring.routes.js';
// import auditRoutes from './src/routes/audit.routes.js';
// import plentyRoutes from './src/routes/plenty.routes.js';
// import usersRoutes from './src/routes/users.routes.js';

/* -------------------------------------------------------------------------- */
/* APP INIT                                                                   */
/* -------------------------------------------------------------------------- */

const app = express();
ensureDirSync(path.join(path.dirname('./'), 'logs'));

/* -------------------------------------------------------------------------- */
/* BOOTSTRAP CORE                                                             */
/* -------------------------------------------------------------------------- */

initLogger({
    appName: process.env.APP_NAME,
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
    logToFile: process.env.LOG_TO_FILE
});
// initDatabase();
// initCache();
// initEventBus();
// initRealtime();
// initScheduler();

/* -------------------------------------------------------------------------- */
/* GLOBAL LOCALS                                      */
/* -------------------------------------------------------------------------- */
app.locals.app = {
    name: 'Digitaler Techniker Dashboard',
    version: '1.0.0'
};



/* -------------------------------------------------------------------------- */
/* GLOBAL SECURITY & REQUEST MIDDLEWARE                                       */
/* -------------------------------------------------------------------------- */

app.use(flash())

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
    secret: process.env.SESSION_SECRET || randomBytes(48).toString('hex'),
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

app.use(express.static(path.join(process.cwd(), 'src/public')));

app.set('views', path.join(process.cwd(), 'src/views'));
app.set('view engine', 'pug');

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.env = process.env.NODE_ENV || 'development';
    res.locals.year = new Date().getFullYear();
    res.locals.user = req.session && req.session.user ? req.session.user : null;
    // res.locals.isHX = req.headers["hx-request"] === "true";
    next();
});

/* -------------------------------------------------------------------------- */
/* PUBLIC ROUTES                                                              */
/* -------------------------------------------------------------------------- */

app.get('/', (_, res) => res.render('welcome', {
    app: {
        name: "Digitaler Techniker Dashboard"
    },
}));
app.use('/auth', authRoutes);

/* -------------------------------------------------------------------------- */
/* AUTHENTICATED ROUTES                                                       */
/* -------------------------------------------------------------------------- */

// app.use(authMiddleware);
//auditMiddleware('DASHBOARD_VIEW'),
app.get('/dashboard', (req, res) => {
    res.render('dashboard/index', {
        system: {
            online: false
        },
        realtime: {
            connected: false
        },
        plenty: {
            pending: 0
        },
        user: {
            firstName: "Mamamia",
            lastName: "Mario",
            role: "admin", // admin | goods_receiving | technician | qc_inspector | analyzer | default
            email: "test@gmx.de"
        },
        stats: {
            devices: {
                total: 183
            },
            repair: {
                total: 14,
                progress: "negative",
                percent: 3
            },
            quickCheck: {
                total: 7
            },
            reworkRate: {
                total: 25.0,
                percent: 1,
                progress: "negative"
            }
        },
        jobQueue: {
            unsynced: {
                total: 4
            },
            lowStock: {
                total: 3
            },
            discrepancies: {
                total: 0
            }
        },
        // jobQueue: [
        //     {
        //         title: 'Displaytausch',
        //         deviceId: 'IMEI-356789112233445',
        //         technician: 'Nikolai',
        //         priority: 'high',        // low | normal | high | critical
        //         status: 'active',        // pending | active | blocked | done
        //         sla: 'warning',          // ok | warning | overdue
        //         slaDue: '2026-01-22T14:30:00Z',
        //         slaFormatted: 'in 2h',
        //         action: {
        //             label: 'Job öffnen',
        //             url: '/devices/123'
        //         }
        //     },
        //     {
        //         title: 'Diagnose – Bootloop',
        //         deviceId: 'SN-A1B2C3D4',
        //         technician: 'Alex',
        //         priority: 'normal',
        //         status: 'pending',
        //         sla: 'ok'
        //     }
        // ],
        alerts: [
            {
                level: 'warning',        // info | warning | error | critical
                title: 'Plenty Sync offen',
                message: '5 Geräte sind im Dashboard erfasst, aber nicht in Plenty verbucht.',
                source: 'Plenty-Service',
                code: 'PLENTY_SYNC_PENDING',
                timestamp: '2026-01-22T09:12:00Z',
                timeFormatted: 'vor 15 Minuten',
                action: {
                    label: 'Zu den Blockern',
                    url: '/dashboard'
                }
            },
            {
                level: 'critical',
                title: 'QC-Rework erkannt',
                message: 'Gerät IMEI-9988776655 ist erneut aus der QC zurückgekommen.',
                source: 'QC-Engine',
                code: 'REWORK_DETECTED'
            }
        ],
        plentyBlocker: [
            {
                deviceId: 'IMEI-445566778899001',
                reason: 'Kein Lagertransfer in Plenty möglich',
                technician: 'Nikolai',
                state: 'overdue',        // pending | reminded | overdue | resolved
                reminder: 'hard',        // none | soft | hard
                createdAt: '2026-01-20T08:45:00Z',
                createdFormatted: 'vor 2 Tagen',
                action: {
                    label: 'In Plenty prüfen',
                    url: 'https://plenty.one/app'
                }
            },
            {
                deviceId: 'SN-ZXCV-1122',
                reason: 'Manuelle Buchung ausstehend',
                state: 'pending',
                reminder: 'soft'
            }
        ]

    });
});
app.get('/activity', (req, res) => {
    res.render('dashboard/activity', {
        app: {
            name: process.env.APP_NAME || 'My App',
            version: process.env.APP_VERSION || 'dev',
            timezone: new Date().getUTCDate()
        },
        system: {
            online: false
        },
        realtime: {
            connected: false
        },
        plenty: {
            pending: 0
        },
        user: {
            name: "Mamamia",
            role: "admin"
        },
        activities: [
            {
                type: "device",
                severity: "info",
                message: "Gerät wurde im Wareneingang erfasst.",
                deviceId: "IMEI 356938035643809",
                technician: "Alex",
                timestamp: "2026-02-08T18:12:43.000Z",
                timeFormatted: "vor 5 Minuten"
            },
            {
                type: "workflow",
                severity: "success",
                message: "Statuswechsel von Diagnose zu Reparatur durchgeführt.",
                deviceId: "IMEI 356938035643809",
                technician: "Alex",
                timestamp: "2026-02-08T17:55:10.000Z",
                timeFormatted: "vor 22 Minuten"
            },
            {
                type: "part",
                severity: "warning",
                message: "Ersatzteil wurde verbaut, passt nicht zum Gerätemodell.",
                deviceId: "IMEI 352099001234567",
                technician: "Murat",
                part: "Display iPhone 11",
                timestamp: "2026-02-08T16:41:02.000Z",
                timeFormatted: "vor 1 Stunde"
            },
            {
                type: "qc",
                severity: "error",
                message: "QC fehlgeschlagen: Touch reagiert nicht im unteren Bereich.",
                deviceId: "IMEI 352099001234567",
                technician: "Murat",
                timestamp: "2026-02-08T15:18:27.000Z",
                timeFormatted: "vor 2 Stunden"
            },
            {
                type: "workflow",
                severity: "critical",
                message: "Gerät erneut in Reparatur zurückgeführt (Rework erkannt).",
                deviceId: "IMEI 352099001234567",
                technician: "Murat",
                timestamp: "2026-02-08T15:20:01.000Z",
                timeFormatted: "vor 2 Stunden"
            },
            {
                type: "system",
                severity: "info",
                message: "Plenty-Sync ausstehend: Gerät lokal erfasst, aber nicht übertragen.",
                deviceId: "IMEI 359881234567890",
                timestamp: "2026-02-08T14:03:55.000Z",
                timeFormatted: "heute 14:03"
            },
            {
                type: "user",
                severity: "success",
                message: "Techniker erfolgreich am Dashboard angemeldet.",
                technician: "Nikolai",
                timestamp: "2026-02-08T07:58:12.000Z",
                timeFormatted: "heute 07:58"
            }
        ]
    });
});

app.get('/admin', (req, res) => {
    res.render('admin/config', {
        system: {
            online: false
        },
        realtime: {
            connected: false
        },
        plenty: {
            pending: 0
        },
        user: {
            name: "Mamamia",
            role: "admin",
            email: "test@gmx.de"
        }
    })
})

// app.use('/devices',
//     rateLimitMiddleware({ max: 300 }),
//     auditMiddleware(),
//     devicesRoutes
// );

// app.use('/jobs', auditMiddleware(), jobsRoutes);
// app.use('/parts', auditMiddleware(), partsRoutes);
// app.use('/qc', auditMiddleware(), qcRoutes);
// app.use('/reports', roleMiddleware(['admin', 'manager']), auditMiddleware(), reportsRoutes);
// app.use('/technicians', auditMiddleware(), techniciansRoutes);
// app.use('/workflow', auditMiddleware(), workflowRoutes);
// app.use('/realtime', realtimeRoutes);
// app.use('/plenty', roleMiddleware('admin'), auditMiddleware(), plentyRoutes);
// app.use('/users', roleMiddleware('admin'), auditMiddleware(), usersRoutes);
// app.use('/audit', roleMiddleware('admin'), auditRoutes);
// app.use('/monitoring', roleMiddleware('admin'), monitoringRoutes);
// app.use('/system', roleMiddleware('admin'), systemRoutes);

/* -------------------------------------------------------------------------- */
/* 404                                                                       */
/* -------------------------------------------------------------------------- */

app.use((req, res, next) => {
    const err = new Error('Route nicht gefunden');
    err.status = 404;
    err.code = 'ROUTE_NOT_FOUND';
    next(err);
});

/* -------------------------------------------------------------------------- */
/* ERROR HANDLER                                                              */
/* -------------------------------------------------------------------------- */

app.use(errorMiddleware);

/* -------------------------------------------------------------------------- */
/* SERVER                                                                     */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    switch (isDev) {
        case "development":
            console.info(`
    🚀 Server gestartet!
    
    📍 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📁 Environment: ${process.env.NODE_ENV || 'public'}
    
    ✅ Bereit für Verbindungen...
            `);
            if (process.env.AUTO_OPEN == true) { await open(`http://localhost:${PORT}`, { app: { name: 'firefox' } }) };
            break;
        default:

            info(`Server läuft auf http://localhost:${PORT}`);
            break;
    }

});

// attach(server);

/* -------------------------------------------------------------------------- */
/* GRACEFUL SHUTDOWN                                                          */
/* -------------------------------------------------------------------------- */

const shutdown = (signal) => {
    warn(`Shutdown: ${signal}`);
    // _shutdown();
    // close();
    server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);