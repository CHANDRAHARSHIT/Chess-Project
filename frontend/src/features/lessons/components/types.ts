export interface SlideData {
  id: string;
  title: string;
  content: string;
  hasBoard: boolean;
  fen?: string;
  annotations?: any;
}

export interface SegmentData {
  id: string;
  title: string;
  isExpanded: boolean;
  slides: SlideData[];
}
