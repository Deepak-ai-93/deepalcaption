
"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageUpload: (file: File, dataUrl: string) => void;
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For brief local preview
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (e.g., PNG, JPG, GIF).",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
      }
      return;
    }

    setIsProcessingFile(true);
    setPreviewUrl(null); 

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl); 
      
      onImageUpload(file, dataUrl); // Pass to parent

      // Reset uploader state after a short delay to allow user to see preview
      setTimeout(() => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
        setIsProcessingFile(false);
      }, 500); // Short delay for UX
    };
    reader.onerror = () => {
        setIsProcessingFile(false);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast({
          title: "File Read Error",
          description: "Could not read the selected file. Please try again.",
          variant: "destructive",
        });
        console.error("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleButtonClick = () => {
    if (isProcessingFile) return;
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (isProcessingFile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (isProcessingFile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (isProcessingFile) return;
    e.preventDefault();
    e.stopPropagation(); 
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (isProcessingFile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Label htmlFor="image-upload-input" className="sr-only">Upload Image</Label>
      <Card 
        className={cn(
          "border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out",
          isDragging && !isProcessingFile ? "border-primary bg-primary/10" : "border-border hover:border-primary/70",
          isProcessingFile && "cursor-not-allowed opacity-70"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-live="polite"
      >
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[150px]">
          {isProcessingFile && !previewUrl && ( // Show loader only when actively processing and no preview yet
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
              <p className="font-semibold">Preparing Image...</p>
            </div>
          )}
          {!isProcessingFile && !previewUrl && ( // Initial state
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <p className="font-semibold">Drag & drop an image here</p>
              <p className="text-sm">or</p>
            </div>
          )}
          {previewUrl && ( // Show brief preview
            <div className="relative w-full max-w-[200px] h-32 rounded-md overflow-hidden shadow-sm border">
              <Image
                src={previewUrl}
                alt="Selected image preview"
                fill
                style={{ objectFit: 'contain' }}
                data-ai-hint="image preview"
                sizes="200px"
              />
            </div>
          )}
           <Button 
              onClick={handleButtonClick} 
              variant="outline"
              disabled={isProcessingFile}
              className="w-full max-w-xs"
            >
              {isProcessingFile ? 'Processing...' : (previewUrl ? 'Adding...' : 'Select Image to Add')}
            </Button>
          <Input
            id="image-upload-input"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessingFile}
          />
        </CardContent>
      </Card>
    </div>
  );
}

