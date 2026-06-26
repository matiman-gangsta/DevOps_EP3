# 1. Imagen base ligera y segura
FROM node:20-alpine

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar solo los archivos de dependencias primero (optimiza el caché de Docker)
COPY package*.json ./

# 4. Instalar dependencias
RUN npm install

# 5. Copiar el resto del código fuente
COPY . .

# 6. Exponer el puerto
EXPOSE 8080

# 7. Comando de ejecución
CMD ["npm", "start"]