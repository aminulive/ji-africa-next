import {
  Car,
  Building2,
  Smartphone,
  Laptop,
  Sofa,
  Shirt,
  Sparkles,
  Wrench,
  Factory,
  Dumbbell,
  Baby,
  Wheat,
  PawPrint,
  Briefcase,
  FileUser,
  Tag,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Car,
  Building2,
  Smartphone,
  Laptop,
  Sofa,
  Shirt,
  Sparkles,
  Wrench,
  Factory,
  Dumbbell,
  Baby,
  Wheat,
  PawPrint,
  Briefcase,
  FileUser,
};

const NAME_FALLBACK_MAP: Record<string, LucideIcon> = {
  vehicles: Car,
  property: Building2,
  'phones & tablets': Smartphone,
  electronics: Laptop,
  'home, furniture & appliances': Sofa,
  fashion: Shirt,
  'beauty & personal care': Sparkles,
  services: Wrench,
  'commercial equipment & tools': Factory,
  'leisure & activities': Dumbbell,
  'babies & kids': Baby,
  'food, agriculture & farming': Wheat,
  'animals & pets': PawPrint,
  jobs: Briefcase,
  'seeking work - cvs': FileUser,
};

export function CategoryIcon({
  iconName,
  categoryName,
  className = 'w-4 h-4',
}: {
  iconName?: string | null;
  categoryName?: string | null;
  className?: string;
}) {
  const normalizedName = (categoryName || '').trim().toLowerCase();
  const IconComponent =
    (iconName && ICON_MAP[iconName]) ||
    NAME_FALLBACK_MAP[normalizedName] ||
    Tag;

  return <IconComponent className={className} />;
}