import React from 'react';

export const Brands = ({ t }) => {
  const brands = [
    { name: 'Cristaline', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/43f8bnvu_cristaline.png' },
    { name: 'Sarelly', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/obb5nku6_sarelly.png' },
    { name: 'MP Suplemento', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/7hk6omux_mp%20suplemento.png' },
    { name: 'Brand 1', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/12alcuec_IMG_7056.PNG' },
    { name: 'Brand 2', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/q0w0dccc_IMG_8325.PNG' },
    { name: 'Laese', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/o91gyue1_laese.png' },
    { name: 'Thula', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/y060bk89_thula.png' },
    { name: 'Fila', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/n23vvyer_fila.png' },
    { name: 'Inmortal', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/z44zvkxg_inmortal.png' },
    { name: 'Hunter', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/81t0v820_hunter.png' },
    { name: 'Maria E Makeup', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/b5o58lv1_maria%20e%20makeup.png' },
    { name: 'Malva', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/dqrkyqty_malva.png' },
    { name: 'Aguara', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/q9zvhytl_aguara.png' },
    { name: 'Body Sculpt', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/x1508c3y_body%20sculpt.png' },
    { name: 'Efimera', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/430czjwq_efimera.png' },
    { name: 'Premiata', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/bz75uuaw_premiata.png' },
    { name: 'UGG', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/kjm7ig8m_ugg.png' },
    { name: 'David Sandoval', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/2usl8am4_david%20sandoval.png' },
    { name: 'Brofitwear', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/pv6lug6t_brofitwear.png' },
    { name: 'Bravisima', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/sl1cdb62_bravisima.png' },
    { name: 'Santal', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/9ug3sffi_santal.png' },
    { name: 'Undisturbed', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/qigxzvwt_undisturbed.png' }
  ];

  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#f7f2ed' }}>
      <div className="max-w-7xl mx-auto">
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-light mb-6 italic" 
              style={{ 
                color: '#1a1a1a',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.brands.title}
          </h2>
          <p className="text-base max-w-3xl mx-auto leading-relaxed" 
             style={{ 
               color: '#5a5a5a',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.brands.subtitle}
          </p>
        </div>

        {/* Grid de logos con tamaños proporcionales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-6 transition-all duration-300 hover:scale-110"
              style={{ 
                backgroundColor: 'white',
                border: '1px solid rgba(212, 169, 104, 0.2)',
                minHeight: '120px'
              }}
            >
              <img 
                src={brand.url}
                alt={brand.name}
                className="max-w-full max-h-20 object-contain"
                style={{
                  filter: 'grayscale(100%) brightness(0.3) contrast(1.2)',
                  transition: 'filter 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.filter = 'grayscale(0%) brightness(1) contrast(1)'}
                onMouseLeave={(e) => e.target.style.filter = 'grayscale(100%) brightness(0.3) contrast(1.2)'}
              />
            </div>
          ))}
        </div>
        
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};
