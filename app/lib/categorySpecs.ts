export interface BrandBadgeItem {
  name: string;
  code: string;
  bg: string;
  text: string;
  models: string[];
}

export interface CategorySpecConfig {
  types: string[];
  conditions: string[];
  brands: BrandBadgeItem[];
}

const DEFAULT_CONDITIONS = ['Brand New', 'Foreign Used (Tokunbo)', 'Nigerian Used', 'Refurbished'];

export const CATEGORY_SPECS: Record<string, CategorySpecConfig> = {
  phones: {
    types: [
      'Smartphone',
      'Feature Phone',
      'Tablet / iPad',
      'Smart Watch',
      'Earbuds & Headphones',
      'Charger / Power Bank',
      'Phone Case & Screen Guard',
    ],
    conditions: DEFAULT_CONDITIONS,
    brands: [
      {
        name: 'Apple',
        code: '',
        bg: 'bg-gray-900',
        text: 'text-white',
        models: [
          'iPhone 16 Pro Max',
          'iPhone 16 Pro',
          'iPhone 16',
          'iPhone 15 Pro Max',
          'iPhone 15 Pro',
          'iPhone 15',
          'iPhone 14 Pro Max',
          'iPhone 14',
          'iPhone 13 Pro Max',
          'iPhone 13',
          'iPhone 12 Pro Max',
          'iPhone 12',
          'iPhone 11',
          'iPad Pro',
          'iPad Air',
        ],
      },
      {
        name: 'Samsung',
        code: 'SAM',
        bg: 'bg-blue-700',
        text: 'text-white',
        models: [
          'Galaxy S24 Ultra',
          'Galaxy S23 Ultra',
          'Galaxy S22 Ultra',
          'Galaxy S21',
          'Galaxy A55',
          'Galaxy A54',
          'Galaxy A35',
          'Galaxy A15',
          'Galaxy Z Fold 5',
          'Galaxy Z Flip 5',
          'Galaxy Tab S9',
        ],
      },
      {
        name: 'Tecno',
        code: 'TEC',
        bg: 'bg-sky-600',
        text: 'text-white',
        models: [
          'Phantom V Fold',
          'Phantom X2 Pro',
          'Camon 30 Pro',
          'Camon 20 Pro',
          'Spark 20 Pro+',
          'Spark 20',
          'Pova 6 Pro',
          'Pop 8',
        ],
      },
      {
        name: 'Infinix',
        code: 'INF',
        bg: 'bg-emerald-600',
        text: 'text-white',
        models: [
          'Zero 30 5G',
          'Note 40 Pro',
          'Note 30 Pro',
          'Hot 40 Pro',
          'Hot 40i',
          'Smart 8',
        ],
      },
      {
        name: 'Xiaomi / Redmi',
        code: 'MI',
        bg: 'bg-orange-600',
        text: 'text-white',
        models: [
          'Xiaomi 14 Ultra',
          'Redmi Note 13 Pro+',
          'Redmi Note 13',
          'Redmi Note 12',
          'Redmi 13C',
          'Poco X6 Pro',
        ],
      },
      {
        name: 'Google Pixel',
        code: 'PIX',
        bg: 'bg-indigo-600',
        text: 'text-white',
        models: ['Pixel 9 Pro', 'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 6 Pro'],
      },
      {
        name: 'Oraimo',
        code: 'ORA',
        bg: 'bg-lime-600',
        text: 'text-white',
        models: ['SpaceBuds', 'FreePods 4', 'FreePods Pro', 'Watch 4 Plus', 'PowerBox 20000mAh'],
      },
    ],
  },

  vehicles: {
    types: [
      'Sedan / Saloon',
      'SUV & Crossover',
      'Hatchback',
      'Pickup Truck',
      'Bus & Minivan',
      'Coupe & Convertible',
      'Motorcycle / Okada',
      'Keke Napep / Tricycle',
      'Heavy Duty Truck',
      'Spare Parts & Tyres',
    ],
    conditions: ['Brand New', 'Foreign Used (Tokunbo)', 'Nigerian Used'],
    brands: [
      {
        name: 'Toyota',
        code: 'TOY',
        bg: 'bg-red-600',
        text: 'text-white',
        models: [
          'Camry',
          'Corolla',
          'RAV4',
          'Highlander',
          'Venza',
          'Sienna',
          'Hilux',
          'Land Cruiser Prado',
          'Avalon',
          'Matrix',
        ],
      },
      {
        name: 'Honda',
        code: 'HON',
        bg: 'bg-slate-800',
        text: 'text-white',
        models: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Crosstour', 'Odyssey', 'HR-V'],
      },
      {
        name: 'Mercedes-Benz',
        code: 'MB',
        bg: 'bg-zinc-900',
        text: 'text-white',
        models: ['C300', 'C350', 'E350', 'GLE 350', 'GLK 350', 'ML 350', 'CLA 250', 'S550'],
      },
      {
        name: 'Lexus',
        code: 'LEX',
        bg: 'bg-neutral-800',
        text: 'text-white',
        models: ['RX 350', 'RX 330', 'ES 350', 'GX 460', 'IS 250', 'NX 300', 'LX 570'],
      },
      {
        name: 'Hyundai',
        code: 'HYU',
        bg: 'bg-blue-800',
        text: 'text-white',
        models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'ix35'],
      },
      {
        name: 'Kia',
        code: 'KIA',
        bg: 'bg-rose-700',
        text: 'text-white',
        models: ['Rio', 'Cerato', 'Optima', 'Sportage', 'Sorento', 'Picanto'],
      },
      {
        name: 'Ford',
        code: 'FRD',
        bg: 'bg-sky-800',
        text: 'text-white',
        models: ['Explorer', 'Edge', 'Escape', 'F-150', 'Focus', 'Fusion'],
      },
    ],
  },

  electronics: {
    types: [
      'Laptop',
      'Desktop Computer',
      'Computer Monitor',
      'Smart TV',
      'Home Theater & Soundbar',
      'PlayStation / Xbox Console',
      'Camera & Drone',
      'Printer & Scanner',
      'Router & Networking',
      'CCTV & Security',
    ],
    conditions: DEFAULT_CONDITIONS,
    brands: [
      {
        name: 'HP',
        code: 'HP',
        bg: 'bg-sky-600',
        text: 'text-white',
        models: ['EliteBook 840', 'ProBook 450', 'Pavilion 15', 'Spectre x360', 'Envy x360', 'Omen 16'],
      },
      {
        name: 'Dell',
        code: 'DEL',
        bg: 'bg-blue-700',
        text: 'text-white',
        models: ['Latitude 7490', 'Latitude 5420', 'XPS 13', 'XPS 15', 'Inspiron 15', 'Alienware'],
      },
      {
        name: 'Lenovo',
        code: 'LEN',
        bg: 'bg-red-600',
        text: 'text-white',
        models: ['ThinkPad X1 Carbon', 'ThinkPad T480', 'ThinkPad T14', 'IdeaPad 3', 'Yoga 7i', 'Legion 5'],
      },
      {
        name: 'Apple',
        code: 'MAC',
        bg: 'bg-gray-900',
        text: 'text-white',
        models: ['MacBook Pro M3', 'MacBook Pro M2', 'MacBook Pro M1', 'MacBook Air M2', 'MacBook Air M1', 'iMac'],
      },
      {
        name: 'Sony',
        code: 'SNY',
        bg: 'bg-indigo-900',
        text: 'text-white',
        models: ['PlayStation 5', 'PlayStation 4 Pro', 'Bravia 4K TV', 'WH-1000XM5', 'Alpha A7'],
      },
      {
        name: 'LG',
        code: 'LG',
        bg: 'bg-rose-700',
        text: 'text-white',
        models: ['OLED C3 TV', 'UHD 4K Smart TV', 'XBOOM Sound System', 'UltraGear Monitor'],
      },
      {
        name: 'Hisense',
        code: 'HIS',
        bg: 'bg-teal-600',
        text: 'text-white',
        models: ['55" 4K Smart TV', '43" Smart TV', '65" ULED TV', 'Soundbar HS214'],
      },
    ],
  },

  home: {
    types: [
      'Generator & Inverter',
      'Solar Panel & Battery',
      'Air Conditioner',
      'Refrigerator & Freezer',
      'Washing Machine',
      'Gas Cooker & Microwave',
      'Sofa & Chairs',
      'Bed & Mattress',
      'Dining & Office Table',
    ],
    conditions: ['Brand New', 'Foreign Used (Tokunbo)', 'Nigerian Used'],
    brands: [
      {
        name: 'Thermocool',
        code: 'HTC',
        bg: 'bg-red-600',
        text: 'text-white',
        models: ['Chest Freezer', 'Double Door Fridge', '1.5HP Split AC', 'Front Load Washer', 'Generator'],
      },
      {
        name: 'Hisense',
        code: 'HIS',
        bg: 'bg-teal-600',
        text: 'text-white',
        models: ['1.5HP Split AC', 'Standing AC', 'Deep Freezer', 'Side-by-Side Fridge'],
      },
      {
        name: 'LG',
        code: 'LG',
        bg: 'bg-rose-700',
        text: 'text-white',
        models: ['Dual Inverter AC', 'InstaView Fridge', 'Direct Drive Washer'],
      },
      {
        name: 'Sumec Firman',
        code: 'FIR',
        bg: 'bg-amber-600',
        text: 'text-white',
        models: ['SPG3000E2', 'ECO3990ES', 'RDG6500SE', 'FPG8800E2'],
      },
      {
        name: 'Luminous',
        code: 'LUM',
        bg: 'bg-blue-700',
        text: 'text-white',
        models: ['2.5kVA Inverter', '3.5kVA Inverter', '5kVA Hybrid', '220Ah Tubular Battery'],
      },
    ],
  },

  property: {
    types: [
      'Detached Duplex',
      'Semi-Detached Duplex',
      'Terraced Duplex',
      'Block of Flats',
      'Bungalow',
      'Mini Flat (Room & Parlour)',
      'Self Contain',
      'Residential Land',
      'Commercial Shop / Office',
      'Short Let Apartment',
    ],
    conditions: ['Newly Built', 'Renovated', 'Fairly Used', 'Off-Plan', 'Uncompleted'],
    brands: [],
  },

  fashion: {
    types: [
      'Sneakers & Trainers',
      'Corporate & Leather Shoes',
      'Traditional / Senator Wear',
      'Shirts & T-Shirts',
      'Jeans & Trousers',
      'Dresses & Gowns',
      'Handbags & Backpacks',
      'Wristwatches',
      'Perfumes & Fragrances',
      'Human Hair & Wigs',
    ],
    conditions: ['Brand New', 'Thrift / Okrika (Grade A)', 'Gently Used'],
    brands: [
      { name: 'Nike', code: 'NKE', bg: 'bg-gray-900', text: 'text-white', models: ['Air Force 1', 'Air Jordan 1', 'Air Max 90', 'Dunk Low'] },
      { name: 'Adidas', code: 'ADI', bg: 'bg-slate-800', text: 'text-white', models: ['Samba OG', 'Ultraboost', 'Campus 00s', 'Yeezy 350'] },
      { name: 'Zara', code: 'ZAR', bg: 'bg-zinc-800', text: 'text-white', models: ['Blazer', 'Oxford Shirt', 'Evening Dress'] },
      { name: 'Casio', code: 'CAS', bg: 'bg-blue-800', text: 'text-white', models: ['G-Shock', 'Edifice', 'Vintage Gold'] },
      { name: 'Rolex', code: 'RLX', bg: 'bg-emerald-800', text: 'text-white', models: ['Submariner', 'Datejust', 'Day-Date'] },
    ],
  },

  general: {
    types: [
      'Standard Item',
      'Commercial / Industrial',
      'Parts & Accessories',
      'Bundle / Wholesale',
      'Service Package',
    ],
    conditions: ['Brand New', 'Foreign Used (Tokunbo)', 'Nigerian Used', 'Not Applicable'],
    brands: [],
  },
};

export function getCategorySpecConfig(categoryName?: string): CategorySpecConfig {
  const n = String(categoryName || '').toLowerCase();
  if (n.includes('phone') || n.includes('tablet') || n.includes('mobile')) {
    return CATEGORY_SPECS.phones;
  }
  if (n.includes('vehicle') || n.includes('car') || n.includes('auto')) {
    return CATEGORY_SPECS.vehicles;
  }
  if (n.includes('electronic') || n.includes('laptop') || n.includes('computer')) {
    return CATEGORY_SPECS.electronics;
  }
  if (n.includes('home') || n.includes('furniture') || n.includes('appliance')) {
    return CATEGORY_SPECS.home;
  }
  if (n.includes('property') || n.includes('real estate') || n.includes('land')) {
    return CATEGORY_SPECS.property;
  }
  if (n.includes('fashion') || n.includes('beauty') || n.includes('clothing')) {
    return CATEGORY_SPECS.fashion;
  }
  return CATEGORY_SPECS.general;
}
