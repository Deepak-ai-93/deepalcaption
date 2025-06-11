
"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ImageUploader } from '@/components/image-uploader';
import { CaptionCard } from '@/components/caption-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Trash2, Sparkles as AllSparklesIcon, Loader2, FileImage } from "lucide-react";
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { generateSocialMediaCaption } from '@/ai/flows/generate-social-media-caption';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ImageEntry {
  id: string;
  file: File;
  dataUrl: string;
  extractedText: string | null;
  caption: string | null;
  isExtractingText: boolean;
  isGeneratingCaption: boolean;
  textError: string | null;
  captionError: string | null;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function HomePage() {
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState(false);

  const handleAddImage = useCallback(async (file: File, dataUrl: string) => {
    const entryId = generateId();
    const newEntry: ImageEntry = {
      id: entryId,
      file,
      dataUrl,
      extractedText: null,
      caption: null,
      isExtractingText: true,
      isGeneratingCaption: false,
      textError: null,
      captionError: null,
    };

    setImageEntries(prevEntries => [newEntry, ...prevEntries]);

    try {
      const textResult = await extractTextFromImage({ photoDataUri: dataUrl });
      setImageEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId
            ? {
                ...entry,
                extractedText: textResult.extractedText,
                isExtractingText: false,
                textError: !textResult.extractedText || textResult.extractedText.trim() === "" ? "No text found in the image." : null,
              }
            : entry
        )
      );
    } catch (err) {
      console.error(`Error extracting text for ${entryId}:`, err);
      setImageEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId
            ? { ...entry, textError: "Failed to extract text from image.", isExtractingText: false }
            : entry
        )
      );
    }
  }, []);

  const handleGenerateSingleCaption = useCallback(async (entryId: string) => {
    const entry = imageEntries.find(e => e.id === entryId);
    if (!entry || !entry.extractedText || entry.extractedText.trim() === "") {
      setImageEntries(prevEntries =>
        prevEntries.map(e =>
          e.id === entryId
            ? { ...e, captionError: "Cannot generate caption: No text available or text is empty.", isGeneratingCaption: false }
            : e
        )
      );
      return;
    }

    setImageEntries(prevEntries =>
      prevEntries.map(e =>
        e.id === entryId ? { ...e, isGeneratingCaption: true, captionError: null, caption: null } : e
      )
    );

    try {
      const captionResult = await generateSocialMediaCaption({ extractedText: entry.extractedText });
      setImageEntries(prevEntries =>
        prevEntries.map(e =>
          e.id === entryId ? { ...e, caption: captionResult.caption, isGeneratingCaption: false } : e
        )
      );
    } catch (err) {
      console.error(`Error generating caption for ${entryId}:`, err);
      setImageEntries(prevEntries =>
        prevEntries.map(e =>
          e.id === entryId
            ? { ...e, captionError: "Failed to generate caption.", isGeneratingCaption: false }
            : e
        )
      );
    }
  }, [imageEntries]);

  const handleGenerateAllCaptions = useCallback(async () => {
    setIsProcessingGlobal(true);
    const entriesToProcess = imageEntries.filter(
      entry => entry.extractedText && entry.extractedText.trim() !== "" && !entry.caption && !entry.isGeneratingCaption && !entry.captionError
    );

    if (entriesToProcess.length === 0) {
      setIsProcessingGlobal(false);
      // Consider a toast message: "No images ready for caption generation or all have captions/errors."
      return;
    }

    setImageEntries(prevEntries =>
      prevEntries.map(entry =>
        entriesToProcess.find(pEntry => pEntry.id === entry.id)
          ? { ...entry, isGeneratingCaption: true, captionError: null, caption: null }
          : entry
      )
    );

    await Promise.allSettled(
      entriesToProcess.map(entryToProcess =>
        generateSocialMediaCaption({ extractedText: entryToProcess.extractedText! })
          .then(captionResult => {
            setImageEntries(prevEntries =>
              prevEntries.map(e =>
                e.id === entryToProcess.id ? { ...e, caption: captionResult.caption, isGeneratingCaption: false } : e
              )
            );
          })
          .catch(err => {
            console.error(`Error generating caption for ${entryToProcess.id} (all):`, err);
            setImageEntries(prevEntries =>
              prevEntries.map(e =>
                e.id === entryToProcess.id
                  ? { ...e, captionError: "Failed to generate caption.", isGeneratingCaption: false }
                  : e
              )
            );
          })
      )
    );
    setIsProcessingGlobal(false);
  }, [imageEntries]);

  const handleRemoveImage = (entryId: string) => {
    setImageEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
  };

  const readyForCaptioningCount = imageEntries.filter(
    e => e.extractedText && e.extractedText.trim() !== "" && !e.caption && !e.isGeneratingCaption && !e.captionError
  ).length;
  
  const canGenerateAll = readyForCaptioningCount > 0;

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-3xl shadow-2xl rounded-xl overflow-hidden mb-8">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-headline text-center">CaptionAI Multi</CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 mt-1">
            Upload images, and let AI craft perfect social media captions for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <ImageUploader onImageUpload={handleAddImage} />
        </CardContent>
      </Card>

      {imageEntries.length > 0 && (
        <div className="w-full max-w-3xl mb-6">
          <Button 
            onClick={handleGenerateAllCaptions} 
            disabled={!canGenerateAll || isProcessingGlobal}
            className="w-full"
          >
            {isProcessingGlobal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AllSparklesIcon className="mr-2 h-4 w-4" />
            )}
            Generate All Captions ({readyForCaptioningCount} ready)
          </Button>
        </div>
      )}

      {imageEntries.length === 0 && (
         <Card className="w-full max-w-3xl shadow-lg rounded-xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileImage className="mx-auto h-16 w-16 mb-4 text-gray-400" />
              <p className="text-xl font-medium mb-1">No images uploaded yet.</p>
              <p className="text-sm">Upload some images using the panel above to get started!</p>
            </CardContent>
         </Card>
      )}

      <ScrollArea className="w-full max-w-3xl" style={{height: imageEntries.length > 0 ? 'calc(100vh - 450px)' : 'auto'}}>
        <div className="space-y-6 py-1 pr-2">
          {imageEntries.map((entry) => (
            <Card key={entry.id} className="shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="relative w-full h-40 md:h-auto md:aspect-square rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                  <Image
                    src={entry.dataUrl}
                    alt={`Uploaded image ${entry.id.substring(0,5)}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    data-ai-hint="uploaded content"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm text-muted-foreground">Extracted Text</h3>
                      {entry.isExtractingText && <Badge variant="outline" className="text-xs"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Extracting...</Badge>}
                      {entry.textError && !entry.isExtractingText && <Badge variant="destructive" className="text-xs">Error</Badge>}
                      {entry.extractedText && !entry.textError && !entry.isExtractingText && <Badge variant="secondary" className="text-xs">Ready</Badge>}
                    </div>
                    {entry.isExtractingText ? (
                      <div className="p-3 bg-muted/20 rounded text-sm text-muted-foreground min-h-[60px] flex items-center justify-center animate-pulse">
                        Processing image for text...
                      </div>
                    ) : entry.textError ? (
                       <Alert variant="destructive" className="py-2 px-3 text-xs">
                         <Terminal className="h-3 w-3" />
                         <AlertDescription>{entry.textError}</AlertDescription>
                       </Alert>
                    ) : entry.extractedText ? (
                      <ScrollArea className="h-20">
                        <div className="p-2 bg-secondary/20 rounded text-sm border">
                          <pre className="whitespace-pre-wrap text-xs">{entry.extractedText}</pre>
                        </div>
                      </ScrollArea>
                    ) : (
                       <div className="p-3 bg-muted/20 rounded text-sm text-muted-foreground min-h-[60px] flex items-center justify-center">
                        Waiting for image processing...
                      </div>
                    )}
                  </div>

                  {entry.extractedText && !entry.textError && !entry.caption && !entry.isGeneratingCaption && !entry.captionError && (
                    <Button 
                      onClick={() => handleGenerateSingleCaption(entry.id)} 
                      size="sm"
                      className="w-full"
                    >
                      <AllSparklesIcon className="mr-2 h-4 w-4" />
                      Generate Caption
                    </Button>
                  )}

                  {(entry.caption || entry.isGeneratingCaption || entry.captionError) && (
                    <div>
                       <h3 className="font-semibold text-sm text-muted-foreground mb-1">Generated Caption</h3>
                       <CaptionCard 
                          caption={entry.caption} 
                          isLoading={entry.isGeneratingCaption} 
                        />
                         {entry.captionError && !entry.isGeneratingCaption && (
                         <Alert variant="destructive" className="py-2 px-3 text-xs mt-2">
                           <Terminal className="h-3 w-3" />
                           <AlertDescription>{entry.captionError}</AlertDescription>
                         </Alert>
                       )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-2 bg-muted/10 border-t">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveImage(entry.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                    aria-label={`Remove image ${entry.id.substring(0,5)}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Image
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} CaptionAI Multi. Powered by GenAI.</p>
      </footer>
    </div>
  );
}

