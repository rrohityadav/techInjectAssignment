export class CreateRawMaterialDto {
  name: string;
  description?: string;
  unit: string;
  quantity?: number;
  supplier?: string;
}

export class UpdateRawMaterialDto {
  name?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  supplier?: string;
}
