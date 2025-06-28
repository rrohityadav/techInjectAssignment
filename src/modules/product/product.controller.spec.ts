import { ProductController } from './product.controller';
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
import { CreateRawMaterialDto, UpdateRawMaterialDto } from '@/modules/product/dto/raw-material.dto';
import { CreateBomDto, UpdateBomDto } from '@/modules/product/dto/bom-dto';
import {
  CreateVariationAttributeDto,
  UpdateVariationAttributeDto,
} from '@/modules/product/dto/variationAttribute.dto';
import { Product, RawMaterial, BOM, VariationAttribute } from '@prisma/client';
import { ProductDetailsResponse } from '@/modules/product/dto/response-type';

describe('ProductController', () => {
  let mockService: jest.Mocked<ProductService>;
  let controller: ProductController;

  beforeEach(() => {
    mockService = {
      createProduct: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateProduct: jest.fn(),
      remove: jest.fn(),
      findByIdOrSku: jest.fn(),
      updateByIdOrSku: jest.fn(),
      createVariationAttribute: jest.fn(),
      updateVariationAttribute: jest.fn(),
      deleteVariationAttribute: jest.fn(),
      createRawMaterial: jest.fn(),
      rawMaterialList: jest.fn(),
      rawMaterial: jest.fn(),
      updateRawMaterial: jest.fn(),
      createBom: jest.fn(),
      bomList: jest.fn(),
      updateBom: jest.fn(),
    } as any;
    controller = new ProductController(mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should delegate to service.createProduct', async () => {
      const dto: CreateProductDto = { name: 'P1' };
      const fake: Product = { id: '1', name: 'P1', description: null, category: null, createdAt: new Date(), updatedAt: new Date() } as any;
      // @ts-ignore
      mockService.createProduct.mockResolvedValue(fake);

      const result = await controller.createProduct(dto);
      expect(mockService.createProduct).toHaveBeenCalledWith(dto);
      expect(result).toBe(fake);
    });
  });

  describe('getAllProducts', () => {
    it('should delegate to service.findAll and return pagination', async () => {
      const dto: FindAllProducts = { perPage: 2, limit: 5, search: 'foo', category: 'cat' };
      const fakeData: ProductDetailsResponse[] = [{
        id: 'p1',
        name: 'P1',
        description: null,
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        variations: [],
      }];
      const fake: PaginationResponse<ProductDetailsResponse[]> = {
        data: fakeData,
        meta: { page: 2, perPage: 5, total: 10 },
      };
      mockService.findAll.mockResolvedValue(fake);

      const result = await controller.getAllProducts(dto);
      expect(mockService.findAll).toHaveBeenCalledWith(dto);
      expect(result).toBe(fake);
    });
  });

  describe('getProductById', () => {
    it('should delegate to service.findOne', async () => {
      const fake: Product = { id: 'x', name: 'X', description: null, category: null, createdAt: new Date(), updatedAt: new Date() } as any;
      mockService.findOne.mockResolvedValue(fake);

      const result = await controller.getProductById('x');
      expect(mockService.findOne).toHaveBeenCalledWith('x');
      expect(result).toBe(fake);
    });
  });

  describe('updateProduct', () => {
    it('should delegate to service.updateProduct', async () => {
      const dto: UpdateProductDto = { name: 'New' };
      const fake: Product = { id: '1', name: 'New', description: null, category: null, createdAt: new Date(), updatedAt: new Date() } as any;
      mockService.updateProduct.mockResolvedValue(fake);

      const result = await controller.updateProduct('1', dto);
      expect(mockService.updateProduct).toHaveBeenCalledWith('1', dto);
      expect(result).toBe(fake);
    });
  });

  describe('deleteProduct', () => {
    it('should delegate to service.remove', async () => {
      mockService.remove.mockResolvedValue(true);
      const result = await controller.deleteProduct('1');
      expect(mockService.remove).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });
  });

  describe('findByIdOrSku', () => {
    it('should delegate to service.findByIdOrSku', async () => {
      const fake: ProductDetailsResponse = {
        id: 'p', name: 'P', description: null, category: null,
        createdAt: new Date(), updatedAt: new Date(), variations: [],
      };
      mockService.findByIdOrSku.mockResolvedValue(fake);

      const result = await controller.findByIdOrSku('sku');
      expect(mockService.findByIdOrSku).toHaveBeenCalledWith('sku');
      expect(result).toBe(fake);
    });
  });

  describe('updateByIdOrSku', () => {
    it('should delegate to service.updateByIdOrSku', async () => {
      const data: Partial<UpdateProductDto & UpdateProductVariationDto> = { price: 5 };
      mockService.updateByIdOrSku.mockResolvedValue(true);

      const result = await controller.updateByIdOrSku('skuOrId', data);
      expect(mockService.updateByIdOrSku).toHaveBeenCalledWith('skuOrId', data);
      expect(result).toBe(true);
    });
  });

  describe('variation-attribute methods', () => {
    it('createVariationAttribute', async () => {
      const dto: CreateVariationAttributeDto = { name: 'N', value: 'V', variationId: 'v1' };
      const fake: VariationAttribute = { id: 'a1', name: 'N', value: 'V', variationId: 'v1' };
      mockService.createVariationAttribute.mockResolvedValue(fake);

      const result = await controller.createVariationAttribute(dto);
      expect(mockService.createVariationAttribute).toHaveBeenCalledWith(dto);
      expect(result).toBe(fake);
    });

    it('updateVariationAttribute', async () => {
      const dto: UpdateVariationAttributeDto = { value: 'VV' };
      const fake: VariationAttribute = { id: 'a1', name: 'N', value: 'VV', variationId: 'v1' };
      mockService.updateVariationAttribute.mockResolvedValue(fake);

      const result = await controller.updateVariationAttribute('a1', dto);
      expect(mockService.updateVariationAttribute).toHaveBeenCalledWith('a1', dto);
      expect(result).toBe(fake);
    });

    it('deleteVariationAttribute', async () => {
      mockService.deleteVariationAttribute.mockResolvedValue(true);
      const result = await controller.deleteVariationAttribute('a1');
      expect(mockService.deleteVariationAttribute).toHaveBeenCalledWith('a1');
      expect(result).toBe(true);
    });
  });

  describe('raw-material methods', () => {
    it('createRawMaterial', async () => {
      const dto: CreateRawMaterialDto = { name: 'R', unit: 'U' };
      const fake: RawMaterial = { id: 'r1', name: 'R', description: null, unit: 'U', quantity: 0, supplier: null, createdAt: new Date(), updatedAt: new Date() };
      mockService.createRawMaterial.mockResolvedValue(fake);

      const result = await controller.createRawMaterial(dto);
      expect(mockService.createRawMaterial).toHaveBeenCalledWith(dto);
      expect(result).toBe(fake);
    });

    it('getAllRawMaterials', async () => {
      const list: RawMaterial[] = [{ id: 'r1', name: 'X', description: null, unit: 'U', quantity: 0, supplier: null, createdAt: new Date(), updatedAt: new Date() }];
      mockService.rawMaterialList.mockResolvedValue(list);

      const result = await controller.getAllRawMaterials();
      expect(mockService.rawMaterialList).toHaveBeenCalled();
      expect(result).toBe(list);
    });

    it('getRawMaterialById', async () => {
      const fake: RawMaterial = { id: 'r2', name: 'Y', description: null, unit: 'U', quantity: 0, supplier: null, createdAt: new Date(), updatedAt: new Date() };
      mockService.rawMaterial.mockResolvedValue(fake);

      const result = await controller.getRawMaterialById('r2');
      expect(mockService.rawMaterial).toHaveBeenCalledWith('r2');
      expect(result).toBe(fake);
    });

    it('updateRawMaterial', async () => {
      const dto: UpdateRawMaterialDto = { name: 'Z' };
      const fake: RawMaterial = { id: 'r3', name: 'Z', description: null, unit: 'U', quantity: 0, supplier: null, createdAt: new Date(), updatedAt: new Date() };
      mockService.updateRawMaterial.mockResolvedValue(fake);

      const result = await controller.updateRawMaterial('r3', dto);
      expect(mockService.updateRawMaterial).toHaveBeenCalledWith('r3', dto);
      expect(result).toBe(fake);
    });
  });

  describe('BOM methods', () => {
    it('createBom', async () => {
      const dto: CreateBomDto = { variationId: 'v1', rawMaterialId: 'r1', quantityRequired: 2 };
      const fake: BOM = { id: 'b1', variationId: 'v1', rawMaterialId: 'r1', quantityRequired: 2 };
      mockService.createBom.mockResolvedValue(fake);

      const result = await controller.createBom(dto);
      expect(mockService.createBom).toHaveBeenCalledWith(dto);
      expect(result).toBe(fake);
    });

    it('bomList', async () => {
      const list: BOM[] = [{ id: 'b2', variationId: 'v2', rawMaterialId: 'r2', quantityRequired: 3 }];
      mockService.bomList.mockResolvedValue(list);

      const result = await controller.bomList();
      expect(mockService.bomList).toHaveBeenCalled();
      expect(result).toBe(list);
    });

    it('updateBom', async () => {
      const dto: UpdateBomDto = { quantityRequired: 5 };
      const fake: BOM = { id: 'b3', variationId: 'v3', rawMaterialId: 'r3', quantityRequired: 5 };
      mockService.updateBom.mockResolvedValue(fake);

      const result = await controller.updateBom('b3', dto);
      expect(mockService.updateBom).toHaveBeenCalledWith('b3', dto);
      expect(result).toBe(fake);
    });
  });
});
