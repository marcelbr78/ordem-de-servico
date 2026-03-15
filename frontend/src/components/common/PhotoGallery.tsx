import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Trash2, Image as ImageIcon, Loader, Check, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface Photo {
    id: string;
    url: string;
    createdAt?: string;
}

interface PhotoGalleryProps {
    mode: 'local' | 'direct';
    orderId?: string;
    existingPhotos?: Photo[];
    localFiles?: File[];
    onLocalFilesChange?: (files: File[]) => void;
    onPhotoDeleted?: (id: string) => void;
    onPhotoAdded?: (photo: Photo) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
    mode,
    orderId,
    existingPhotos = [],
    localFiles = [],
    onLocalFilesChange,
    onPhotoDeleted,
    onPhotoAdded
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Camera Logic
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraError, setCameraError] = useState('');
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = () => {
        setCameraError('');
        setCapturedImage(null);
        setCapturedFile(null);
        setIsCameraOpen(true);
    };

    // Initialize camera when UI opens
    React.useEffect(() => {
        let mounted = true;

        const initCamera = async () => {
            // If camera not open or we have a captured image (preview mode), don't init stream
            if (!isCameraOpen || capturedImage) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (!mounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsStreaming(true);
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                let msg = 'Erro ao acessar a câmera.';
                if (err.name === 'NotAllowedError') msg = 'Permissão negada para acessar a câmera.';
                if (err.name === 'NotFoundError') msg = 'Nenhuma câmera encontrada no dispositivo.';
                if (err.name === 'NotReadableError') msg = 'A câmera já está em uso por outro aplicativo.';
                setCameraError(msg);
            }
        };

        initCamera();

        return () => {
            mounted = false;
            // Clean up stream if we are unmounting or if we are closing camera
            // Note: We might want to keep stream open during preview for faster "retake", 
            // but closing it is safer for resources.
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            setIsStreaming(false);
        };
    }, [isCameraOpen, capturedImage]); // Re-run if capturedImage changes (to restart stream if retaking)

    const stopCamera = () => {
        setIsCameraOpen(false);
        setIsStreaming(false);
        setCapturedImage(null);
        setCapturedFile(null);
    };

    const takePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    const imageUrl = URL.createObjectURL(blob);

                    setCapturedFile(file);
                    setCapturedImage(imageUrl);
                    // We don't stop camera open state, but the useEffect will cleanup stream 
                    // because capturedImage is now true. This effectively "pauses" the camera visual 
                    // and releases the hardware resource while showing the preview.
                }
            }, 'image/jpeg');
        }
    };

    const confirmCapture = async () => {
        if (capturedFile) {
            if (mode === 'local') {
                if (onLocalFilesChange) onLocalFilesChange([...localFiles, capturedFile]);
            } else if (mode === 'direct' && orderId) {
                await uploadFiles([capturedFile]);
            }
            stopCamera();
        }
    };

    const retakePhoto = () => {
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage);
        }
        setCapturedImage(null);
        setCapturedFile(null);
        // Effects will re-run to init camera stream
    };

    // Helper to read file as data URL for preview
    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);

            if (mode === 'local') {
                if (onLocalFilesChange) {
                    onLocalFilesChange([...localFiles, ...files]);
                }
            } else if (mode === 'direct' && orderId) {
                await uploadFiles(files);
            }
        }
        // Reset input
        if (e.target) e.target.value = '';
    };

    const uploadFiles = async (files: File[]) => {
        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post(`/orders/${orderId}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (onPhotoAdded) onPhotoAdded(res.data);
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Erro ao enviar foto. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photo: Photo) => {
        if (!confirm('Excluir esta foto?')) return;
        try {
            await api.delete(`/orders/images/${photo.id}`);
            if (onPhotoDeleted) onPhotoDeleted(photo.id);
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Erro ao excluir foto.');
        }
    };

    const handleRemoveLocal = (index: number) => {
        if (onLocalFilesChange) {
            const newFiles = [...localFiles];
            newFiles.splice(index, 1);
            onLocalFilesChange(newFiles);
        }
    };

    const handleCameraClick = () => {
        // Detect if mobile to use native capture, else verify webcam
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            cameraInputRef.current?.click();
        } else {
            if (isCameraOpen) {
                takePhoto();
            } else {
                startCamera();
            }
        }
    };

    // Generate previews for local files
    const [localPreviews, setLocalPreviews] = useState<string[]>([]);

    React.useEffect(() => {
        if (mode === 'local') {
            Promise.all(localFiles.map(readFile)).then(setLocalPreviews);
        }
    }, [localFiles, mode]);

    return (
        <div style={{ width: '100% ' }}>
            {/* Hidden Inputs */}
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={cameraInputRef} onChange={handleFileSelect} />
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileSelect} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                {!isCameraOpen ? (
                    <>
                        <button
                            onClick={handleCameraClick}
                            disabled={uploading}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                padding: '16px 24px', background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '12px', color: '#6366f1',
                                cursor: 'pointer', flex: 1, maxWidth: '200px', transition: 'all 0.2s'
                            }}
                        >
                            <Camera size={24} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Tirar Foto</span>
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                padding: '16px 24px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px', color: '#fff', cursor: 'pointer', flex: 1, maxWidth: '200px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Upload size={24} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Galeria</span>
                        </button>
                    </>
                ) : (
                    <>
                        {!capturedImage ? (
                            /* Camera Active - Capture Button */
                            <>
                                <button
                                    onClick={takePhoto}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        padding: '16px 24px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)',
                                        borderRadius: '12px', color: '#818cf8', cursor: 'pointer', flex: 1, maxWidth: '200px'
                                    }}
                                >
                                    <Camera size={24} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Capturar</span>
                                </button>
                                <button
                                    onClick={stopCamera}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        padding: '16px 24px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '12px', color: '#fff', cursor: 'pointer', flex: 1, maxWidth: '200px'
                                    }}
                                >
                                    <X size={24} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Cancelar Camera</span>
                                </button>
                            </>
                        ) : (
                            /* Image Captured - Confirm or Retake */
                            <>
                                <button
                                    onClick={confirmCapture}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        padding: '16px 24px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)',
                                        borderRadius: '12px', color: '#4ade80', cursor: 'pointer', flex: 1, maxWidth: '200px'
                                    }}
                                >
                                    <Check size={24} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Confirmar</span>
                                </button>
                                <button
                                    onClick={retakePhoto}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        padding: '16px 24px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '12px', color: '#fff', cursor: 'pointer', flex: 1, maxWidth: '200px'
                                    }}
                                >
                                    <RefreshCw size={24} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Tirar Outra</span>
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Camera Viewport or Captured Image */}
            {isCameraOpen && (
                <div style={{
                    width: '100%', maxWidth: '600px', margin: '0 auto 24px',
                    borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)',
                    background: '#000', position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {capturedImage ? (
                        <div style={{ width: '100%', position: 'relative' }}>
                            <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                        </div>
                    ) : (
                        <>
                            {!isStreaming && !cameraError && (
                                <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <Loader className="animate-spin" />
                                    <span>Iniciando câmera...</span>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: '100%', display: isStreaming ? 'block' : 'none' }}
                            />
                        </>
                    )}
                </div>
            )}

            {cameraError && (
                <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
                    {cameraError}
                </div>
            )}

            {/* Loading */}
            {uploading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.6)' }}>
                    <Loader className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <p>Enviando fotos...</p>
                </div>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>

                {/* Local Files (Preview) */}
                {mode === 'local' && localPreviews.map((src, index) => (
                    <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                            onClick={() => handleRemoveLocal(index)}
                            style={{
                                position: 'absolute', top: '8px', right: '8px',
                                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)'
                            }}
                        >
                            <X size={14} />
                        </button>
                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '4px', background: 'rgba(0,0,0,0.6)', textAlign: 'center', fontSize: '10px', color: '#fff' }}>
                            Aguardando envio
                        </div>
                    </div>
                ))}

                {/* Existing Photos (Direct Mode) */}
                {mode === 'direct' && existingPhotos.map(photo => (
                    <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={photo.url} alt="Order Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <a
                            href={photo.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                position: 'absolute', inset: 0, zIndex: 1
                            }}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                            style={{
                                position: 'absolute', top: '8px', right: '8px', zIndex: 2,
                                background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '50%',
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)'
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {((mode === 'local' && localFiles.length === 0) || (mode === 'direct' && existingPhotos.length === 0)) && !uploading && !isCameraOpen && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p>Nenhuma foto adicionada</p>
                </div>
            )}
        </div>
    );
};
