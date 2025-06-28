import { PrismaClient, Product, RawMaterial } from '@prisma/client';
import {
  CreateProductDto,
  FindAllProducts,
  PaginationResponse,
} from '@/modules/product/dto/create-product.dto';
import {
  UpdateProductDto,
  UpdateProductVariationDto,
} from '@/modules/product/dto/update-product.dto';
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

export class ProductService {
  constructor(private readonly prisma: PrismaClient) {}

  async createProduct(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        variations: data.variations
          ? {
              create: data.variations.map((variation) => ({
                sku: variation.sku,
                price: variation.price,
                stock: variation.stock,
                attributes: variation.attributes
                  ? {
                      create: variation.attributes.map((attr) => ({
                        name: attr.name,
                        value: attr.value,
                      })),
                    }
                  : undefined,
                bom: variation.bom
                  ? {
                      create: variation.bom.map((b) => ({
                        rawMaterialId: b.rawMaterialId,
                        quantityRequired: b.quantityRequired,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        variations: {
          include: {
            attributes: true,
            bom: { include: { rawMaterial: true } },
          },
        },
      },
    });
  }

  async findAll(
    data: FindAllProducts,
  ): Promise<PaginationResponse<ProductDetailsResponse[]>> {
    const { perPage = 1, limit = 20, search, category } = data;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          variations: {
            some: {
              sku: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Count total records (based on filter)
    const total: number = await this.prisma.product.count({ where });

    // Get data with pagination
    const products: ProductDetailsResponse[] =
      await this.prisma.product.findMany({
        take: limit,
        skip: (perPage - 1) * limit,
        where,
        include: {
          variations: {
            include: {
              attributes: true,
              bom: {
                include: { rawMaterial: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    // Return response in PaginationResponse<T> format
    return {
      data: products,
      meta: {
        page: perPage,
        perPage: limit,
        total,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const result = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variations: {
          include: {
            attributes: true,
            bom: {
              include: {
                rawMaterial: true,
              },
            },
          },
        },
      },
    });

    if (result) return result;
    else throw new Error('Product not found');
  }

  async findByIdOrSku(
    productIdOrSku: string,
  ): Promise<ProductDetailsResponse | null> {
    const variation = await this.prisma.productVariation.findUnique({
      where: { sku: productIdOrSku },
      include: {
        product: {
          include: {
            variations: {
              include: {
                attributes: true,
                bom: {
                  include: { rawMaterial: true },
                },
              },
            },
          },
        },
      },
    });
    if (variation) return variation.product;

    // Try finding by Product ID
    return this.prisma.product.findUnique({
      where: { id: productIdOrSku },
      include: {
        variations: {
          include: {
            attributes: true,
            bom: {
              include: { rawMaterial: true },
            },
          },
        },
      },
    });
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const result = await this.prisma.product.update({
      where: { id },
      data,
    });
    if (result) return result;
    else throw new Error('Product do not update');
  }

  async updateByIdOrSku(
    productIdOrSku: string,
    data: Partial<UpdateProductDto & UpdateProductVariationDto>,
  ): Promise<boolean> {
    //Update as a Product Variation (by SKU)
    const variation = await this.prisma.productVariation.findUnique({
      where: { sku: productIdOrSku },
    });

    if (variation) {
      await this.prisma.productVariation.update({
        where: { sku: productIdOrSku },
        data: {
          price: data.price,
          stock: data.stock,
        },
      });
      return true;
    }

    // update as a Product (by ID)
    const product = await this.prisma.product.findUnique({
      where: { id: productIdOrSku },
    });

    if (product) {
      await this.prisma.product.update({
        where: { id: productIdOrSku },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
        },
      });
      return true;
    }

    return false;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.prisma.product.delete({ where: { id } });
    if (deleted) return true;
    else throw new Error('Product not found');
  }

  //======================================variation-attributes===============================================

  async createVariationAttribute(
    data: CreateVariationAttributeDto,
  ): Promise<VariationAttribute> {
    return this.prisma.variationAttribute.create({ data });
  }

  async updateVariationAttribute(
    id: string,
    data: UpdateVariationAttributeDto,
  ): Promise<VariationAttribute> {
    return this.prisma.variationAttribute.update({
      where: { id },
      data: {
        name: data.name,
        value: data.value,
      },
    });
  }

  async deleteVariationAttribute(id: string): Promise<boolean> {
    await this.prisma.variationAttribute.delete({
      where: { id },
    });
    return true;
  }

  //==========================raw-material=======================================================================
  async createRawMaterial(data: CreateRawMaterialDto): Promise<RawMaterial> {
    return this.prisma.rawMaterial.create({ data });
  }

  async rawMaterialList(): Promise<RawMaterial[]> {
    const result = await this.prisma.rawMaterial.findMany();
    if (result) return result;
    throw new Error('Raw Material not found');
  }

  async rawMaterial(id: string): Promise<RawMaterial> {
    const rm = await this.prisma.rawMaterial.findUnique({ where: { id } });
    if (!rm) throw new Error('Raw Material not found');
    return rm;
  }

  async updateRawMaterial(
    id: string,
    data: UpdateRawMaterialDto,
  ): Promise<RawMaterial> {
    return this.prisma.rawMaterial.update({ where: { id }, data });
  }

  //=============================bom===============================================

  async createBom(data: CreateBomDto): Promise<BOM> {
    return this.prisma.bOM.create({ data });
  }

  async bomList(): Promise<BOM[]> {
    const result = await this.prisma.bOM.findMany();
    if (result) return result;
    throw new Error('BOM not found');
  }

  async updateBom(id: string, data: UpdateBomDto): Promise<BOM> {
    return this.prisma.bOM.update({ where: { id }, data });
  }
}
