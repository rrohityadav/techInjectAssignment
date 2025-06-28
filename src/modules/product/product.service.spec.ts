import { PrismaClient, Product, RawMaterial, BOM, VariationAttribute } from '@prisma/client';
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
import {
  CreateRawMaterialDto,
  UpdateRawMaterialDto,
} from '@/modules/product/dto/raw-material.dto';
import { CreateBomDto, UpdateBomDto } from '@/modules/product/dto/bom-dto';
import {
  CreateVariationAttributeDto,
  UpdateVariationAttributeDto,
} from '@/modules/product/dto/variationAttribute.dto';

describe('ProductService', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let service: ProductService;

  beforeEach(() => {
    // create a partial mock of PrismaClient
    mockPrisma = {
      product: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      productVariation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      } as any,
      variationAttribute: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      rawMaterial: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      } as any,
      bOM: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      } as any,
    } as any;
    service = new ProductService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('creates product with no nested variations', async () => {
      const dto: CreateProductDto = { name: 'P1' };
      const fake: Product = { id: '1', name: 'P1', description: null, category: null, createdAt: new Date(), updatedAt: new Date(), variations: [] } as any;
      mockPrisma.product.create.mockResolvedValue(fake);

      const res = await service.createProduct(dto);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { name: 'P1', description: undefined, category: undefined, variations: undefined },
        include: { variations: { include: { attributes: true, bom: { include: { rawMaterial: true } } } } }
      });
      expect(res).toBe(fake);
    });

    it('creates product with nested variations, attributes and bom', async () => {
      const dto: CreateProductDto = {
        name: 'P2',
        variations: [
          {
            sku: 'SKU1',
            price: 10,
            stock: 5,
            attributes: [{ name: 'Size', value: 'L' }],
            bom: [{ rawMaterialId: 'rm1', quantityRequired: 2 }]
          }
        ]
      };
      const fake: Product = { id: '2', name: 'P2', description: null, category: null, createdAt: new Date(), updatedAt: new Date(), variations: [] } as any;
      mockPrisma.product.create.mockResolvedValue(fake);

      const res = await service.createProduct(dto);
      expect(mockPrisma.product.create).toHaveBeenCalled();
      expect(res).toBe(fake);
    });
  });

  describe('findAll', () => {
    it('returns paginated products without filters', async () => {
      const dto: FindAllProducts = {};
      mockPrisma.product.count.mockResolvedValue(3);
      const fake: any[] = [];
      mockPrisma.product.findMany.mockResolvedValue(fake);
      const res = await service.findAll(dto);
      expect(mockPrisma.product.count).toHaveBeenCalledWith({ where: {} });
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        take: 20,
        skip: 0,
        where: {},
        include: { variations: { include: { attributes: true, bom: { include: { rawMaterial: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
      expect(res).toEqual({ data: fake, meta: { page: 1, perPage: 20, total: 3 } });
    });

    it('applies search and category filters', async () => {
      const dto: FindAllProducts = { search: 'foo', category: 'cat', perPage: 2, limit: 5 };
      mockPrisma.product.count.mockResolvedValue(1);
      mockPrisma.product.findMany.mockResolvedValue([]);
      await service.findAll(dto);
      expect(mockPrisma.product.count).toHaveBeenCalled();
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns product when found', async () => {
      const fake: Product = { id: '1', name: 'x', description: null, category: null, createdAt: new Date(), updatedAt: new Date(), variations: [] } as any;
      mockPrisma.product.findUnique.mockResolvedValue(fake);
      const res = await service.findOne('1');
      expect(res).toBe(fake);
    });
    it('throws when not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow('Product not found');
    });
  });

  describe('findByIdOrSku', () => {
    it('returns product via variation SKU', async () => {
      const variation = { product: { id: 'p' } } as any;
      mockPrisma.productVariation.findUnique.mockResolvedValue(variation);
      const res = await service.findByIdOrSku('SKU');
      expect(res).toBe(variation.product);
    });
    it('falls back to findUnique by ID', async () => {
      mockPrisma.productVariation.findUnique.mockResolvedValue(null);
      const fake = { id: 'p2' } as any;
      mockPrisma.product.findUnique.mockResolvedValue(fake);
      const res = await service.findByIdOrSku('p2');
      expect(res).toBe(fake);
    });
  });

  describe('updateProduct', () => {
    it('updates and returns product', async () => {
      const dto: UpdateProductDto = { name: 'new' };
      const fake: Product = { id: '1', name: 'new', description: null, category: null, createdAt: new Date(), updatedAt: new Date(), variations: [] } as any;
      mockPrisma.product.update.mockResolvedValue(fake);
      const res = await service.updateProduct('1', dto);
      expect(res).toBe(fake);
    });
  });

  describe('updateByIdOrSku', () => {
    it('updates variation when SKU matches', async () => {
      mockPrisma.productVariation.findUnique.mockResolvedValue({} as any);
      const dto: UpdateProductVariationDto = { price: 5, stock: 2 };
      mockPrisma.productVariation.update.mockResolvedValue({} as any);
      const res = await service.updateByIdOrSku('SKU', dto);
      expect(res).toBe(true);
    });
    it('updates product when ID matches', async () => {
      mockPrisma.productVariation.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue({} as any);
      mockPrisma.product.update.mockResolvedValue({} as any);
      const res = await service.updateByIdOrSku('ID', { name: 'n' });
      expect(res).toBe(true);
    });
    it('returns false when neither matches', async () => {
      mockPrisma.productVariation.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      const res = await service.updateByIdOrSku('X', {});
      expect(res).toBe(false);
    });
  });

  describe('remove', () => {
    it('deletes and returns true', async () => {
      mockPrisma.product.delete.mockResolvedValue({} as any);
      await expect(service.remove('1')).resolves.toBe(true);
    });
    it('throws if delete fails', async () => {
      mockPrisma.product.delete.mockRejectedValue(new Error());
      await expect(service.remove('x')).rejects.toThrow();
    });
  });

  describe('variation attributes', () => {
    it('creates attribute', async () => {
      const dto: CreateVariationAttributeDto = { name: 'n', value: 'v', variationId: 'vid' };
      const fake: VariationAttribute = { id: 'a', name: 'n', value: 'v', variationId: 'vid' };
      mockPrisma.variationAttribute.create.mockResolvedValue(fake);
      await expect(service.createVariationAttribute(dto)).resolves.toBe(fake);
    });
    it('updates attribute', async () => {
      const fake: VariationAttribute = { id: 'a', name: 'n', value: 'v', variationId: 'x' };
      mockPrisma.variationAttribute.update.mockResolvedValue(fake);
      await expect(service.updateVariationAttribute('a', { name: 'nn' })).resolves.toBe(fake);
    });
    it('deletes attribute', async () => {
      mockPrisma.variationAttribute.delete.mockResolvedValue({} as any);
      await expect(service.deleteVariationAttribute('a')).resolves.toBe(true);
    });
  });

  describe('raw material', () => {
    it('creates', async () => {
      const dto: CreateRawMaterialDto = { name: 'r', unit: 'u' };
      const fake: RawMaterial = { id: 'r1', name: 'r', description: null, unit: 'u', quantity: 0, supplier: null, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.rawMaterial.create.mockResolvedValue(fake);
      await expect(service.createRawMaterial(dto)).resolves.toBe(fake);
    });
    it('lists', async () => {
      const list: RawMaterial[] = [{ id: 'r', name: 'x', description: null, unit: 'u', quantity: 0, supplier: null, createdAt: new Date(), updatedAt: new Date() }];
      mockPrisma.rawMaterial.findMany.mockResolvedValue(list);
      await expect(service.rawMaterialList()).resolves.toBe(list);
    });
    it('get by id', async () => {
      const fake = { id: 'x' } as RawMaterial;
      mockPrisma.rawMaterial.findUnique.mockResolvedValue(fake);
      await expect(service.rawMaterial('x')).resolves.toBe(fake);
    });
    it('throws if not found by id', async () => {
      mockPrisma.rawMaterial.findUnique.mockResolvedValue(null);
      await expect(service.rawMaterial('x')).rejects.toThrow('Raw Material not found');
    });
    it('updates', async () => {
      const fake = { id: 'x' } as RawMaterial;
      mockPrisma.rawMaterial.update.mockResolvedValue(fake);
      await expect(service.updateRawMaterial('x', {})).resolves.toBe(fake);
    });
  });

  describe('BOM', () => {
    it('creates', async () => {
      const dto: CreateBomDto = { variationId: 'v', rawMaterialId: 'r', quantityRequired: 2 };
      const fake: BOM = { id: 'b1', variationId: 'v', rawMaterialId: 'r', quantityRequired: 2 };
      mockPrisma.bOM.create.mockResolvedValue(fake);
      await expect(service.createBom(dto)).resolves.toBe(fake);
    });
    it('lists', async () => {
      const list: BOM[] = [{ id: 'b', variationId: 'v', rawMaterialId: 'r', quantityRequired: 1 }];
      mockPrisma.bOM.findMany.mockResolvedValue(list);
      await expect(service.bomList()).resolves.toBe(list);
    });
    it('updates', async () => {
      const fake: BOM = { id: 'b', variationId: 'v', rawMaterialId: 'r', quantityRequired: 1 };
      mockPrisma.bOM.update.mockResolvedValue(fake);
      await expect(service.updateBom('b', {})).resolves.toBe(fake);
    });
  });
});
