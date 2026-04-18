import { Types } from 'mongoose';

const DynamicKeys = [
    {
        key: 'adminId',
        type: Types.ObjectId,
        ref: 'User',
        default: null,
        isEnable: true,
    },
];

export default DynamicKeys;
