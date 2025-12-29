# Guía de Configuración - Avenue Landing Page

## ✅ Completado

- Landing page multiidioma (ES, EN, PT, DE, FR)
- Diseño editorial fashion con paleta beige/nude, negro y dorado
- Logos reales de Avenue integrados
- Imágenes fashion/editorial de alta calidad
- Formularios WhatsApp integrados
- Google Maps integrado
- Diseño responsive (desktop y mobile)
- Arquitectura neoclásica reflejada en el diseño

---

## 📍 Google Maps - Configurar Ubicación Exacta

**Paso 1: Obtener coordenadas exactas de Avenue**
1. Ve a Google Maps: https://www.google.com/maps
2. Busca "Paseo Los Árboles, Av. San Martín, Asunción"
3. Click derecho en la ubicación exacta de tu tienda
4. Selecciona "¿Qué hay aquí?"
5. Copia las coordenadas que aparecen (ejemplo: -25.286523, -57.587645)

**Paso 2: Actualizar el código**
En el archivo `/app/frontend/src/components/Location.jsx`, busca esta línea:

```javascript
src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.1234567890!2d-57.5876!3d-25.2865!..."
```

Reemplázala con:
1. Ve a Google Maps
2. Busca tu ubicación exacta
3. Click en "Compartir" → "Insertar un mapa"
4. Copia el código iframe
5. Extrae solo la URL del `src=""` y reemplázala

---

## 📊 Google Analytics - Configuración

**Paso 1: Crear cuenta de Google Analytics**
1. Ve a https://analytics.google.com
2. Click en "Comenzar a medir"
3. Nombre de cuenta: "Avenue Paraguay"
4. Nombre de propiedad: "Avenue Landing Page"
5. Sector: "Retail" / "Comercio minorista"
6. Zona horaria: "Asunción" (GMT-4)

**Paso 2: Obtener ID de medición**
Después de crear, obtendrás un ID como: `G-XXXXXXXXXX`

**Paso 3: Actualizar el código**
En el archivo `/app/frontend/public/index.html`, busca:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Reemplaza ambos `G-XXXXXXXXXX` con tu ID real.

**Paso 4: Verificar instalación**
1. Abre tu sitio en el navegador
2. Abre las herramientas de desarrollo (F12)
3. Ve a la pestaña "Red" / "Network"
4. Busca requests a "google-analytics.com"
5. También puedes instalar "Google Analytics Debugger" (extensión de Chrome)

---

## 🌐 Configuración del Dominio avenue.com.py

### Opción 1: Usando Max Dominios (Hosting incluido)

**Si contrataste hosting con Max Dominios:**

1. **Accede al panel de Max Dominios**
   - Usuario y contraseña que te dieron al comprar

2. **Sube los archivos a tu hosting:**
   
   **Paso A: Generar build de producción**
   ```bash
   cd /app/frontend
   yarn build
   ```
   
   **Paso B: Subir archivos**
   - Conecta por FTP/cPanel
   - Sube todo el contenido de `/app/frontend/build` a la carpeta `public_html` o `www`

3. **Configurar .htaccess (para SPA)**
   Crea archivo `.htaccess` en la raíz:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Opción 2: Usando Emergent (Hosting Automático) - RECOMENDADO

**Si quieres usar el hosting de Emergent (más simple):**

1. **En tu panel de Max Dominios:**
   - Ve a "Gestión DNS" o "DNS Management"
   - Busca avenue.com.py
   
2. **Agrega estos registros DNS:**
   
   **Registro A:**
   ```
   Tipo: A
   Nombre: @
   Valor: [IP_DE_EMERGENT]
   TTL: 3600
   ```
   
   **Registro CNAME (para www):**
   ```
   Tipo: CNAME
   Nombre: www
   Valor: avenue.com.py
   TTL: 3600
   ```

3. **Obtener IP de Emergent:**
   - Contacta soporte de Emergent o
   - Ve al panel de Emergent → Settings → Custom Domain
   - Te darán la IP específica para tu proyecto

4. **Espera propagación DNS:**
   - Puede tomar 24-48 horas
   - Verifica en: https://dnschecker.org

5. **Configurar en Emergent:**
   - Panel de Emergent → Settings
   - Agregar dominio personalizado: `avenue.com.py`
   - Marcar "Enable HTTPS" (SSL automático)

---

## 🔧 Comandos Útiles

**Ver logs del frontend:**
```bash
tail -f /var/log/supervisor/frontend.out.log
```

**Reiniciar servicios:**
```bash
sudo supervisorctl restart frontend
```

**Generar build de producción:**
```bash
cd /app/frontend
yarn build
```

---

## 📝 Próximos Pasos Sugeridos

1. ✅ Reemplazar coordenadas de Google Maps con ubicación exacta
2. ✅ Configurar Google Analytics con ID real
3. ✅ Configurar DNS del dominio avenue.com.py
4. 📸 Reemplazar imágenes stock por fotos reales de Avenue:
   - Logo/Isologo ya integrados ✅
   - Fotos de la tienda física
   - Fotos de productos
   - Fotos del espacio interior mostrando molduras neoclásicas
5. 🎨 Ajustes finales de diseño si es necesario
6. 📱 Pruebas en dispositivos móviles reales

---

## 💡 Notas Importantes

- **No hay backend** necesario para esta landing page (todo funciona con WhatsApp)
- Las imágenes fashion actuales son placeholders de alta calidad
- El mapa funciona pero usa coordenadas aproximadas
- Google Analytics requiere tu ID específico para funcionar
- La paleta de colores sigue tu especificación: 70% beige/nude, 20% negro, 10% dorado

---

## 🆘 Soporte

Si necesitas ayuda con:
- **Configuración DNS**: Contacta soporte de Max Dominios
- **Google Analytics**: support@google.com o ayuda en analytics.google.com
- **Emergent Hosting**: Soporte de Emergent

---

**¡Tu landing page de Avenue está lista para lanzar! 🎉**
