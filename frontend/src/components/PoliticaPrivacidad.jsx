import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PoliticaPrivacidad = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="tracking-[0.1em] uppercase">Volver</span>
        </button>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-light text-white mb-2">
            POLÍTICA DE PRIVACIDAD Y COOKIES
          </h1>
          <p className="text-[#d4a968] mb-2">AVENUE</p>
          <p className="text-xs text-gray-500 mb-8">Última actualización: 03/01/2026</p>

          <div className="prose prose-sm prose-invert max-w-none text-gray-300 space-y-6">
            <p>
              Esta Política describe cómo AVENUE MALL EAS ("AVENUE", "nosotros") recolecta, usa, comparte y protege los datos personales de las personas físicas que interactúan con nuestro sitio web, formularios, Ecommerce y funcionalidades relacionadas (cuentas, compras, atención al cliente, etc.).
            </p>
            <p>
              AVENUE se compromete a tratar los datos personales conforme a la Ley N° 7593/2025 de Protección de Datos Personales en la República del Paraguay y demás normativa aplicable.
            </p>

            <h2 className="text-lg font-medium text-white mt-8">1) Responsable del tratamiento</h2>
            <ul className="list-none space-y-1 text-gray-400">
              <li><strong className="text-gray-300">Responsable:</strong> AVENUE MALL EAS</li>
              <li><strong className="text-gray-300">RUC:</strong> 80152251-0</li>
              <li><strong className="text-gray-300">Domicilio:</strong> Paseo Los Árboles, Avenida San Martín entre Sucre y Moisés Bertoni, Asunción, Paraguay</li>
              <li><strong className="text-gray-300">Contacto general:</strong> WhatsApp 0973666000 | Email: avenuepy@gmail.com</li>
              <li><strong className="text-gray-300">Contacto de privacidad:</strong> avenuepy@gmail.com (Asunto: "Privacidad – Solicitud de datos")</li>
            </ul>

            <h2 className="text-lg font-medium text-white mt-8">2) Alcance (a quiénes aplica)</h2>
            <p>Aplica a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Visitantes del sitio web.</li>
              <li>Usuarios que se registran o inician sesión.</li>
              <li>Compradores del Ecommerce (delivery o retiro en tienda).</li>
              <li>Personas que nos contactan por formularios, email o WhatsApp por consultas/soporte vinculadas al Ecommerce.</li>
            </ul>
            <p>Si en el futuro AVENUE incorpora otras secciones (p. ej., Studio / UGC), esta Política también aplicará a esos tratamientos, salvo que publiquemos un anexo específico.</p>

            <h2 className="text-lg font-medium text-white mt-8">3) Datos personales que podemos recolectar</h2>
            <p>Recolectamos solo datos necesarios para operar el Ecommerce y la atención asociada:</p>
            
            <h3 className="text-base font-medium text-gray-200 mt-4">3.1 Datos de identificación y contacto</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre y apellido</li>
              <li>Número de teléfono (incl. WhatsApp)</li>
              <li>Email</li>
              <li>Dirección de entrega (si aplica)</li>
              <li>Datos para facturación cuando corresponda (nombre/razón social y RUC si el usuario lo proporciona)</li>
            </ul>

            <h3 className="text-base font-medium text-gray-200 mt-4">3.2 Datos de cuenta y autenticación</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email/identificador de cuenta</li>
              <li>Historial básico de acceso (fecha/hora, dispositivo/navegador, IP aproximada)</li>
              <li>Preferencias operativas (por ejemplo, dirección guardada)</li>
            </ul>

            <h3 className="text-base font-medium text-gray-200 mt-4">3.3 Datos de compra y postventa</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Productos comprados, fechas, importes, estado del pedido</li>
              <li>Información de envío/retiro</li>
              <li>Solicitudes de cambio/devolución y comunicaciones asociadas</li>
            </ul>

            <h3 className="text-base font-medium text-gray-200 mt-4">3.4 Datos de pago (importante)</h3>
            <p>AVENUE no almacena datos completos de tarjeta. El pago lo procesa la pasarela de pago y/o el emisor del medio de pago. Nosotros podemos recibir confirmaciones como "pago aprobado/rechazado", referencias de operación y datos mínimos para conciliación y prevención de fraude.</p>

            <h3 className="text-base font-medium text-gray-200 mt-4">3.5 Datos técnicos (uso del sitio)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cookies y tecnologías similares (ver sección 10)</li>
              <li>Eventos básicos de navegación (páginas visitadas, clicks, rendimiento), cuando corresponda y según configuración/consentimiento</li>
            </ul>

            <h2 className="text-lg font-medium text-white mt-8">4) Para qué usamos tus datos (finalidades)</h2>
            <p>Usamos los datos para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Procesar compras y entregas/retiros (confirmación, preparación, logística, coordinación).</li>
              <li>Atención al cliente y soporte (consultas, reclamos, cambios/devoluciones, garantías).</li>
              <li>Gestión de facturación y obligaciones legales (cuando aplique).</li>
              <li>Seguridad y prevención de fraude (validaciones razonables, detección de operaciones anómalas).</li>
              <li>Mejora del servicio (analítica de funcionamiento y rendimiento del sitio, si aplica).</li>
              <li>Comunicaciones operativas (emails/WhatsApp transaccionales: confirmaciones, estado del pedido, coordinaciones).</li>
            </ul>

            <h2 className="text-lg font-medium text-white mt-8">5) Base legal del tratamiento</h2>
            <p>Tratamos datos personales bajo las bases habilitantes previstas por la normativa aplicable, incluyendo:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-gray-200">Ejecución de una relación contractual:</strong> para gestionar tu compra, entrega, postventa.</li>
              <li><strong className="text-gray-200">Cumplimiento de obligaciones legales:</strong> por ejemplo, aspectos de facturación, registros y reclamos.</li>
              <li><strong className="text-gray-200">Interés legítimo:</strong> seguridad del sitio, prevención de fraude, auditoría y mejora operativa (siempre de forma proporcional).</li>
              <li><strong className="text-gray-200">Consentimiento:</strong> para cookies no esenciales y/o comunicaciones promocionales, cuando se habiliten.</li>
            </ul>

            <h2 className="text-lg font-medium text-white mt-8">6) Con quién compartimos datos (destinatarios)</h2>
            <p>Podemos compartir datos únicamente cuando sea necesario para prestar el servicio o cumplir obligaciones:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-gray-200">Proveedores de pago</strong> (pasarela / procesadores / bancos): para procesar pagos, prevención de fraude y conciliación.</li>
              <li><strong className="text-gray-200">Logística / delivery</strong> (si aplica): para realizar entregas. Se comparten datos mínimos (nombre, teléfono, dirección).</li>
              <li><strong className="text-gray-200">Proveedores tecnológicos:</strong> hosting, herramientas de correo transaccional, sistemas de gestión (ERP/inventario) y soporte.</li>
              <li><strong className="text-gray-200">Autoridades públicas:</strong> cuando exista requerimiento legal válido o sea necesario para cumplimiento normativo.</li>
            </ul>
            <p className="font-medium text-white">AVENUE no vende datos personales.</p>

            <h2 className="text-lg font-medium text-white mt-8">7) Transferencias internacionales</h2>
            <p>Es posible que algunos proveedores tecnológicos (hosting, email, analítica) traten datos desde servidores ubicados fuera de Paraguay. En esos casos, AVENUE adopta medidas razonables para que el tratamiento se realice con estándares de seguridad y confidencialidad apropiados, conforme a la normativa aplicable.</p>

            <h2 className="text-lg font-medium text-white mt-8">8) Conservación (cuánto tiempo guardamos los datos)</h2>
            <p>Conservamos los datos por el tiempo necesario para las finalidades indicadas:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-gray-200">Datos de cuenta:</strong> mientras la cuenta esté activa o hasta que solicites su eliminación, salvo obligación legal de conservar ciertos registros.</li>
              <li><strong className="text-gray-200">Datos de compras:</strong> durante el tiempo necesario para cumplir obligaciones legales, atender reclamos, devoluciones/garantías y auditoría.</li>
              <li><strong className="text-gray-200">Datos de soporte/comunicaciones:</strong> el tiempo razonable para trazabilidad y resolución de reclamos.</li>
            </ul>
            <p>Luego, eliminamos o anonimizamos los datos de manera razonable y segura, salvo obligación legal o necesidad legítima de conservación.</p>

            <h2 className="text-lg font-medium text-white mt-8">9) Seguridad de la información</h2>
            <p>Aplicamos medidas de seguridad razonables acordes al tipo de datos y riesgo, tales como:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Controles de acceso por roles en el panel admin</li>
              <li>Autenticación reforzada donde corresponda</li>
              <li>Resguardo de credenciales y secretos</li>
              <li>Monitoreo y medidas antifraude</li>
              <li>Prácticas de minimización (solo datos necesarios)</li>
            </ul>
            <p>Aun así, ningún sistema es 100% invulnerable. Si ocurriera un incidente relevante, AVENUE tomará medidas de contención y comunicación conforme a la normativa aplicable.</p>

            <h2 className="text-lg font-medium text-white mt-8">10) Cookies y tecnologías similares</h2>
            <p>El sitio puede utilizar cookies/tecnologías similares para:</p>
            
            <h3 className="text-base font-medium text-gray-200 mt-4">10.1 Cookies necesarias (siempre activas)</h3>
            <p>Permiten funciones esenciales: seguridad, sesión, carrito, navegación básica. Sin estas, el Ecommerce puede no funcionar correctamente.</p>

            <h3 className="text-base font-medium text-gray-200 mt-4">10.2 Cookies analíticas (opcionales)</h3>
            <p>Sirven para entender uso y rendimiento (por ejemplo, métricas de tráfico). Se habilitan solo si el usuario las acepta cuando el banner de cookies esté activo.</p>

            <h3 className="text-base font-medium text-gray-200 mt-4">10.3 Cookies de marketing (opcionales)</h3>
            <p>Sirven para medir campañas y audiencias (por ejemplo, píxeles publicitarios). Se habilitan solo si el usuario las acepta cuando el banner esté activo.</p>

            <p><strong className="text-gray-200">Control:</strong> cuando el banner esté implementado, podrás aceptar, rechazar o configurar cookies no esenciales. Además, siempre podés gestionar cookies desde tu navegador.</p>

            <h2 className="text-lg font-medium text-white mt-8">11) Derechos de las personas titulares de datos</h2>
            <p>De acuerdo con la Ley 7593/2025, el titular puede ejercer, según corresponda, derechos como:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acceso (saber qué datos tenemos)</li>
              <li>Rectificación/actualización</li>
              <li>Supresión (cuando corresponda)</li>
              <li>Oposición</li>
              <li>Y otros previstos por la normativa</li>
            </ul>

            <h3 className="text-base font-medium text-gray-200 mt-4">11.1 Cómo ejercerlos</h3>
            <p>Enviá un email a avenuepy@gmail.com con asunto: "Privacidad – Solicitud de datos", e incluí:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre y apellido</li>
              <li>Email/teléfono asociado a la compra/cuenta</li>
              <li>Tipo de solicitud (acceso, rectificación, supresión, etc.)</li>
              <li>Información adicional para ubicar tu registro (por ejemplo, número de pedido si aplica)</li>
            </ul>
            <p>Podremos solicitar una verificación razonable de identidad para proteger tus datos.</p>

            <h3 className="text-base font-medium text-gray-200 mt-4">11.2 Plazos de respuesta</h3>
            <p>Responderemos dentro de los plazos previstos por la normativa aplicable y, normalmente, dentro de 15 días hábiles, salvo casos complejos o volúmenes elevados que requieran extensión razonable.</p>

            <h2 className="text-lg font-medium text-white mt-8">12) Comunicaciones</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-gray-200">Transaccionales (operativas):</strong> confirmaciones de compra, estado del pedido, coordinación de entrega/retiro, postventa. Se envían por necesidad operativa.</li>
              <li><strong className="text-gray-200">Promocionales:</strong> si en el futuro habilitamos comunicaciones promocionales, se enviarán solo con base legal válida (por ejemplo, consentimiento) y siempre con opción de baja.</li>
            </ul>

            <h2 className="text-lg font-medium text-white mt-8">13) Menores de edad</h2>
            <p>El Ecommerce no está dirigido a menores de edad. Si detectamos tratamiento de datos de menores sin autorización adecuada, podremos eliminar esos datos o requerir verificación de representación legal.</p>

            <h2 className="text-lg font-medium text-white mt-8">14) Enlaces a sitios de terceros</h2>
            <p>El Sitio puede incluir enlaces a redes sociales o sitios de terceros. AVENUE no controla sus prácticas de privacidad; el Usuario debe revisar las políticas de esos terceros.</p>

            <h2 className="text-lg font-medium text-white mt-8">15) Cambios a esta Política</h2>
            <p>Podemos actualizar esta Política para reflejar mejoras operativas o cambios legales. La versión vigente será la publicada en el Sitio con su fecha de "Última actualización".</p>

            <h2 className="text-lg font-medium text-white mt-8">16) Contacto</h2>
            <ul className="list-none space-y-1 text-gray-400">
              <li><strong className="text-gray-300">AVENUE MALL EAS</strong></li>
              <li>Paseo Los Árboles, Av. San Martín entre Sucre y Moisés Bertoni, Asunción, Paraguay</li>
              <li>WhatsApp: 0973666000</li>
              <li>Email: avenuepy@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidad;
