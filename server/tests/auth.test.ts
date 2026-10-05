import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, signedUpAgent } from './helpers.js';

describe('auth', () => {
  it('signs a customer up and logs them in with a cookie', async () => {
    const agent = await signedUpAgent();
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body).toMatchObject({ email: 'sam@example.com', role: 'customer' });
    expect(me.body.password_hash).toBeUndefined();
  });

  it('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ name: 'A', email: 'a@b.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await signedUpAgent();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Other', email: 'SAM@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('logs in with the right password and refuses the wrong one', async () => {
    await signedUpAgent();
    await request(app).post('/api/auth/login').send({ email: 'sam@example.com', password: 'password123' }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'sam@example.com', password: 'nope-nope' }).expect(401);
  });

  it('requires login for /me', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('logs out', async () => {
    const agent = await signedUpAgent();
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});
