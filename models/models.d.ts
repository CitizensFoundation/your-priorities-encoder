interface AcBackgroundJobDataAttributes {
  status: string;
  finalDuration: number;
}

interface AcBackgroundJobAttributes {
  id: number;
  data: AcBackgroundJobDataAttributes;
  error: string;
  progress: number;
  created_at?: Date;
  updated_at?: Date;
}

interface JobDataAttributes {
  fileKey: string;
  duration: string;
  thumbnailPattern: string;
  flacFilename: string;
  portrait: boolean;
  acBackgroundJobId: number;
}