export interface RawMaterial {
  id: string;
  name: string;
  description?: string | null;
  unit: string;
  quantity: number;
  supplier?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BOM {
  id: string;
  variationId: string;
  rawMaterialId: string;
  quantityRequired: number;
  rawMaterial?: RawMaterial;
}

export interface VariationAttribute {
  id: string;
  name: string;
  value: string;
  variationId: string;
}

export interface ProductVariation {
  id: string;
  sku: string;
  price: number;
  stock: number;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  attributes: VariationAttribute[];
  bom: BOM[];
}

export interface ProductDetailsResponse {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variations: ProductVariation[];
}
