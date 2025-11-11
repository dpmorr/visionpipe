import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorLogoUploadProps {
  onUploadSuccess: (file: File) => void;
  currentLogo?: string;
}

export function VendorLogoUpload({ onUploadSuccess, currentLogo }: VendorLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      onUploadSuccess(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload company logo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {currentLogo && (
        <div className="w-32 h-32 rounded-lg overflow-hidden border">
          <img 
            src={`/uploads/company-logos/${currentLogo}`} 
            alt="Current logo" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <Button 
        variant="outline" 
        className="relative" 
        disabled={uploading}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/*"
        />
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? 'Uploading...' : 'Upload Logo'}
      </Button>
    </div>
  );
}