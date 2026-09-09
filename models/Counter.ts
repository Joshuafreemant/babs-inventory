import { Model } from "mongoose";
import * as Mongoose from "mongoose";

/** Atomic sequence source for human-readable order codes (EMB-0001 ...). */
const counterSchema = new Mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

interface ICounterDocument extends Omit<Mongoose.Document, "_id"> {
  _id: string;
  seq: number;
}
interface ICounterModel extends Model<ICounterDocument> {}

const CounterModel: ICounterModel =
  (Mongoose.models.counter as ICounterModel) ||
  Mongoose.model<ICounterDocument>("counter", counterSchema);

/** Returns the next value in a named sequence, creating it on first use. */
export async function nextSeq(name: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc!.seq;
}

export default CounterModel;
