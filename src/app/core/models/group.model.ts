export interface Group {
  id: string;
  nombre: string;
  descripcion: string | null;
  creador_id: string;
  estado?: 'activo' | 'inactivo';
  creado_en?: string;
  actualizado_en?: string;
}