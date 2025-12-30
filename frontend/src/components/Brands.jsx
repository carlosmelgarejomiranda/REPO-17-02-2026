import React from 'react';

export const Brands = ({ t }) => {
  const brands = [
    { name: 'Cristaline', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/43f8bnvu_cristaline.png' },
    { name: 'Sarelly', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/obb5nku6_sarelly.png' },
    { name: 'MP Suplemento', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/7hk6omux_mp%20suplemento.png' },
    { name: 'Coraltheia', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/vd1ynijp_Coraltheia%20%281%29.png' },
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
    { name: 'Undisturbed', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/qigxzvwt_undisturbed.png' },
    { name: 'Serotonina', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/uj3dond3_serotoninaa.png' },
    { name: 'Brand Logo', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/h7iv03cn_Design%20sem%20nome%20%284%29.png' },
    { name: 'OKI', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/trqd3flg_OKI.png' }
  ];

  return (
    <section className="py-12 px-6" style={{ backgroundColor: '#f7f2ed' }}>
      <div className="max-w-5xl mx-auto">
        <div className="w-20 h-0.5 mx-auto mb-6" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-light mb-2 italic" 
              style={{ 
                color: '#1a1a1a',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.brands.title}
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" 
             style={{ 
               color: '#5a5a5a',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.brands.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2" style={{ gridAutoRows: '1fr' }}>
          {brands.map((brand, index) => {
            let maxHeight = '80px';
            if (brand.name === 'Fila') maxHeight = '25px';
            else if (brand.name === 'UGG') maxHeight = '35px';
            
            return (
              <div
                key={index}
                className="flex items-center justify-center p-2 transition-all duration-300 hover:scale-110"
                style={{ 
                  backgroundColor: '#f7f2ed',
                  height: '70px'
                }}
              >
                <img 
                  src={brand.url}
                  alt={brand.name}
                  className="w-full h-auto object-contain"
                  style={{
                    maxHeight: maxHeight,
                    maxWidth: '100%',
                    filter: 'grayscale(100%) brightness(0.3) contrast(1.2)',
                    transition: 'filter 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.filter = 'grayscale(0%) brightness(1) contrast(1)'}
                  onMouseLeave={(e) => e.target.style.filter = 'grayscale(100%) brightness(0.3) contrast(1.2)'}
                />
              </div>
            );
          })}
        </div>
        
        <div className="w-20 h-0.5 mx-auto mt-6" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};
