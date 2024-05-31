import { Area } from "./area";

export enum WrapperType {
  None,
  Input,
  Collapsible,
}

export class Wrapper {
  wrapperType = WrapperType.None;
  info = "";
  areas: Area[] = [];
}
