// src/routes/auth.routes.js
// Zentrale Auth-Routen – Login, Register, Logout

import { Router } from 'express';
const router = Router();

// Middlewares
import { isAuthenticated, isGuest } from '../middlewares/auth.middleware.js';
import { csrfProtection } from '../middlewares/csrf.middleware.js';

// Controller (kapselt Business-Logik)
import { login, register, logout } from '../controllers/auth.controller.js';

// =====================================================
// GET: Login / Registrierung
// =====================================================
router.get('/login', isGuest, csrfProtection, (req, res) => {
    res.render('login', {
        pageTitle: 'Login / Registrierung',
        csrfToken: req.csrfToken(),
        flash: req.flash(),
        auth: {
            allowRegister: true,
            allowRememberMe: true
        }
    });
});

// =====================================================
// POST: Login
// =====================================================
router.post('/login', isGuest, csrfProtection, login); // login

// =====================================================
// POST: Registrierung
// =====================================================
router.post('/register', isGuest, csrfProtection, register); // register

// =====================================================
// POST: Logout
// =====================================================
router.post('/logout', isAuthenticated, logout); // logout

// =====================================================
// GET: Passwort vergessen
// =====================================================
router.get('/forgot', isGuest, csrfProtection, (req, res) => {
    res.render('auth/forgot', {
        pageTitle: 'Passwort vergessen',
        csrfToken: req.csrfToken(),
        flash: req.flash()
    });
});

export default router;
