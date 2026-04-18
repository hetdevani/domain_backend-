import { Document, Types } from 'mongoose';

export interface INotification extends Document {
  title: string;
  description: string;
  userId: Types.ObjectId;
  status: number;
  type: number;
  priority: number;
  updatedBy: Types.ObjectId;
}

