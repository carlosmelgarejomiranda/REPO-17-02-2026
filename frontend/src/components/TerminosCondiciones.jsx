import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export const TerminosCondiciones = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Header */}
      <div className="py-8 px-6" style={{ backgroundColor: '#141414', borderBottom: '1px solid #333' }}>
        <div className="max-w-4xl mx-auto">
          <a 
            href="/studio/ugc" 
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-70"
            style={{ color: '#d4a968' }}
          >
            <ArrowLeft className="w-4 h-4" /> Volver a campañas
          </a>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" style={{ color: '#d4a968' }} />
            <h1 className="text-2xl md:text-3xl font-light italic" style={{ color: '#f5ede4' }}>
              Bases y Condiciones
            </h1>
          </div>
          <p className="mt-2 text-sm" style={{ color: '#a8a8a8' }}>
            Contrato de Adhesión - Campañas para creadores/as de contenido
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <div className="space-y-8" style={{ color: '#a8a8a8' }}>
            
            {/* Organizador Info */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <p className="mb-2"><strong style={{ color: '#d4a968' }}>Organizador:</strong> AVENUE MALL EAS – RUC 80152251-0</p>
              <p className="mb-2"><strong style={{ color: '#d4a968' }}>Domicilio:</strong> Avenida San Martín entre Sucre y Moisés Bertoni, Paseo Los Árboles, Asunción, Paraguay</p>
              <p className="mb-2"><strong style={{ color: '#d4a968' }}>WhatsApp oficial:</strong> 0973666000</p>
              <p className="mb-0"><strong style={{ color: '#d4a968' }}>Correo:</strong> avenuepy@gmail.com</p>
              <p className="mt-4 text-sm" style={{ color: '#666' }}>Versión: 1.0</p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>1) Aceptación y adhesión</h2>
              <p className="mb-3">1.1. Al completar y enviar el formulario, el/la postulante (en adelante, el/la "Participante") declara que leyó, entendió y acepta íntegramente estas Bases y Condiciones, que constituyen un contrato de adhesión con AVENUE MALL EAS (en adelante, "AVENUE" o el "Organizador").</p>
              <p>1.2. La aceptación se realiza por medios electrónicos y tiene efecto vinculante desde el envío del formulario.</p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>2) Objeto</h2>
              <p className="mb-3">Estas Bases regulan la postulación, selección y participación del/la Participante en campañas promocionales y/o colaboraciones operadas por AVENUE (en adelante, la "Campaña"), incluyendo:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>a) la realización y entrega de contenido;</li>
                <li>b) el beneficio/canje, si corresponde;</li>
                <li>c) la autorización de uso de imagen/voz y licencia de uso del contenido;</li>
                <li>d) el tratamiento de datos personales.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>3) Definiciones</h2>
              <ul className="space-y-2">
                <li><strong style={{ color: '#d4a968' }}>a) Campaña:</strong> acción promocional/creativa operada por AVENUE, con requisitos y condiciones variables.</li>
                <li><strong style={{ color: '#d4a968' }}>b) Convocatoria vigente:</strong> comunicación de AVENUE (formulario, landing, post, WhatsApp, email o brief) donde se informan requisitos, entregables, plazos, tope de canje y reglas específicas de esa Campaña.</li>
                <li><strong style={{ color: '#d4a968' }}>c) Brief:</strong> instrucciones y lineamientos de la Campaña (cantidad de piezas, formato, plazos, menciones, etc.).</li>
                <li><strong style={{ color: '#d4a968' }}>d) Contenido:</strong> videos, fotos, audios, textos, tomas, piezas editadas y material bruto generados/entregados por el/la Participante en el marco de la Campaña.</li>
                <li><strong style={{ color: '#d4a968' }}>e) Local:</strong> el lugar indicado por AVENUE para realizar la experiencia y/o grabación.</li>
                <li><strong style={{ color: '#d4a968' }}>f) Cliente/Contratante:</strong> marca o empresa tercera que contrata a AVENUE para operar una Campaña o a favor de quien se realiza la Campaña.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>4) Requisitos variables y elegibilidad</h2>
              <p className="mb-3">4.1. Los requisitos de participación (edad mínima, ubicación, perfil público, seguidores mínimos, etc.) pueden variar y serán los indicados en la Convocatoria vigente.</p>
              <p className="mb-3">4.2. El/la Participante declara que toda información provista es veraz y actual, y autoriza a AVENUE a realizar verificaciones razonables (links, capturas de métricas, confirmación de perfil público, etc.).</p>
              <p>4.3. La postulación no crea derecho adquirido ni garantiza selección.</p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>5) Postulación, selección y cupos</h2>
              <p className="mb-3">5.1. La selección queda a exclusivo criterio de AVENUE, según cupos, perfil, calidad, coherencia con la Campaña y objetivos de comunicación.</p>
              <p className="mb-3">5.2. AVENUE puede rechazar, suspender o dar de baja participaciones por incumplimiento de requisitos, falsedad de datos o motivos operativos razonables.</p>
              <p>5.3. Este contrato no genera relación laboral, de agencia, representación, sociedad ni exclusividad entre el/la Participante y AVENUE.</p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>6) Beneficio / Canje (sin pago monetario)</h2>
              <p className="mb-3">6.1. Salvo acuerdo escrito distinto, la participación se realiza sin pago monetario y mediante un beneficio/canje definido en la Convocatoria vigente (monto tope, categorías, restricciones, stock, etc.).</p>
              <p className="mb-3">6.2. El canje/beneficio:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>no es dinero, no es reembolsable, no es transferible y no puede canjearse por efectivo;</li>
                <li>está sujeto a disponibilidad/stock;</li>
                <li>puede limitarse a categorías/marcas/sectores indicados por AVENUE en la Convocatoria vigente.</li>
              </ul>
              <p>6.3. AVENUE podrá condicionar la entrega del beneficio a: (i) asistencia efectiva en fecha/hora acordadas; y/o (ii) cumplimiento del entregable mínimo y plazos del Brief; y/o (iii) entrega del Contenido conforme lo indicado.</p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>7) Entregables, plazos y lineamientos</h2>
              <p className="mb-3">7.1. Los entregables (cantidad, duración, formato, menciones, tags, fecha de entrega/publicación, etc.) serán los definidos en el Brief y/o Convocatoria vigente.</p>
              <p className="mb-3">7.2. El/la Participante se compromete a:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>a) realizar la grabación en el Local cuando así se indique;</li>
                <li>b) mantener un estándar razonable de calidad (audio/imagen);</li>
                <li>c) respetar al personal, clientes y marcas;</li>
                <li>d) no obstaculizar la operación del Local;</li>
                <li>e) entregar el Contenido en el formato y plazos definidos.</li>
              </ul>
              <p>7.3. Cuando corresponda por políticas de plataforma o buenas prácticas, el/la Participante aceptará identificar la colaboración/canje mediante herramientas o menciones disponibles (por ejemplo "colaboración", "canje", "contenido patrocinado" o equivalentes).</p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>8) Conducta y restricciones en el Local</h2>
              <p className="mb-3">8.1. El/la Participante deberá cumplir normas internas del Local y seguir indicaciones razonables del personal.</p>
              <p className="mb-3">8.2. Queda prohibido:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>grabar zonas restringidas o información sensible;</li>
                <li>grabar terceros identificables sin su consentimiento cuando corresponda;</li>
                <li>generar situaciones que afecten la experiencia de clientes.</li>
              </ul>
              <p>8.3. El/la Participante responde por daños ocasionados por dolo o culpa grave.</p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>9) Garantías sobre el contenido (música, derechos de terceros)</h2>
              <p className="mb-3">9.1. El/la Participante garantiza que el Contenido no infringe derechos de terceros (música sin licencia, imágenes ajenas, marcas ajenas, etc.) y que cuenta con derechos suficientes para otorgar las autorizaciones de este contrato.</p>
              <p>9.2. Si existieran reclamos imputables al/la Participante por infracciones de terceros, éste/ésta se compromete a mantener indemne a AVENUE y al Cliente en la medida permitida por la ley.</p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>10) AUTORIZACIÓN DE USO DE IMAGEN, VOZ Y LICENCIA DE CONTENIDO (AVENUE + CLIENTE)</h2>
              <p className="mb-3">10.1. El/la Participante autoriza a AVENUE MALL EAS, de forma gratuita (siendo el canje/beneficio la contraprestación), a usar su imagen, voz, nombre/perfil, y el Contenido generado o entregado en el marco de la Campaña, para fines promocionales, publicitarios, comerciales e institucionales.</p>
              <p className="mb-3">10.2. El/la Participante autoriza expresamente que AVENUE pueda:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>a) entregar/compartir el Contenido al Cliente de la Campaña; y</li>
                <li>b) otorgar al Cliente (y a sus agencias/proveedores que participen en la ejecución) una licencia sublicenciable y transferible para usar el Contenido y la imagen/voz del/la Participante con los mismos alcances previstos aquí, únicamente para fines vinculados a la Campaña y/o comunicaciones de marca del Cliente.</li>
              </ul>
              <p className="mb-3">10.3. <strong style={{ color: '#d4a968' }}>Alcance de uso:</strong> AVENUE y/o el Cliente podrán usar, reproducir, comunicar públicamente, exhibir, publicar, repostear, editar, adaptar, recortar, subtitular, musicalizar, compilar, traducir y distribuir el Contenido, en cualquier formato y soporte.</p>
              <p className="mb-3">10.4. <strong style={{ color: '#d4a968' }}>Medios:</strong> redes sociales (orgánico y/o anuncios/pauta), web, ecommerce, email marketing, WhatsApp, material institucional, presentaciones comerciales, cartelería, pantallas en tienda y cualquier canal oficial de AVENUE y/o del Cliente.</p>
              <p className="mb-3">10.5. <strong style={{ color: '#d4a968' }}>Territorio:</strong> mundial.</p>
              <p className="mb-3">10.6. <strong style={{ color: '#d4a968' }}>Plazo:</strong> 5 (cinco) años, o el plazo distinto que indique la Convocatoria vigente.</p>
              <p className="mb-3">10.7. <strong style={{ color: '#d4a968' }}>Atribución:</strong> AVENUE y/o el Cliente podrán etiquetar/mencionar al/la Participante cuando corresponda o usar el Contenido sin mención si el formato lo requiere.</p>
              <p className="mb-3">10.8. <strong style={{ color: '#d4a968' }}>Integridad y reputación:</strong> AVENUE y/o el Cliente no realizarán usos que distorsionen el Contenido de forma tal que afecte ilegítimamente el honor o reputación del/la Participante.</p>
              <p>10.9. <strong style={{ color: '#d4a968' }}>Revocación:</strong> si el/la Participante solicitara revocar a futuro su autorización, AVENUE evaluará la solicitud y aplicará la revocación de manera razonable sin afectar materiales ya publicados/impresos ni campañas en curso, y en la medida operativamente posible.</p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>11) Privacidad y tratamiento de datos personales</h2>
              <p className="mb-3">11.1. AVENUE podrá recolectar y tratar datos como: nombre, apellido, edad, ciudad, teléfono, email, links de redes, métricas, disponibilidad y links de contenido.</p>
              <p className="mb-3">11.2. <strong style={{ color: '#d4a968' }}>Finalidades:</strong> gestionar postulaciones y selección; coordinar logística; administrar el beneficio/canje; registro histórico; prevención de fraude; cumplimiento de obligaciones aplicables.</p>
              <p className="mb-3">11.3. AVENUE podrá utilizar proveedores tecnológicos (formularios, CRM, mensajería, almacenamiento) y compartir los datos estrictamente necesarios con el Cliente y/o dichos proveedores para operar la Campaña y ejecutar este contrato, aplicando medidas de seguridad razonables.</p>
              <p className="mb-3">11.4. <strong style={{ color: '#d4a968' }}>Conservación:</strong> los datos se conservarán por el tiempo necesario para las finalidades indicadas y luego podrán eliminarse o anonimizarse.</p>
              <p>11.5. <strong style={{ color: '#d4a968' }}>Contacto:</strong> para consultas o solicitudes sobre datos personales, el/la Participante podrá escribir a avenuepy@gmail.com o al WhatsApp 0973666000.</p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>12) Comunicaciones</h2>
              <p>El/la Participante acepta que AVENUE lo/la contacte por WhatsApp y/o email para coordinación de la Campaña, confirmaciones, recordatorios y logística.</p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>13) Incumplimiento, baja y efectos</h2>
              <p className="mb-3">13.1. Si el/la Participante incumple requisitos, no asiste, no entrega el Contenido mínimo o incurre en conductas prohibidas, AVENUE podrá dar de baja la participación y no entregar el beneficio, y/o solicitar devolución del producto entregado cuando corresponda razonablemente.</p>
              <p>13.2. La autorización/licencia de uso (Cláusula 10) subsiste respecto del Contenido ya entregado y/o publicado legítimamente.</p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>14) Responsabilidad</h2>
              <p>AVENUE no garantiza resultados de alcance, viralidad o métricas. El/la Participante asume sus costos de traslado y logística personal, salvo que la Convocatoria vigente indique lo contrario.</p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-medium mb-4" style={{ color: '#f5ede4' }}>15) Ley aplicable y jurisdicción</h2>
              <p>Este contrato se rige por las leyes de la República del Paraguay. Las partes se someten a los juzgados y tribunales de Asunción, salvo norma imperativa distinta.</p>
            </section>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 px-6 text-center" style={{ backgroundColor: '#141414', borderTop: '1px solid #333' }}>
        <a 
          href="/studio/ugc" 
          className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-70"
          style={{ color: '#d4a968' }}
        >
          <ArrowLeft className="w-4 h-4" /> Volver a campañas
        </a>
      </div>
    </div>
  );
};
