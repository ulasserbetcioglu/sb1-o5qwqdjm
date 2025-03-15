import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LogoUploadProps {
  type: 'company' | 'customer';
  id: string;
  currentLogo?: string | null;
  onUploadComplete: (url: string) => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  type,
  id,
  currentLogo,
  onUploadComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen sadece resim dosyası yükleyin');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo dosyası en fazla 2MB olabilir');
        return;
      }

      setUploading(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}s/${id}/${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (currentLogo) {
        try {
          const oldPath = new URL(currentLogo).pathname.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('logos')
              .remove([`${type}s/${id}/${oldPath}`]);
          }
        } catch (error) {
          console.error('Error removing old logo:', error);
        }
      }

      // Upload new logo
      const { data, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      // Update preview
      setPreview(publicUrl);

      // Call the callback with new URL
      onUploadComplete(publicUrl);
      toast.success('Logo başarıyla yüklendi');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Logo yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      if (!currentLogo) return;

      setUploading(true);

      // Extract filename from URL
      const path = new URL(currentLogo).pathname.split('/').pop();
      if (!path) throw new Error('Invalid logo path');

      const { error } = await supabase.storage
        .from('logos')
        .remove([`${type}s/${id}/${path}`]);

      if (error) throw error;

      setPreview(null);
      onUploadComplete('');
      toast.success('Logo başarıyla kaldırıldı');
    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error('Logo kaldırılırken bir hata oluştu: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="Logo"
            className="w-full h-full object-contain rounded-lg border border-gray-200"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg"></div>
            <div className="flex space-x-2 z-10">
              <label
                htmlFor="logo-upload"
                className="p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
              </label>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor="logo-upload"
          className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Logo Yükle</p>
            <p className="text-xs text-gray-400">PNG, JPG</p>
          </div>
        </label>
      )}

      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
      />

      {uploading && (
        <div className="text-sm text-gray-500 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
          Logo yükleniyor...
        </div>
      )}
    </div>
  );
};