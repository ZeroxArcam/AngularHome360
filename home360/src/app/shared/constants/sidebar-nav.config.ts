export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  exactMatch?: boolean;
}

export const SIDEBAR_NAV_CONFIG: { [key: string]: NavItem[] } = {
  ADMIN: [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'fas fa-chart-line', exactMatch: true },
    { label: 'Categorías', route: '/admin/categories', icon: 'fas fa-tags' },
    { label: 'Propiedades', route: '/admin/properties', icon: 'fas fa-home' },
    { label: 'Usuarios', route: '/admin/users', icon: 'fas fa-users' },
    { label: 'Configuración', route: '/admin/settings', icon: 'fas fa-cog' }
  ],
  SELLER: [
    { label: 'Mis productos', route: '/seller/products', icon: 'fas fa-box-open' },
    { label: 'Ventas', route: '/seller/sales', icon: 'fas fa-chart-line' }
  ],
  CUSTOMER: [
    { label: 'Inicio', route: '/customer/home', icon: 'fas fa-home' },
    { label: 'Mis pedidos', route: '/customer/orders', icon: 'fas fa-receipt' }
  ]
};
