# EP3 - Observabilidad y entornos reales en DevOps.

**Asignatura:** Ingeniería DevOps (DOY0101)
**Institución:** Duoc UC
**Estudiante:** Matias Nazal

---

## 1. Configuración de Monitoreo y Observabilidad (IE1, IE3)

Se configuró una suite de monitoreo auto-contenida con **Prometheus** y **Grafana** mediante `docker-compose.yml` para observar la salud, el uso de recursos y las métricas de negocio del microservicio en tiempo real.

### Características del Sistema de Métricas:
* **Métricas por Defecto**: Integración con `prom-client` en `app.js` para recolectar el uso de CPU (`process_cpu_user_seconds_total`), uso de memoria (`process_resident_memory_bytes`), retardo de event-loop, etc.
* **Métricas de Tráfico y Errores**: Middleware de Express que registra la cantidad total de peticiones procesadas clasificadas por método HTTP, ruta y código de estado (`http_requests_total`). Esto permite medir la tasa de errores (5xx) y la disponibilidad.
* **Métricas de CI/CD Integradas**: El pipeline calcula la duración del despliegue (build time) y extrae el porcentaje de cobertura de pruebas unitarias desde Jest (`coverage/coverage-summary.json`), guardándolos en `metadata.json`. El microservicio carga esta metadata al iniciar y expone estas métricas como medidores de Prometheus (`app_test_coverage_percent` y `app_deployment_duration_seconds`).

### Dashboard de Grafana Auto-provisionado:
El servicio de Grafana se configuró con **aprovisionamiento automático (Grafana Provisioning)**. Al levantar el stack, Grafana carga automáticamente el origen de datos de Prometheus y el dashboard `DevOps Microservice Monitoring` ubicado en `monitoring/grafana/dashboards/main-dashboard.json`.
El panel principal muestra:
1. **API Status (Availability)**: Muestra en verde `UP` o en rojo `DOWN` la disponibilidad de la API basándose en la métrica `up`.
2. **CI/CD Test Coverage**: Muestra el porcentaje de cobertura de la última integración.
3. **CI/CD Deployment Duration**: Tiempo en segundos que duró la ejecución del pipeline.
4. **HTTP Error Rate**: Cantidad de respuestas de error 5xx por segundo.
5. **HTTP Request Volume (Rate)**: Gráfico de series de tiempo del tráfico entrante agrupado por estado y ruta.
6. **CPU Usage & Memory Usage**: Visualizaciones dinámicas del consumo de recursos del contenedor.

Para probarlo localmente:
```bash
docker compose up -d --build
```
* Acceder al microservicio: `http://localhost:8080/`
* Acceder a las métricas raw de Prometheus: `http://localhost:8080/metrics`
* Acceder al Dashboard de Grafana: `http://localhost:3000` (Usuario: `admin`, Clave: `admin`)

---

## 2. Despliegue en AWS con Docker Compose (IE2 / Opciones de Evidencia)

De acuerdo con las nuevas instrucciones, la tecnología de Kubernetes queda descartada. En su lugar, se utiliza **Docker Compose** para orquestar los microservicios tanto en ambientes locales como desplegados en la nube de **Amazon Web Services (AWS)**.

### Opción A: Evidencia Detallada en el Repositorio

A continuación se adjuntan las capturas de pantalla que evidencian el correcto funcionamiento de todos los componentes de la entrega:

#### 1. Panel de Control (Dashboard) de Monitoreo en Grafana
Se observa el estado **UP**, la cobertura de código cargada y los gráficos de consumo de CPU/Memoria activos:
![Dashboard Grafana](./img/Screenshot%202026-06-27%20at%2009-31-10%20DevOps%20Microservice%20Monitoring%20-%20Dashboards%20-%20Grafana.png)

#### 2. Visualización de Métricas de la Aplicación en Prometheus
Métricas raw expuestas en el endpoint `/metrics`:
![Métricas en Prometheus](./img/Screenshot%202026-06-23%20at%2016-23-26%20.png)

#### 3. Endpoint de Salud (Health Check) del Microservicio
Respuesta JSON `{"status":"UP"}` en el navegador:
![Endpoint de Salud](./img/Screenshot%202026-06-23%20at%2016-23-07%20.png)

#### 4. Ejecución y Reporte de Pruebas Unitarias de Jest
Verificación en terminal de las pruebas aprobadas y el reporte con **86.04%** de cobertura:
![Ejecución Pruebas](./img/Screenshot%202026-06-23%20161857.png)

#### 5. Auditoría de Calidad Aprobada (Quality Gate)
Mensaje de éxito del validador de cobertura al pasar el Quality Gate del 80%:
![Quality Gate Auditoría](./img/Screenshot%202026-06-23%20162020.png)

#### 6. Contenedores Iniciados y Activos en Docker Compose
Inicio del stack de monitoreo y microservicio:
![Docker Compose Up](./img/Screenshot%202026-06-23%20162055.png)

#### 7. Orquestación y Estado Saludable de los Contenedores
Visualización de `docker ps` mostrando el contenedor de la API con estado **`(healthy)`** activo:
![Docker PS Healthy](./img/Screenshot%202026-06-23%20162220.png)

### Opción C: Recreación del Ambiente en Cuenta AWS Propia (EC2)
A continuación, se detallan las instrucciones paso a paso para levantar este ambiente en un servidor **AWS EC2**:

1. **Crear una Instancia EC2**:
   * Lanzar una instancia EC2 en la consola de AWS (se recomienda usar la AMI oficial de **Ubuntu 24.04 LTS** en un tipo de instancia `t2.micro` o `t3.micro`).
   * Asociar o crear un par de llaves SSH para permitir la conexión al servidor.

2. **Configurar el Grupo de Seguridad (Security Group)**:
   * Configurar las reglas de entrada del Security Group asociado a la instancia para permitir el tráfico en los siguientes puertos:
     * **Puerto 22 (TCP)**: Acceso SSH.
     * **Puerto 8080 (TCP)**: Puerto de acceso a la API del Microservicio.
     * **Puerto 3000 (TCP)**: Acceso a la interfaz web de Grafana.
     * **Puerto 9090 (TCP)**: Acceso (opcional) a la interfaz web de Prometheus.

3. **Conectarse al Servidor e Instalar Docker / Docker Compose**:
   * Conectarse vía SSH a la instancia:
     ```bash
     ssh -i "su-llave.pem" ubuntu@<IP_PUBLICA_AWS>
     ```
   * Actualizar los paquetes e instalar Docker y Docker Compose:
     ```bash
     sudo apt-get update
     sudo apt-get install -y docker.io docker-compose
     # Iniciar y habilitar el servicio de docker
     sudo systemctl start docker
     sudo systemctl enable docker
     # Agregar al usuario ubuntu al grupo docker para correr comandos sin sudo
     sudo usermod -aG docker ubuntu
     ```
   * Cerrar la sesión SSH y volver a ingresar para aplicar los permisos de grupo.

4. **Clonar el Repositorio y Levantar la Aplicación**:
   * Clone este repositorio en la instancia de EC2:
     ```bash
     git clone https://github.com/matiman-gangsta/DevOps_EP3.git
     cd DevOps_EP3
     ```
   * Inicie el stack completo de servicios en segundo plano:
     ```bash
     docker compose up -d --build
     ```
   * Verifique que los contenedores estén arriba y en estado saludable:
     ```bash
     docker ps
     ```

5. **Acceder a los Servicios**:
   * Acceso a la API: `http://<IP_PUBLICA_AWS>:8080/`
   * Acceso a Grafana: `http://<IP_PUBLICA_AWS>:3000/`

---

## 3. Políticas de Cumplimiento y Fail-Fast (IE4, IE5, IE6)

La integridad y seguridad del código en las ramas principales se protegen mediante políticas automatizadas integradas en el flujo de CI/CD:

### Políticas de Branch Protection (GitHub):
1. **Pull Requests Requeridos**: No se permite el push directo a `develop` o `main`. Todo cambio debe provenir de un Pull Request (PR).
2. **Status Checks Obligatorios**: El pipeline de GitHub Actions debe ejecutarse y finalizar con éxito antes de permitir el merge.

### Auditoría de Calidad Automática (Quality Gate):
Se diseñó el script `scripts/compliance-check.js` para actuar como el "Quality Gate" del pipeline. Este script analiza el archivo JSON de resumen de cobertura de pruebas de Jest (`coverage/coverage-summary.json`):
* Si la cobertura de líneas es **menor al 80%**, el script imprime los detalles en consola y aborta con código de salida `1`.
* Esto provoca que el paso `Auditoría de Cumplimiento` en GitHub Actions falle de inmediato, bloqueando el merge del PR (Estrategia **Fail-Fast**).

### Demostración de Bloqueo por Fallas de Calidad (Fail-Fast Demo):
Si se intenta introducir un cambio que reduzca la cobertura (por ejemplo, al añadir funciones sin sus correspondientes pruebas en `app.js` o al configurar un umbral mayor), se produce el siguiente comportamiento:
1. Durante la acción `npm test`, se genera el archivo `coverage-summary.json` indicando la reducción de la cobertura.
2. En la acción `Auditoría de Cumplimiento`, el script detecta que la cobertura no cumple el umbral mínimo del 80%:
   ```text
   === Iniciando Auditoría de Cumplimiento (Compliance Quality Gate) ===
   - Cobertura de Líneas: 62.79% (Mínimo requerido: 80%)
   ...
   [FALLA DE CALIDAD] La cobertura de líneas (62.79%) es menor al umbral mínimo requerido (80%).
   El pipeline de CI/CD se detendrá de inmediato.
   ```
3. El pipeline finaliza con error y el cambio es rechazado, impidiendo que llegue a producción código sin pruebas suficientes.
4. Del mismo modo, si **Snyk** detecta alguna vulnerabilidad crítica/alta en las librerías instaladas, su paso fallará e interrumpirá el pipeline antes de que se pueda compilar la imagen Docker definitiva.

---

## 4. Accesos, Enlaces y Credenciales Requeridos

### Acceso a la Plataforma de Monitoreo
* **Grafana URL**: `http://localhost:3000` (o `http://<IP_PUBLICA_AWS>:3000` si está en la nube).
* **Usuario**: `admin`
* **Contraseña**: `admin`