import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShopHeader } from './ShopHeader';

export const TerminosEcommerce = ({ cart, user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <ShopHeader 
        cart={cart} 
        user={user} 
        onLoginClick={onLoginClick} 
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="tracking-[0.1em] uppercase">Volver</span>
        </button>

        <div className="bg-white p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-light text-gray-900 mb-2">
            TÉRMINOS Y CONDICIONES
          </h1>
          <p className="text-sm text-gray-500 mb-8">ECOMMERCE AVENUE</p>
          <p className="text-xs text-gray-400 mb-8">Última actualización: 03/01/2026</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <p>
              Estos Términos y Condiciones (los "T&C") regulan el acceso, navegación, registro y compras realizadas a través del Ecommerce disponible en el sitio web de AVENUE (el "Sitio"), y la relación contractual entre el usuario/consumidor (el "Usuario") y el proveedor/vendedor (según corresponda). Este Sitio y las operaciones celebradas por medios electrónicos se encuentran amparados por la normativa paraguaya aplicable al comercio electrónico.
            </p>
            <p>
              Al ingresar, registrarse o comprar en el Sitio, el Usuario declara haber leído, entendido y aceptado estos T&C y la Política de Privacidad.
            </p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">1) Identificación del proveedor</h2>
            <ul className="list-none space-y-1">
              <li><strong>Razón social:</strong> AVENUE MALL EAS</li>
              <li><strong>RUC:</strong> 80152251-0</li>
              <li><strong>Domicilio:</strong> Paseo Los Árboles, Avenida San Martín entre Sucre y Moisés Bertoni, Asunción, Paraguay</li>
              <li><strong>Contacto:</strong> WhatsApp 0973666000 | Email avenuepy@gmail.com</li>
            </ul>

            <h2 className="text-lg font-medium text-gray-900 mt-8">2) Definiciones</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Sitio:</strong> plataforma web de AVENUE donde se exhiben productos y se procesan compras.</li>
              <li><strong>Producto/s:</strong> bienes ofrecidos en el Ecommerce.</li>
              <li><strong>Pedido:</strong> solicitud de compra realizada por el Usuario.</li>
              <li><strong>Pedido confirmado:</strong> pedido cuyo pago fue aprobado y confirmado (y/o validado por controles antifraude) y fue aceptado por el sistema.</li>
              <li><strong>Pasarela de pago:</strong> proveedor que procesa pagos, según lo informado en el checkout.</li>
              <li><strong>Entrega:</strong> puesta del producto a disposición del Usuario (delivery o retiro en tienda).</li>
              <li><strong>Vendedor:</strong> AVENUE MALL EAS, salvo indicación expresa en la ficha del producto.</li>
            </ul>

            <h2 className="text-lg font-medium text-gray-900 mt-8">3) Alcance y rol de AVENUE frente a productos de marcas</h2>
            <p>
              El Sitio puede exhibir productos de distintas marcas. Regla general: el vendedor y responsable de la operación frente al consumidor es AVENUE MALL EAS, salvo que en la ficha del producto se indique expresamente un "vendido por tercero" con identificación del responsable.
            </p>
            <p>
              Cuando un producto indique expresamente "vendido por tercero", se informará quién es el vendedor/encargado del despacho/garantía; sin perjuicio de que AVENUE pueda facilitar el canal de contacto y gestión operativa.
            </p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">4) Capacidad para contratar y uso permitido</h2>
            <p>4.1. El Usuario declara ser mayor de edad y contar con capacidad legal para contratar.</p>
            <p>4.2. Está prohibido usar el Sitio para fines ilícitos, fraudulentos o que afecten su seguridad.</p>
            <p>4.3. AVENUE podrá bloquear o suspender accesos ante indicios razonables de fraude o abuso.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">5) Registro, cuenta y seguridad</h2>
            <p>5.1. El Usuario puede comprar como invitado o crear una cuenta.</p>
            <p>5.2. El Usuario es responsable por la veracidad de sus datos y el resguardo de sus credenciales.</p>
            <p>5.3. AVENUE puede requerir verificaciones adicionales antes de confirmar un pedido.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">6) Información de productos, precios y disponibilidad</h2>
            <p>6.1. Fotos, colores y descripciones son referenciales; pueden existir variaciones razonables.</p>
            <p>6.2. Stock está sujeto a disponibilidad.</p>
            <p>6.3. Si por error técnico se publica un precio/condición manifiestamente irreal, AVENUE podrá rechazar o anular el pedido, ofreciendo reembolso íntegro si hubiera cobro.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">7) Promociones, cupones y campañas</h2>
            <p>7.1. Las promociones pueden tener vigencia, cupos, condiciones y exclusiones informadas en el Sitio.</p>
            <p>7.2. Cupones/descuentos pueden no ser acumulables y pueden limitarse por usuario y/o por pedido.</p>
            <p>7.3. AVENUE podrá anular beneficios si detecta uso fraudulento, automatizado o abusivo.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">8) Proceso de compra y formación del contrato electrónico</h2>
            <p>8.1. El proceso típico incluye: selección → carrito → datos de entrega/facturación → elección de envío/retiro → elección de pago → confirmación.</p>
            <p>8.2. El pedido queda confirmado cuando el pago resulta aprobado y el sistema lo registra como "confirmado/pagado".</p>
            <p>8.3. AVENUE puede rechazar pedidos ante: pago no aprobado, inconsistencias de identidad/dirección, o indicios razonables de fraude.</p>
            <p>8.4. Los registros electrónicos constituyen evidencia de la transacción.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">9) Medios de pago, seguridad y reversas</h2>
            <p>9.1. Los medios de pago disponibles se informan en el checkout.</p>
            <p>9.2. AVENUE no almacena datos completos de tarjeta; el procesamiento lo realiza la pasarela de pago correspondiente.</p>
            <p>9.3. En caso de contracargos o pagos disputados, AVENUE podrá suspender el despacho/entrega o gestionar la recuperación del bien.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">10) Facturación y datos fiscales</h2>
            <p>10.1. El Usuario debe cargar datos correctos para facturación (nombre/razón social, RUC, etc.).</p>
            <p>10.2. Si el Usuario ingresó datos erróneos, AVENUE podrá requerir rectificación.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">11) Envíos, delivery y retiro en tienda</h2>
            <h3 className="text-base font-medium text-gray-800 mt-4">11.1 Delivery</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cobertura, costo y plazos se informan antes de finalizar la compra.</li>
              <li>Plazos estimados pueden variar por logística, clima, alta demanda o fuerza mayor.</li>
              <li>El Usuario es responsable de cargar dirección completa y referencias.</li>
            </ul>
            
            <h3 className="text-base font-medium text-gray-800 mt-4">11.2 Retiro en tienda (Paseo Los Árboles)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Para retirar, se podrá solicitar cédula y/o número de pedido.</li>
              <li>Si retira un tercero, AVENUE podrá requerir autorización simple.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-800 mt-4">11.3 Verificación al recibir</h3>
            <p>Se recomienda al Usuario revisar el paquete al momento de la entrega/retiro.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">12) Política comercial de cambios y devoluciones (7 días)</h2>
            <p><strong>12.1 Plazo:</strong> El Usuario puede solicitar cambio o devolución dentro de 7 días corridos desde la recepción del producto.</p>
            <p><strong>12.2 Condiciones:</strong> El producto debe estar sin uso, en condiciones originales, conservar etiquetas y empaque.</p>
            <p><strong>12.3 Restricciones por higiene:</strong> Cosméticos/perfumería abiertos o usados, productos de cuidado personal abiertos no tienen cambio ni devolución comercial.</p>
            <p><strong>12.4 Liquidaciones:</strong> Los productos marcados como "Liquidación final" podrán excluirse de la devolución/cambio comercial por arrepentimiento.</p>
            <p><strong>12.5 Costos:</strong> Cambio por gusto del Usuario: costos a cargo del Usuario. Error de AVENUE o producto defectuoso: AVENUE asume costos.</p>
            <p><strong>12.6 Procedimiento:</strong> Contactar por WhatsApp 0973666000 o email avenuepy@gmail.com.</p>
            <p><strong>12.7 Reembolsos:</strong> Se procesará por el mismo medio de pago cuando sea posible.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">13) Derecho de retracto del consumidor (7 días)</h2>
            <p>La Ley 1334/98 reconoce el derecho de retracto dentro de 7 días. Para ejercerlo, el Usuario debe notificarlo dentro del plazo legal y devolver el producto en condiciones compatibles.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">14) Garantías, fallas y productos defectuosos</h2>
            <p>Si el producto presenta defectos de fabricación o no corresponde con lo adquirido, el Usuario podrá reclamar por los canales oficiales. AVENUE evaluará y gestionará una solución razonable.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">15) Atención al cliente y reclamos</h2>
            <p><strong>Canales oficiales:</strong> WhatsApp 0973666000 | avenuepy@gmail.com</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">16) Comunicaciones electrónicas</h2>
            <p>El Usuario acepta que las comunicaciones relacionadas con su compra se realicen por medios electrónicos (email/WhatsApp).</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">17) Protección de datos personales</h2>
            <p>AVENUE trata datos personales conforme a la normativa paraguaya aplicable, incluida la Ley N° 7593/2025.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">18) Propiedad intelectual</h2>
            <p>Las marcas, logos, textos, imágenes, diseño y demás contenidos del Sitio pertenecen a AVENUE o a sus licenciantes. Queda prohibida su reproducción o uso sin autorización.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">19) Limitación de responsabilidad</h2>
            <p>19.1. AVENUE no será responsable por fallas o demoras derivadas de terceros fuera de control razonable ni por fuerza mayor.</p>
            <p>19.2. Nada en estos T&C limita derechos irrenunciables del consumidor.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">20) Fuerza mayor</h2>
            <p>AVENUE no responderá por incumplimientos causados por eventos imprevisibles o inevitables.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">21) Modificaciones de los T&C</h2>
            <p>AVENUE podrá actualizar estos T&C. Los cambios rigen desde su publicación.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">22) Ley aplicable y jurisdicción</h2>
            <p>Estos T&C se rigen por las leyes de la República del Paraguay, incluyendo la Ley N° 4868/2013.</p>
            <p><strong>Jurisdicción:</strong> tribunales competentes de Asunción, Paraguay.</p>

            <h2 className="text-lg font-medium text-gray-900 mt-8">23) Cláusulas finales</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Divisibilidad:</strong> si alguna cláusula es inválida, las restantes mantienen vigencia.</li>
              <li><strong>No renuncia:</strong> la falta de ejercicio de un derecho no implica renuncia.</li>
              <li><strong>Integridad:</strong> estos T&C junto con la Política de Privacidad constituyen el acuerdo aplicable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminosEcommerce;
