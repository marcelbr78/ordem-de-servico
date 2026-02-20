import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: () => {
        return cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbf5vyte3',
            api_key: process.env.CLOUDINARY_API_KEY || '629316541111726',
            api_secret: process.env.CLOUDINARY_API_SECRET || '5m1ohHgHqA1qamtTUqOcxPIK7NU',
        });
    },
};
