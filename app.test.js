const request = require('supertest');
const { app, server } = require('./app');

afterAll(() => {
  server.close();
});

describe('Pruebas Unitarias del Microservicio', () => {
  
  it('Debería responder 200 OK en el endpoint de Health Check', async () => {
    const res = await request(app).get('/health');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toEqual('UP');
  });

  it('Debería responder 200 OK en el endpoint raíz /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('Operativo');
  });

  it('Debería responder 200 OK en el endpoint de /version', async () => {
    const res = await request(app).get('/version');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('version');
  });

  it('Debería responder 200 OK en el endpoint de /metrics y contener las métricas de prometheus', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('http_requests_total');
  });

});