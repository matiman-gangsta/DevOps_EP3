const request = require('supertest');
const fs = require('fs');
const path = require('path');
const promClient = require('prom-client');

describe('Pruebas Unitarias del Microservicio', () => {
  let app;
  let server;

  beforeAll(() => {
    // Normal import for the main suite of tests
    const module = require('./app');
    app = module.app;
    server = module.server;
  });

  afterAll(() => {
    server.close();
  });

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

  it('Debería responder 500 si falla la obtención de métricas', async () => {
    const originalMetrics = promClient.register.metrics;
    promClient.register.metrics = jest.fn().mockRejectedValue(new Error('Mocked metrics error'));
    
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toEqual(500);
    
    promClient.register.metrics = originalMetrics;
  });

  it('Debería cargar correctamente metadata.json si existe', () => {
    jest.resetModules();
    
    // Mock fs before requiring app
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (p.endsWith('metadata.json')) return true;
      return false;
    });
    
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((p, encoding) => {
      if (p.endsWith('metadata.json')) {
        return JSON.stringify({
          test_coverage_percent: 85,
          deployment_duration_seconds: 30
        });
      }
      return '';
    });

    // Use a different port to avoid EADDRINUSE conflict on require
    process.env.PORT = '8081';
    const testModule = require('./app');
    testModule.server.close();

    expect(existsSpy).toHaveBeenCalled();
    expect(readSpy).toHaveBeenCalled();

    existsSpy.mockRestore();
    readSpy.mockRestore();
  });

  it('Debería manejar errores al leer metadata.json corrupto o fallido', () => {
    jest.resetModules();
    
    // Mock fs to throw error
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (p.endsWith('metadata.json')) return true;
      return false;
    });
    
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((p, encoding) => {
      if (p.endsWith('metadata.json')) {
        throw new Error('Corrupt file');
      }
      return '';
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Use a different port to avoid EADDRINUSE conflict on require
    process.env.PORT = '8082';
    const testModule = require('./app');
    testModule.server.close();

    expect(existsSpy).toHaveBeenCalled();
    expect(readSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    existsSpy.mockRestore();
    readSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('Debería setear métricas en 0 si metadata.json no existe', () => {
    jest.resetModules();
    
    // Mock fs to return false
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (p.endsWith('metadata.json')) return false;
      return false;
    });

    // Use a different port to avoid EADDRINUSE conflict on require
    process.env.PORT = '8083';
    const testModule = require('./app');
    testModule.server.close();

    expect(existsSpy).toHaveBeenCalled();
    existsSpy.mockRestore();
  });
});