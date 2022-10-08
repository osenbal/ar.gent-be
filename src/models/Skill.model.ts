import { model, Schema } from 'mongoose';
import { ISkill } from '@interfaces/user.interface';

const SkillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
});

const SkillModel = model<ISkill>('Skill', SkillSchema);

export default SkillModel;
