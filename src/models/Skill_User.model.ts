import { model, Schema } from 'mongoose';
import { ISkill_User } from '@interfaces/user.interface';

const SkillUserSchema = new Schema<ISkill_User>({
  skillId: { type: Schema.Types.ObjectId, ref: 'Skill' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const SkillUserModel = model<ISkill_User>('SkillUser', SkillUserSchema);

export default SkillUserModel;
