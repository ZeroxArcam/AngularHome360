export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  exactMatch?: boolean;
}

export const SIDEBAR_NAV_CONFIG: { [key: string]: NavItem[] } = {
  ADMIN: [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'fas fa-dashboard', exactMatch: true },
    { label: 'Categorías', route: '/admin/categories', icon: 'fas fa-tags' },
    { label: 'Ubicaciones', route: '/admin/locations', icon: 'fas fa-map-marker-alt' },
    { label: 'Usuarios', route: '/admin/users', icon: 'fas fa-users' },
    { label: 'Configuración', route: '/admin/settings', icon: 'fas fa-cog' }
  ],
  SELLER: [
    { label: 'Propiedades', route: '/seller/properties', icon: 'fas fa-home', exactMatch: true },
    { label: 'Horarios', route: '/seller/time_slots', icon: 'far fa-clock' },
    { label: 'Configuración', route: '/admin/settings', icon: 'fas fa-cog' }
  ],
  CUSTOMER: [
    { label: 'Inicio', route: '/customer/home', icon: 'fas fa-home' },
    { label: 'Mis pedidos', route: '/customer/orders', icon: 'fas fa-receipt' }
  ]
};
