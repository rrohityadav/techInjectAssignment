import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaClient } from '@prisma/client';
import {
  CreateProductDto,
  FindAllProducts,
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

export default async function productRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { prisma: PrismaClient },
) {
  const productService = new ProductService(options.prisma);
  const productController = new ProductController(productService);

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Product'],
        summary: 'Get all products with pagination and filters',
        querystring: {
          type: 'object',
          properties: {
            perPage: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, default: 10 },
            search: { type: 'string' },
            category: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Successful response with paginated products',
            type: 'object',
            properties: {
              data: {
                type: 'array',
                description: 'List of products',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    category: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    variations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          sku: { type: 'string' },
                          price: { type: 'number' },
                          stock: { type: 'integer' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                          attributes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                value: { type: 'string' },
                                variationId: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  perPage: { type: 'integer' },
                  total: { type: 'integer' },
                },
                required: ['page', 'perPage', 'total'],
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: FindAllProducts }>,
      reply: FastifyReply,
    ) => {
      const result = await productController.getAllProducts(request.query);
      return reply.send(result); // This must return PaginationResponse<Product[]>
    },
  );

  // Create Product with Variations and BOM
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Product'],
        summary: 'Create a product with variations',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            variations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['sku', 'price', 'stock'],
                properties: {
                  sku: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'integer' },
                  attributes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['name', 'value'],
                      properties: {
                        name: { type: 'string' },
                        value: { type: 'string' },
                      },
                    },
                  },
                  bom: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['rawMaterialId', 'quantityRequired'],
                      properties: {
                        rawMaterialId: { type: 'string' },
                        quantityRequired: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: 'Product created successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              category: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              variations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sku: { type: 'string' },
                    price: { type: 'number' },
                    stock: { type: 'integer' },
                    attributes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          value: { type: 'string' },
                        },
                      },
                    },
                    bom: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          quantityRequired: { type: 'number' },
                          rawMaterial: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              unit: { type: 'string' },
                              quantity: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateProductDto }>,
      reply: FastifyReply,
    ) => {
      const product = await productController.createProduct(request.body);
      reply.code(201).send(product);
    },
  );

  // Get Product by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Product'],
        summary: 'Get product by ID with full details',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              variations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sku: { type: 'string' },
                    price: { type: 'number' },
                    stock: { type: 'integer' },
                    attributes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          value: { type: 'string' },
                        },
                      },
                    },
                    bom: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          quantityRequired: { type: 'number' },
                          rawMaterial: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              unit: { type: 'string' },
                              quantity: { type: 'number' },
                              supplier: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const product = await productController.getProductById(request.params.id);
      return reply.send(product);
    },
  );

  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Product'],
        summary: 'Update a product',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateProductDto;
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const success = await productController.updateProduct(id, request.body);
      return reply.send(success);
    },
  );

  fastify.put(
    '/v1/updateByIdOrSku/:productIdOrSku',
    {
      schema: {
        tags: ['Product'],
        summary: 'Update a Product or ProductVariation by ID or SKU',
        params: {
          type: 'object',
          required: ['productIdOrSku'],
          properties: {
            productIdOrSku: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            // For Product
            name: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            category: { type: 'string', nullable: true },

            // For ProductVariation
            price: { type: 'number', nullable: true },
            stock: { type: 'integer', nullable: true },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { productIdOrSku: string };
        Body: Partial<UpdateProductDto & UpdateProductVariationDto>;
      }>,
      reply: FastifyReply,
    ) => {
      const { productIdOrSku } = request.params;
      const updateData = request.body;

      const success = await productController.updateByIdOrSku(
        productIdOrSku,
        updateData,
      );

      if (!success) {
        return reply
          .code(404)
          .send({ success: false, message: 'Product or Variation not found' });
      }

      return reply.send({ success: true, message: 'Updated successfully' });
    },
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Product'],
        summary: 'Delete a product',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const success = await productController.deleteProduct(id);
      reply.send({ success });
    },
  );

  fastify.get(
    '/byIdOrSku/:productIdOrSku',
    {
      schema: {
        tags: ['Product'],
        summary: 'Get product or variation details by ID or SKU',
        params: {
          type: 'object',
          required: ['productIdOrSku'],
          properties: {
            productIdOrSku: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Product details',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              category: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              variations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sku: { type: 'string' },
                    price: { type: 'number' },
                    stock: { type: 'integer' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    attributes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          value: { type: 'string' },
                          variationId: { type: 'string' },
                        },
                      },
                    },
                    bom: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          variationId: { type: 'string' },
                          rawMaterialId: { type: 'string' },
                          quantityRequired: { type: 'number' },
                          rawMaterial: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              description: { type: 'string', nullable: true },
                              unit: { type: 'string' },
                              quantity: { type: 'number' },
                              supplier: { type: 'string', nullable: true },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              updatedAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'Product not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { productIdOrSku: string } }>,
      reply: FastifyReply,
    ) => {
      const { productIdOrSku } = request.params;
      const product = await productController.findByIdOrSku(productIdOrSku);
      if (!product) {
        return reply.code(404).send({ message: 'Product not found' });
      }
      return reply.send(product);
    },
  );

  //=====================================variation-attributes=================================

  fastify.post(
    '/variation-attributes',
    {
      schema: {
        tags: ['Variation-attributes'],
        required: ['name', 'value', 'variationId'],
        summary: 'Create a variations attributes',
        body: {
          name: { type: 'string' },
          value: { type: 'string' },
          variationId: { type: 'string' },
        },
        response: {
          201: {
            description: 'Product created successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              value: { type: 'string' },
              variationId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateVariationAttributeDto }>,
      reply: FastifyReply,
    ) => {
      const product = await productController.createVariationAttribute(
        request.body,
      );
      reply.code(201).send(product);
    },
  );

  fastify.put(
    '/update/variation-attributes/:id',
    {
      schema: {
        tags: ['Variation-attributes'],
        required: ['name', 'value', 'variationId'],
        summary: 'Create a variations attributes',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          name: { type: 'string', nullable: true },
          value: { type: 'string', nullable: true },
        },
        response: {
          201: {
            description: 'Product created successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              value: { type: 'string' },
              variationId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateVariationAttributeDto;
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const success = await productController.updateVariationAttribute(
        id,
        request.body,
      );
      return reply.send(success);
    },
  );

  fastify.delete(
    'delete/variation-attributes/:id',
    {
      schema: {
        tags: ['Variation-attributes'],
        summary: 'Delete a variation-attributes',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const success = await productController.deleteVariationAttribute(id);
      reply.send({ success });
    },
  );

  //====================================raw-material==========================================

  fastify.post(
    '/create/raw-material',
    {
      schema: {
        tags: ['Raw Material'],
        summary: 'Create a raw material',
        body: {
          type: 'object',
          required: ['name', 'unit'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            unit: { type: 'string' },
            quantity: { type: 'number', nullable: true },
            supplier: { type: 'string', nullable: true },
          },
        },
        response: {
          201: {
            description: 'Raw material created successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              unit: { type: 'string' },
              quantity: { type: 'number', nullable: true },
              supplier: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateRawMaterialDto }>,
      reply: FastifyReply,
    ) => {
      const rawMaterial = await productController.createRawMaterial(
        request.body,
      );
      reply.code(201).send(rawMaterial);
    },
  );

  fastify.get(
    '/raw-material/list',
    {
      schema: {
        tags: ['Raw Material'],
        summary: 'Create a raw material',
        response: {
          201: {
            description: 'Raw material list fetch successfully',
            type: 'array',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              unit: { type: 'string' },
              quantity: { type: 'string', nullable: true },
              supplier: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawMaterial = await productController.getAllRawMaterials();
      reply.code(201).send(rawMaterial);
    },
  );

  fastify.get(
    '/raw-material/single/:id',
    {
      schema: {
        tags: ['Raw Material'],
        summary: 'Get a raw material by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Single raw material fetched successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              unit: { type: 'string' },
              quantity: { type: 'number' },
              supplier: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            description: 'Raw material not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const rawMaterial = await productController.getRawMaterialById(
        request.params.id,
      );
      reply.code(201).send(rawMaterial);
    },
  );

  fastify.put(
    'raw-material/update/:id',
    {
      schema: {
        tags: ['Raw Material'],
        summary: 'Update a raw material by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['name', 'unit'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            unit: { type: 'string' },
            quantity: { type: 'number', nullable: true },
            supplier: { type: 'string', nullable: true },
          },
        },
        response: {
          200: {
            description: 'Raw material updated successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              unit: { type: 'string' },
              quantity: { type: 'number' },
              supplier: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateRawMaterialDto;
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const success = await productController.updateRawMaterial(
        id,
        request.body,
      );
      return reply.send(success);
    },
  );

  //====================================bom==========================================

  fastify.post(
    'bom/create',
    {
      schema: {
        tags: ['Bom'],
        summary: 'Create Bom',
        body: {
          type: 'object',
          required: ['quantityRequired', 'variationId', 'rawMaterialId'],
          properties: {
            quantityRequired: { type: 'number' },
            variationId: { type: 'string' },
            rawMaterialId: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Raw material updated successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              quantityRequired: { type: 'number' },
              variationId: { type: 'string' },
              rawMaterialId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateBomDto }>,
      reply: FastifyReply,
    ) => {
      const success = await productController.createBom(request.body);
      return reply.send(success);
    },
  );

  fastify.get(
    '/bom/list',
    {
      schema: {
        tags: ['Bom'],
        summary: 'Fetch bom list',
        response: {
          201: {
            description: 'Bom list fetch successfully',
            type: 'array',
            properties: {
              id: { type: 'string' },
              quantityRequired: { type: 'number' },
              variationId: { type: 'string' },
              rawMaterialId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawMaterial = await productController.bomList();
      reply.code(201).send(rawMaterial);
    },
  );

  fastify.put(
    'bom/update/:id',
    {
      schema: {
        tags: ['Bom'],
        summary: 'Update a bom by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: [],
          properties: {
            quantityRequired: { type: 'number', nullable: true },
            variationId: { type: 'string', nullable: true },
            rawMaterialId: { type: 'string', nullable: true },
          },
        },
        response: {
          200: {
            description: 'Bom updated successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              quantityRequired: { type: 'number' },
              variationId: { type: 'string' },
              rawMaterialId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateBomDto }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const success = await productController.updateBom(id, request.body);
      return reply.send(success);
    },
  );

  // TODO: Add more product routes (POST, GET by ID, PUT, DELETE)
}
