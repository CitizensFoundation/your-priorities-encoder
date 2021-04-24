interface AcBackgroundJobAttributes {
  id: number;
  data: object;
  error: string;
  progress: number;
  created_at?: Date;
  updated_at?: Date;
}