import React from 'react';
import { PhotoGallery } from '../common/PhotoGallery';

interface OrderPhotosTabProps {
    order: any;
    onUpdate: () => void;
}

export const OrderPhotosTab: React.FC<OrderPhotosTabProps> = ({ order, onUpdate }) => {
    return (
        <div style={{ padding: '0 24px' }}>
            <PhotoGallery
                mode="direct"
                orderId={order.id}
                existingPhotos={order.photos || []}
                onPhotoAdded={onUpdate}
                onPhotoDeleted={() => onUpdate()}
            />
        </div>
    );
};
