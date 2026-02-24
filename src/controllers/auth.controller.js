// src/controllers/auth.controller.js
// ESM-compatible Auth Controller

import bcrypt from 'bcrypt';
import { Users } from '../models/User.js';

export const login = async (req, res) => {
    const { identifier, password, remember } = req.body;

    try {
        const user = Users.find(u =>
            u.email === identifier || u.username === identifier
        );

        if (!user) {
            req.flash('error', 'Benutzer nicht gefunden.');
            return res.redirect('/auth/login');
        }

        if (user.status !== 'active') {
            req.flash('error', 'Account ist deaktiviert.');
            return res.redirect('/auth/login');
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            req.flash('error', 'Falsches Passwort.');
            return res.redirect('/auth/login');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        };

        if (remember) {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 14; // 14 Tage
        }

        req.flash('success', 'Erfolgreich angemeldet.');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('[AUTH][LOGIN]', err);
        req.flash('error', 'Login fehlgeschlagen.');
        return res.redirect('/auth/login');
    }
};

export const register = async (req, res) => {
    const { username, email, password, passwordConfirm, role } = req.body;

    if (password !== passwordConfirm) {
        req.flash('error', 'Passwörter stimmen nicht überein.');
        return res.redirect('/auth/login');
    }

    const existing = User.find(u =>
        u.email === email || u.username === username
    );

    if (existing) {
        req.flash('error', 'Benutzer existiert bereits.');
        return res.redirect('/auth/login');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    Users.push({
        id: `usr-${Date.now()}`,
        username,
        email,
        passwordHash,
        role: role || 'technician',
        status: 'active',
        createdAt: new Date()
    });

    req.flash('success', 'Konto erstellt.');
    return res.redirect('/auth/login');
};

export const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};
