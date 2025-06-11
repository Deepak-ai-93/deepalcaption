
"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, FileImage, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (file: File, dataUrl: string) => void;
  isLoading: boolean;
  currentImageUrl: string | null;
}

export function ImageUploader({ onImageUpload, isLoading, currentImageUrl }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      onImageUpload(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
      <Label htmlFor="image-upload" className="sr-only">Upload Image</Label>
      <Card 
        className={cn(
          "border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out",
          isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/70",
          isLoading && "animate-pulse-bg"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
              <p className="font-semibold">Processing Image...</p>
              <p className="text-sm">Extracting text, please wait.</p>
            </div>
          ) : previewUrl ? (
            <div className="relative w-full max-w-xs h-48 rounded-md overflow-hidden shadow-md">
              <Image
                src={previewUrl}
                alt="Uploaded preview"
                layout="fill"
                objectFit="contain"
                data-ai-hint="uploaded image"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <UploadCloud className="h-12 w-12 text-gray-400 mb-2" />
              <p className="font-semibold">Drag & drop an image here</p>
              <p className="text-sm">or</p>
            </div>
          )}
           {!isLoading && (
            <Button 
              onClick={handleButtonClick} 
              variant="outline"
              disabled={isLoading}
              className="w-full max-w-xs"
            >
              {previewUrl ? 'Change Image' : 'Select Image'}
            </Button>
           )}
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
