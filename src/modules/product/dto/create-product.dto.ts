export class CreateVariationDto {
  sku: string;
  price: number;
  stock?: number;
  attributes?: { name: string; value: string }[];
  bom?: { rawMaterialId: string; quantityRequired: number }[];
}

export class CreateProductDto {
  name: string;
  description?: string;
  category?: string;
  variations?: CreateVariationDto[];
}

// dto/update-product.dto.ts
export class UpdateProductDto {
  name?: string;
  description?: string;
  category?: string;
}

export class FindAllProducts {
  perPage?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export class PaginationResponse<T> {
  data: T;
  meta: {
    page: number;
    perPage: number;
    total: number;
  };
}
