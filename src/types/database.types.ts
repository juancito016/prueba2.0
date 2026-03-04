export type TipoPropiedad = 'Casa' | 'Lote';
export type Moneda = 'Bs' | 'USD';
export type EstadoInmueble = 'Disponible' | 'Vendido';

export interface Departamento {
    id: string;
    nombre: string;
}

export interface Ciudad {
    id: string;
    nombre: string;
    departamento_id: string;
}

export interface Barrio {
    id: string;
    nombre: string;
    ciudad_id: string;
}

export interface Inmueble {
    id: string;
    titulo: string;
    descripcion: string;
    tipo_propiedad: TipoPropiedad;
    precio: number;
    moneda: Moneda;
    superficie_terreno?: number;
    superficie_construida?: number;
    habitaciones: number;
    banos: number;
    servicios: string[]; // jsonb will be parsed as string[] or similar
    estado: EstadoInmueble;
    barrio_id?: string;
    admin_id: string;
    contacto?: string | null;
    creado_at: string; // ISO String
}

export interface Imagen {
    id: string;
    inmueble_id: string;
    url_storage: string;
    orden: number;
}
