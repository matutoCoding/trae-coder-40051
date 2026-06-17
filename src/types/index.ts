export interface ProcessCard {
  id: string;
  code: string;
  name: string;
  material: string;
  carburizingTemp: number;
  carburizingTime: number;
  quenchingTemp: number;
  quenchingMedium: string;
  temperingTemp: number;
  temperingTime: number;
  layerDepthMin: number;
  layerDepthMax: number;
  hardnessMin: number;
  hardnessMax: number;
  coreHardnessMin: number;
  coreHardnessMax: number;
  remark?: string;
  version: string;
  status: "active" | "draft" | "obsolete";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type BatchStatus =
  | "pending"
  | "loading"
  | "carburizing"
  | "quenching"
  | "tempering"
  | "inspecting"
  | "correcting"
  | "completed";

export interface FurnaceBatch {
  id: string;
  furnaceNo: string;
  batchNo: string;
  processCardId: string;
  processCardName?: string;
  status: BatchStatus;
  startTime: string;
  endTime?: string;
  operator: string;
  totalQuantity: number;
  passQuantity?: number;
  failQuantity?: number;
  remark?: string;
}

export interface PartItem {
  id: string;
  batchId: string;
  partNo: string;
  partName: string;
  quantity: number;
  position: string;
  customer?: string;
  drawingNo?: string;
}

export interface TempPoint {
  time: number;
  temp: number;
}

export interface CarburizingRecord {
  id: string;
  batchId: string;
  furnaceNo: string;
  startTemp: number;
  targetTemp: number;
  tempCurve: TempPoint[];
  layerDepths: number[];
  quenchingMediumTemp: number;
  oilTankStartTemp: number;
  oilTankEndTemp: number;
  coolingDuration: number;
  operator: string;
  recorder: string;
  recordTime: string;
  remark?: string;
}

export interface TemperingRecord {
  id: string;
  batchId: string;
  furnaceNo: string;
  targetTemp: number;
  holdingTime: number;
  tempCurve: TempPoint[];
  operator: string;
  recorder: string;
  recordTime: string;
  remark?: string;
}

export interface MetallographyRecord {
  id: string;
  batchId: string;
  sampleNo: string;
  partNo: string;
  pearliteLevel?: string;
  ferriteContent?: string;
  martensiteLevel: string;
  carbideLevel?: string;
  retainedAustenite?: string;
  structureLevel: string;
  result: "pass" | "fail" | "pending";
  inspector: string;
  recordTime: string;
  remark?: string;
  imageUrl?: string;
}

export interface HardnessRecord {
  id: string;
  batchId: string;
  sampleNo: string;
  partNo: string;
  testType: "rockwell" | "core";
  surfaceValues: number[];
  coreValues: number[];
  surfaceAvg: number;
  coreAvg: number;
  result: "pass" | "fail" | "pending";
  inspector: string;
  recordTime: string;
  remark?: string;
}

export interface DeformationRecord {
  id: string;
  batchId: string;
  partNo: string;
  partName: string;
  measurementPoint: string;
  beforeValue: number;
  standardValue: number;
  tolerance: number;
  afterValue?: number;
  correctionMethod: string;
  correctionTimes: number;
  recheckValue?: number;
  result: "pass" | "fail" | "pending" | "correcting";
  operator: string;
  inspector: string;
  recordTime: string;
  remark?: string;
}

export interface TraceabilityRecord {
  batchId: string;
  process: ProcessCard;
  batch: FurnaceBatch;
  parts: PartItem[];
  carburizing?: CarburizingRecord;
  tempering?: TemperingRecord;
  metallography?: MetallographyRecord[];
  hardness?: HardnessRecord[];
  deformation?: DeformationRecord[];
}

export type DispositionStatus = "pending" | "reviewed" | "rework" | "concession";

export interface AbnormalDisposition {
  id: string;
  batchId: string;
  abnormalKey: string;
  abnormalType: "missing" | "fail" | "limit";
  abnormalDetail: string;
  status: DispositionStatus;
  operator?: string;
  remark?: string;
  updatedAt: string;
}

export type BatchFinalConclusion = "pending" | "qualified" | "rework" | "concession" | "scrap";

export interface BatchDisposition {
  batchId: string;
  finalConclusion: BatchFinalConclusion;
  reviewer?: string;
  remark?: string;
  updatedAt: string;
}
