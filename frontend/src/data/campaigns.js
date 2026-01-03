// Campaigns data - can be moved to backend/database later
export const CAMPAIGNS = {
  avenue: {
    id: 'avenue',
    name: 'AVENUE',
    brand: 'AVENUE',
    active: true,
    title: '¿Te gustaría compartir tu experiencia en AVENUE con tu comunidad?',
    description: 'AVENUE te invita a ser parte de esta experiencia y a mostrar cómo se vive la moda, el detalle y el descubrimiento en un solo lugar.',
    canje: {
      amount: '500.000',
      description: 'Podés elegir en el momento productos del OUTLET de AVENUE y de SANTAL hasta Gs. 500.000.'
    },
    location: 'El video/contenido se debe grabar dentro de AVENUE (en tienda).',
    requirements: {
      gender: 'all', // 'all', 'female', 'male'
      genderText: 'Mujeres y hombres',
      minAge: 18,
      minFollowers: 3000,
      location: 'Residencia en Asunción y Gran Asunción',
      publicProfile: 'Perfiles públicos de Instagram y/o TikTok'
    },
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
    color: '#d4a968'
  },
  santal: {
    id: 'santal',
    name: 'SANTAL',
    brand: 'SANTAL',
    active: true,
    title: '¿Te gustaría venir a probarte SANTAL y compartir tu experiencia con tu comunidad?',
    description: 'SANTAL es una marca de denim sustentable, con piezas exclusivas pensadas para quienes valoran el fit, los detalles y una estética cuidada. Te invitamos a vivir la experiencia en AVENUE y mostrar cómo queda puesta en la vida real.',
    canje: {
      amount: '500.000',
      description: 'Podés elegir en el momento productos de SANTAL y del OUTLET de AVENUE hasta Gs. 500.000.'
    },
    location: 'El contenido se debe grabar dentro de AVENUE (probador + tienda).',
    requirements: {
      gender: 'female', // 'all', 'female', 'male'
      genderText: 'Mujeres',
      minAge: 18,
      minFollowers: 3000,
      location: 'Residencia en Asunción y Gran Asunción',
      publicProfile: 'Perfiles públicos de Instagram y/o TikTok'
    },
    image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=2030&auto=format&fit=crop',
    color: '#d4a968'
  }
};

export const getActiveCampaigns = () => {
  return Object.values(CAMPAIGNS).filter(c => c.active);
};

export const getCampaign = (id) => {
  return CAMPAIGNS[id] || null;
};
