import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
}

export default function FileUpload({ onChange, maxFiles = 5, accept = "image/*" }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    handleFiles(Array.from(files));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files) return;
    
    handleFiles(Array.from(files));
  };

  const handleFiles = (files: File[]) => {
    // Check file count
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    // Reset error
    setError(null);

    // Process files - in a real app, this would upload to your server or cloud storage
    const newFiles = files.map(file => {
      // Check file type
      if (!file.type.match(accept.replace('*', ''))) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not a valid type. Please upload ${accept.replace('*', '')} files.`,
          variant: "destructive"
        });
        return null;
      }

      // Generate a unique URL for client-side preview
      // In a real app, this would be replaced with the actual upload logic
      return URL.createObjectURL(file);
    }).filter(Boolean) as string[];

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-gray-300 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <h3 className="font-medium text-gray-700">
            Drag & drop your images here
          </h3>
          <p className="text-sm text-gray-500">
            or <span className="text-primary font-medium">browse files</span>
          </p>
          <p className="text-xs text-gray-400">
            Supports: JPG, PNG, GIF (Max {maxFiles} files)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden border bg-gray-50">
                <img
                  src={file}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {uploadedFiles.length < maxFiles && (
            <button
              type="button"
              className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
              onClick={openFileDialog}
            >
              <Image className="h-6 w-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Add More</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
