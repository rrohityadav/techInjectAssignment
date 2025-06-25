import { ProductService } from './product.service';
import { Product } from '@prisma/client';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  async getAllProducts(): Promise<Product[]> {
    // TODO: Add any specific controller logic if needed (e.g., request transformation)
    return this.productService.findAll();
  }

  // TODO: Implement other controller methods (create, findOne, update, remove)
}
