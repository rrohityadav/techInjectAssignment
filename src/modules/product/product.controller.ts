import { ProductService } from './product.service';
import {
  CreateProductDto,
  FindAllProducts,
  PaginationResponse,
} from '@/modules/product/dto/create-product.dto';
import {
  UpdateProductDto,
  UpdateProductVariationDto,
} from '@/modules/product/dto/update-product.dto';
import { Product, RawMaterial } from '@prisma/client';
import {
  CreateRawMaterialDto,
  UpdateRawMaterialDto,
} from '@/modules/product/dto/raw-material.dto';
import {
  BOM,
  ProductDetailsResponse,
  VariationAttribute,
} from '@/modules/product/dto/response-type';
import { CreateBomDto, UpdateBomDto } from '@/modules/product/dto/bom-dto';
import {
  CreateVariationAttributeDto,
  UpdateVariationAttributeDto,
} from '@/modules/product/dto/variationAttribute.dto';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  async createProduct(product: CreateProductDto): Promise<Product> {
    return this.productService.createProduct(product);
  }

  getAllProducts(
    data: FindAllProducts,
  ): Promise<PaginationResponse<ProductDetailsResponse[]>> {
    return this.productService.findAll(data);
  }

  async getProductById(id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  async updateProduct(id: string, product: UpdateProductDto): Promise<Product> {
    return this.productService.updateProduct(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productService.remove(id);
  }

  async findByIdOrSku(
    productIdOrSku: string,
  ): Promise<ProductDetailsResponse | null> {
    return this.productService.findByIdOrSku(productIdOrSku);
  }

  async updateByIdOrSku(
    productIdOrSku: string,
    data: Partial<UpdateProductDto & UpdateProductVariationDto>,
  ): Promise<boolean> {
    return this.productService.updateByIdOrSku(productIdOrSku, data);
  }

  //========================================variation-attribute==================================

  async createVariationAttribute(
    data: CreateVariationAttributeDto,
  ): Promise<VariationAttribute> {
    return this.productService.createVariationAttribute(data);
  }

  async updateVariationAttribute(
    id: string,
    data: UpdateVariationAttributeDto,
  ): Promise<VariationAttribute> {
    return this.productService.updateVariationAttribute(id, data);
  }

  async deleteVariationAttribute(id: string): Promise<boolean> {
    return this.productService.deleteVariationAttribute(id);
  }

  //========================================raw-material==========================================
  async createRawMaterial(
    rawMaterial: CreateRawMaterialDto,
  ): Promise<RawMaterial> {
    return this.productService.createRawMaterial(rawMaterial);
  }

  async getAllRawMaterials(): Promise<RawMaterial[]> {
    return this.productService.rawMaterialList();
  }

  async getRawMaterialById(id: string): Promise<RawMaterial> {
    return this.productService.rawMaterial(id);
  }

  async updateRawMaterial(
    id: string,
    rawMaterial: UpdateRawMaterialDto,
  ): Promise<RawMaterial> {
    return this.productService.updateRawMaterial(id, rawMaterial);
  }

  //==================================bom=============================================

  async createBom(bom: CreateBomDto): Promise<BOM> {
    return this.productService.createBom(bom);
  }

  async bomList(): Promise<BOM[]> {
    return this.productService.bomList();
  }

  async updateBom(id: string, bom: UpdateBomDto): Promise<BOM> {
    return this.productService.updateBom(id, bom);
  }
}
