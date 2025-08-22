// Shared types for admin dashboard components
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

export interface Session {
  _id: string;
  userId: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  subject?: string;
  lessonTopic?: string;
  level?: string;
  configStep?: number;
  [key: string]: any;
}

export interface FinetuneData {
  _id: string;
  userId: string;
  step: number;
  userInfo?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  inputData?: {
    subject?: string;
    lessonTopic?: string;
  };
  feedback?: {
    overallScore?: number;
  };
  timestamp?: string;
  finetuningFormat?: any;
  [key: string]: any;
}
