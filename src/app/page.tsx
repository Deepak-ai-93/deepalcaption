
"use client";

import React, { useState, useCallback } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { CaptionCard } from '@/components/caption-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { extractTextFromImage, ExtractTextFromImageOutput } from '@/ai/flows/extract-text-from-image';
import { generateSocialMediaCaption, GenerateSocialMediaCaptionOutput } from '@/ai/flows/generate-social-media-caption';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingCaption, setIsLoadingCaption] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setExtractedText(null);
    setCaption(null);
    setError(null);
  };

  const handleImageUpload = useCallback(async (file: File, dataUrl: string) => {
    setImageUrl(dataUrl);
    resetState();
    setIsLoadingText(true);

    try {
      const textResult: ExtractTextFromImageOutput = await extractTextFromImage({ photoDataUri: dataUrl });
      setExtractedText(textResult.extractedText);
      setIsLoadingText(false);
      
      if (textResult.extractedText && textResult.extractedText.trim() !== "") {
        handleGenerateCaption(textResult.extractedText);
      } else {
        setError("No text found in the image, or the text is too short to generate a caption.");
        setIsLoadingCaption(false); // Ensure caption loading stops if no text
      }
    } catch (err) {
      console.error("Error extracting text:", err);
      setError("Failed to extract text from the image. Please try another image or check the console for details.");
      setIsLoadingText(false);
    }
  }, []);

  const handleGenerateCaption = useCallback(async (text: string) => {
    setIsLoadingCaption(true);
    setError(null); 
    try {
      const captionResult: GenerateSocialMediaCaptionOutput = await generateSocialMediaCaption({ extractedText: text });
      setCaption(captionResult.caption);
    } catch (err) {
      console.error("Error generating caption:", err);
      setError("Failed to generate caption. Please try again or check the console for details.");
    } finally {
      setIsLoadingCaption(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-headline text-center">CaptionAI</CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 mt-1">
            Upload an image, and let AI craft the perfect social media caption for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <ImageUploader 
            onImageUpload={handleImageUpload} 
            isLoading={isLoadingText}
            currentImageUrl={imageUrl}
          />

          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-bottom-5">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(caption || isLoadingCaption) && (
             <CaptionCard caption={caption} isLoading={isLoadingCaption} />
          )}
          
          {!caption && !isLoadingCaption && extractedText && extractedText.trim() === "" && !isLoadingText && !error && (
            <Alert className="animate-in fade-in slide-in-from-bottom-5">
              <Terminal className="h-4 w-4" />
              <AlertTitle>No Text Detected</AlertTitle>
              <AlertDescription>
                We couldn't find any text in the uploaded image. Try a different image with clearer text.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} CaptionAI. Powered by GenAI.</p>
      </footer>
    </div>
  );
}
