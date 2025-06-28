export class CreateVariationAttributeDto {
  name: string;
  value: string;
  variationId: string;
}

export class UpdateVariationAttributeDto {
  name?: string;
  value?: string;
}
