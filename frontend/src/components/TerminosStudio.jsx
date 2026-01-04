import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TerminosStudio = () => {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link 
          to="/studio/reservar" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm tracking-[0.1em] uppercase">Volver</span>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-3xl md:text-4xl font-light text-white mb-2">
            TÉRMINOS Y CONDICIONES
          </h1>
          <p className="text-[#d4a968] text-lg mb-2">USO DEL ESTUDIO (AVENUE STUDIO)</p>
          <p className="text-gray-500 text-sm mb-8">Última actualización: 03/01/2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <p>
              Estos Términos y Condiciones (los "T&C Studio") regulan la reserva y el uso del estudio de producción operado por AVENUE MALL EAS bajo la marca AVENUE STUDIO (el "Studio"), incluyendo la contratación realizada por medios electrónicos cuando aplique.
            </p>
            <p>
              Al reservar, pagar, ingresar al Studio o utilizar cualquiera de sus instalaciones, el cliente/usuario (el "Cliente") declara haber leído y aceptado estos T&C Studio y la Política de Privacidad.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1) Identificación del proveedor</h2>
            <ul className="list-none space-y-1">
              <li><strong className="text-[#d4a968]">Razón social:</strong> AVENUE MALL EAS</li>
              <li><strong className="text-[#d4a968]">RUC:</strong> 80152251-0</li>
              <li><strong className="text-[#d4a968]">Domicilio:</strong> Paseo Los Árboles, Avenida San Martín entre Sucre y Moisés Bertoni, Asunción, Paraguay</li>
              <li><strong className="text-[#d4a968]">Contacto:</strong> WhatsApp 0973666000 | Email avenuepy@gmail.com</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2) Definiciones</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Studio:</strong> instalaciones y/o sets disponibles para alquiler en AVENUE STUDIO.</li>
              <li><strong className="text-white">Reserva:</strong> bloqueo de un horario/turno para uso del Studio.</li>
              <li><strong className="text-white">Turno:</strong> franja horaria reservada (hora de inicio y final).</li>
              <li><strong className="text-white">Cliente:</strong> persona física o jurídica que reserva y paga.</li>
              <li><strong className="text-white">Participantes:</strong> toda persona que ingresa al Studio bajo responsabilidad del Cliente (equipo, modelos, maquilladores, etc.).</li>
              <li><strong className="text-white">Equipamiento:</strong> elementos del Studio disponibles para uso (si se ofrecen) según lo informado para cada turno/paquete.</li>
              <li><strong className="text-white">Servicios adicionales:</strong> asistencia técnica, edición, props especiales, etc., solo si se contratan expresamente.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3) Alcance del servicio</h2>
            <p><strong>3.1. Objeto:</strong> AVENUE ofrece el alquiler temporal del espacio y, cuando corresponda, el acceso a equipamiento según lo publicado en el Sitio/paquete seleccionado.</p>
            <p><strong>3.2. Qué incluye:</strong> el uso del espacio durante el Turno reservado y el acceso a las áreas autorizadas.</p>
            <p><strong>3.3. Qué NO incluye (salvo contratación expresa):</strong> dirección creativa, operador de cámara, iluminación asistida, maquillaje, estilismo, modelos, edición, transporte, catering, utilería específica, ni cualquier servicio no indicado como incluido.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4) Reserva, confirmación y prioridad</h2>
            <p><strong>4.1.</strong> Las reservas se gestionan por el sistema de turnos del Sitio y/o por confirmación directa por los canales oficiales.</p>
            <p><strong>4.2. Confirmación:</strong> una Reserva se considera confirmada únicamente cuando:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>el pago correspondiente fue acreditado y aprobado, y</li>
              <li>el sistema la registra como confirmada / o AVENUE emite confirmación por escrito (email/WhatsApp).</li>
            </ul>
            <p><strong>4.3. Prioridad:</strong> AVENUE puede asignar prioridad al primer Cliente con pago acreditado/confirmación escrita. Solicitudes "pendientes" no garantizan disponibilidad.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5) Tarifas, pagos, impuestos y comprobantes</h2>
            <p><strong>5.1. Tarifas:</strong> son las vigentes publicadas en el Sitio y/o comunicadas por canales oficiales al momento de la Reserva.</p>
            <p><strong>5.2. Pago por adelantado:</strong> para máxima previsibilidad operativa, el Studio opera bajo regla de pago anticipado del 100% para confirmar la Reserva.</p>
            <p><strong>5.3. Impuestos:</strong> se aplican conforme a la normativa vigente y al comprobante emitido.</p>
            <p><strong>5.4. Comisiones de pasarela:</strong> si el medio de pago aplica comisiones, estas pueden estar incluidas en el precio final o informadas antes de pagar, según el checkout.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6) Reglas de uso del Studio (operativas y de seguridad)</h2>
            <p><strong>6.1. Puntualidad:</strong> el Turno corre desde la hora reservada. Llegadas tarde no extienden el Turno.</p>
            <p><strong>6.2. Capacidad máxima:</strong> por seguridad y calidad, el Studio admite hasta 10 (diez) participantes por Turno, salvo autorización previa escrita. Excesos pueden generar recargo o denegación de ingreso.</p>
            <p><strong>6.3. Áreas autorizadas:</strong> el Cliente y Participantes deben limitarse a las áreas habilitadas.</p>
            <p><strong>6.4. Cuidado del espacio y equipos:</strong> está prohibido:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>mover instalaciones fijas sin autorización,</li>
              <li>adherir cintas/pinturas/pegamentos sobre paredes/pisos/mobiliario sin protección,</li>
              <li>usar líquidos cerca de equipos sin medidas de seguridad,</li>
              <li>ingresar con materiales que puedan manchar o dañar superficies sin protección.</li>
            </ul>
            <p><strong>6.5. Consumo y limpieza:</strong> se permite consumo solo en áreas autorizadas. El Cliente debe entregar el espacio en condiciones razonables. Si se requiere limpieza extraordinaria, AVENUE podrá cobrarla según tarifa vigente.</p>
            <p><strong>6.6. Prohibiciones estrictas:</strong> fumar dentro del Studio, sustancias ilegales, fuego abierto/pyro, pirotecnia, o actividades peligrosas.</p>
            <p><strong>6.7. Seguridad:</strong> AVENUE puede detener o finalizar una sesión si hay riesgo para personas, instalaciones o incumplimiento de reglas, sin obligación de reembolso si el motivo es imputable al Cliente.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7) Overtime (tiempo extra)</h2>
            <p><strong>7.1.</strong> Si el Cliente excede el horario reservado, el tiempo extra se cobra como overtime, sujeto a disponibilidad (si hay otro turno posterior, puede no ser posible extender).</p>
            <p><strong>7.2.</strong> El overtime se cobra por fracciones de 30 minutos, conforme a tarifa vigente publicada/comunicada.</p>
            <p><strong>7.3.</strong> Si el Cliente no desocupa al finalizar y afecta reservas posteriores, AVENUE podrá cobrar overtime y costos asociados de reprogramación/operativa, según corresponda.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8) Daños, pérdidas y responsabilidad del Cliente</h2>
            <p><strong>8.1.</strong> El Cliente es responsable por la conducta de sus Participantes y por cualquier daño, rotura, mancha, pérdida o uso indebido causado en el Studio, incluyendo equipamiento, mobiliario, paredes, pisos, elementos decorativos y accesorios.</p>
            <p><strong>8.2.</strong> AVENUE podrá:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>documentar daños (fotos/video),</li>
              <li>presupuestar reparación/reposición,</li>
              <li>cobrar el costo de reparación/reposición y/o la indisponibilidad operativa razonable causada por el daño.</li>
            </ul>
            <p><strong>8.3. Depósito de garantía:</strong> AVENUE podrá exigir un depósito de garantía o preautorización en casos de sesiones de alto riesgo (producciones grandes, utilería compleja, etc.). Esto se informará antes de confirmar la Reserva.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9) Equipamiento propio del Cliente y compatibilidad</h2>
            <p><strong>9.1.</strong> El Cliente puede ingresar con su propio equipamiento bajo su exclusiva responsabilidad.</p>
            <p><strong>9.2.</strong> AVENUE no se responsabiliza por incompatibilidades técnicas, fallas de equipos del Cliente o resultados creativos/estéticos esperados.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">10) Pertenencias personales</h2>
            <p>El Studio no se hace responsable por pérdida, robo o daño de pertenencias del Cliente o Participantes. El Cliente debe cuidar sus objetos de valor.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">11) Reprogramaciones, cancelaciones y no-show</h2>
            <p className="text-sm text-gray-400 mb-4">Esta política aplica sin perjuicio de los derechos legales irrenunciables del consumidor (ver cláusula 12).</p>
            
            <p><strong>11.1 Reprogramación (cambio de fecha/horario)</strong></p>
            <p>Se permite 1 (una) reprogramación sin cargo si se solicita con al menos 48 horas de anticipación al inicio del Turno, sujeta a disponibilidad. Reprogramaciones solicitadas con menos de 48 horas pueden implicar cargo por reprogramación o pérdida parcial del pago, conforme a las reglas de cancelación abajo.</p>
            
            <p><strong>11.2 Cancelación por parte del Cliente</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Con ≥ 72 horas de anticipación:</strong> AVENUE reembolsa el monto pagado menos costos no recuperables de procesamiento/cobro (si los hubiera), o alternativamente otorga crédito total para nueva reserva si el Cliente lo prefiere.</li>
              <li><strong>Entre 72 y 24 horas:</strong> AVENUE podrá retener hasta 50% del monto pagado como compensación de agenda y costos operativos, y reembolsar el saldo (menos costos no recuperables si los hubiera), o convertir el saldo en crédito.</li>
              <li><strong>Con {"<"} 24 horas:</strong> no hay reembolso (se considera pérdida del Turno por bloqueo de agenda).</li>
            </ul>
            
            <p><strong>11.3 No-show (no presentación)</strong></p>
            <p>Si el Cliente no se presenta o no inicia la sesión dentro de los 15 minutos posteriores al inicio sin aviso por canales oficiales, se considera no-show y no hay reembolso.</p>
            
            <p><strong>11.4 Cancelación por parte de AVENUE</strong></p>
            <p>Si AVENUE debe cancelar por causas operativas, fuerza mayor o indisponibilidad imprevista:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>ofrecerá reprogramación prioritaria, o</li>
              <li>reembolso del monto pagado (incluyendo costos de procesamiento en la medida en que sean recuperables; si no lo fueran, AVENUE podrá documentarlo y ofrecer crédito equivalente).</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">12) Derecho de retracto del consumidor (marco legal)</h2>
            <p>De acuerdo con la Ley 1334/98, el consumidor tiene derecho a retractarse dentro de 7 días contados desde la firma del contrato o desde la recepción del producto o servicio, en los supuestos previstos por la normativa (incluyendo contrataciones fuera del establecimiento y a distancia cuando corresponda).</p>
            <p>Para ejercer el retracto, el Cliente debe notificarlo por los canales oficiales dentro del plazo legal. AVENUE aplicará el procedimiento y efectos conforme a la ley, teniendo en cuenta si el servicio ya fue prestado total o parcialmente y los costos efectivamente incurridos, siempre respetando los derechos irrenunciables del consumidor.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">13) Contenido, imagen y confidencialidad</h2>
            <p><strong>13.1. Contenido del Cliente:</strong> el material producido por el Cliente durante su sesión pertenece al Cliente.</p>
            <p><strong>13.2. Uso promocional por AVENUE:</strong> AVENUE no utilizará imágenes o material del Cliente para publicidad sin autorización expresa previa (por escrito o por aceptación clara en formulario).</p>
            <p><strong>13.3. Confidencialidad:</strong> si el Cliente necesita confidencialidad especial (campañas, lanzamientos), debe solicitarlo antes del Turno. AVENUE hará esfuerzos razonables de confidencialidad operativa, sin asumir responsabilidades por actos de terceros ajenos a su control.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">14) Grabación de seguridad (CCTV)</h2>
            <p>Por razones de seguridad, el Studio puede contar con cámaras en áreas comunes/ingresos (no en espacios sensibles). El objetivo es seguridad y control operativo. El tratamiento de estos datos se rige por la Política de Privacidad y la Ley 7593/2025.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">15) Datos personales (privacidad)</h2>
            <p>AVENUE trata datos personales necesarios para gestionar reservas, pagos, seguridad y atención al cliente, conforme a la Ley N° 7593/2025 y a la Política de Privacidad publicada.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">16) Limitación de responsabilidad</h2>
            <p><strong>16.1.</strong> AVENUE no garantiza resultados creativos, comerciales o estéticos específicos.</p>
            <p><strong>16.2.</strong> AVENUE no será responsable por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>fallas de servicios de terceros (internet, pasarelas, cortes generales),</li>
              <li>daños indirectos, lucro cesante o pérdida de oportunidad,</li>
              <li>actos del Cliente o sus Participantes.</li>
            </ul>
            <p><strong>16.3.</strong> En la medida permitida por la ley, la responsabilidad directa de AVENUE se limita al monto efectivamente pagado por el Turno, sin afectar derechos irrenunciables del consumidor ni casos de dolo o culpa grave.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">17) Fuerza mayor</h2>
            <p>AVENUE no responderá por incumplimientos causados por eventos imprevisibles o inevitables (fuerza mayor/caso fortuito). En dichos casos, AVENUE procurará soluciones razonables (reprogramación o reembolso según corresponda).</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">18) Modificaciones</h2>
            <p>AVENUE podrá actualizar estos T&C Studio. Los cambios rigen desde su publicación y no afectan reservas ya confirmadas salvo para mejorar condiciones a favor del Cliente o por exigencia legal.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">19) Ley aplicable y jurisdicción</h2>
            <p>Estos T&C Studio se rigen por las leyes de la República del Paraguay. Jurisdicción: tribunales competentes de Asunción, Paraguay, sin perjuicio de normas de orden público en materia de defensa del consumidor.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">20) Canales oficiales</h2>
            <p>Para reservas, cambios, cancelaciones y reclamos:</p>
            <ul className="list-none space-y-1">
              <li><strong className="text-[#d4a968]">WhatsApp:</strong> 0973666000</li>
              <li><strong className="text-[#d4a968]">Email:</strong> avenuepy@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
