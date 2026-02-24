import bcrypt from 'bcrypt';

const hash = await bcrypt.hash('Test1234!', 12);

export const Users = [
    {
        id: 'usr-001',
        username: 'alex',
        email: 'admin@repairtech.com',
        passwordHash: hash,
        role: 'admin',
        status: 'active',
        createdAt: new Date('2024-01-01')
    },
    {
        id: 'usr-002',
        username: 'jordan',
        email: 'receiving@repairtech.com',
        passwordHash: hash,
        role: 'goods_receiving',
        status: 'active',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'usr-003',
        username: 'sam',
        email: 'tech1@repairtech.com',
        passwordHash: hash,
        role: 'technician',
        status: 'active',
        createdAt: new Date('2024-01-20')
    }
];