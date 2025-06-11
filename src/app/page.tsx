
"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ImageUploader } from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Terminal, Trash2, Sparkles as AllSparklesIcon, Loader2, FileImage, Copy as CopyIcon, FileText, FileDown } from "lucide-react";
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { generateSocialMediaCaption } from '@/ai/flows/generate-social-media-caption';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

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
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Caption Generation Failed",
        description: "No text available or text is empty for this image.",
        variant: "destructive",
      });
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
      toast({
        title: "Caption Generated!",
        description: `Caption created for image ${entry.file.name.substring(0,20)}...`,
      });
    } catch (err) {
      console.error(`Error generating caption for ${entryId}:`, err);
      setImageEntries(prevEntries =>
        prevEntries.map(e =>
          e.id === entryId
            ? { ...e, captionError: "Failed to generate caption.", isGeneratingCaption: false }
            : e
        )
      );
      toast({
        title: "Caption Generation Error",
        description: `Could not generate caption for ${entry.file.name.substring(0,20)}...`,
        variant: "destructive",
      });
    }
  }, [imageEntries, toast]);

  const handleGenerateAllCaptions = useCallback(async () => {
    setIsProcessingGlobal(true);
    const entriesToProcess = imageEntries.filter(
      entry => entry.extractedText && entry.extractedText.trim() !== "" && !entry.caption && !entry.isGeneratingCaption && !entry.captionError
    );

    if (entriesToProcess.length === 0) {
      setIsProcessingGlobal(false);
      toast({
        title: "No Images Ready",
        description: "No images are ready for caption generation, or all already have captions/errors.",
      });
      return;
    }
    
    toast({
        title: "Generating All Captions",
        description: `Starting generation for ${entriesToProcess.length} image(s)...`,
    });

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
    toast({
        title: "Finished Generating All",
        description: `Processed ${entriesToProcess.length} image(s). Check results below.`,
    });
  }, [imageEntries, toast]);

  const handleRemoveImage = (entryId: string) => {
    setImageEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    toast({
        title: "Image Removed",
        description: "The image has been removed from the list.",
    });
  };

  const handleCopyCaption = (captionText: string | null) => {
    if (captionText) {
      navigator.clipboard.writeText(captionText)
        .then(() => {
          toast({
            title: "Copied to clipboard!",
            description: "The caption is now in your clipboard.",
          });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast({
            title: "Error",
            description: "Failed to copy caption.",
            variant: "destructive",
          });
        });
    }
  };

  const handleDownloadDocx = async () => {
    const captionsToExport = imageEntries.filter(entry => entry.caption && entry.caption.trim() !== "");
    if (captionsToExport.length === 0) {
      toast({
        title: "No Captions to Export",
        description: "Generate some captions before exporting.",
        variant: "default"
      });
      return;
    }

    setIsGeneratingDocx(true);
    toast({ title: "Generating DOCX...", description: "Please wait."});

    try {
      const docChildren = captionsToExport.flatMap((entry, index) => ([
        new Paragraph({
          text: entry.file.name,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun(entry.caption!)],
          spacing: { after: 400 },
        }),
        ...(index < captionsToExport.length - 1 ? [new Paragraph({ text: "", spacing: { after: 200 } })] : []) // Adds a bit more space or a page break if desired
      ]));

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "social_media_captions.docx");
      toast({ title: "DOCX Generated!", description: "Your download should start shortly."});
    } catch (error) {
      console.error("Error generating DOCX:", error);
      toast({ title: "DOCX Generation Failed", description: "Could not generate the document.", variant: "destructive"});
    } finally {
      setIsGeneratingDocx(false);
    }
  };


  const readyForCaptioningCount = imageEntries.filter(
    e => e.extractedText && e.extractedText.trim() !== "" && !e.caption && !e.isGeneratingCaption && !e.captionError
  ).length;
  
  const canGenerateAll = readyForCaptioningCount > 0;
  const hasAnyCaptions = imageEntries.some(e => e.caption && e.caption.trim() !== "");

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden mb-8">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-headline text-center">Deepak AI Caption</CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 mt-1">
            Upload images, extract text, and let AI craft perfect social media captions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <ImageUploader onImageUpload={handleAddImage} />
        </CardContent>
      </Card>

      {imageEntries.length > 0 && (
        <div className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row justify-end gap-2">
          <Button 
            onClick={handleDownloadDocx} 
            disabled={!hasAnyCaptions || isGeneratingDocx}
            size="lg"
            variant="outline"
          >
            {isGeneratingDocx ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-5 w-5" />
            )}
            Download All (.docx)
          </Button>
          <Button 
            onClick={handleGenerateAllCaptions} 
            disabled={!canGenerateAll || isProcessingGlobal}
            size="lg"
          >
            {isProcessingGlobal ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <AllSparklesIcon className="mr-2 h-5 w-5" />
            )}
            Generate All Captions ({readyForCaptioningCount} ready)
          </Button>
        </div>
      )}

      {imageEntries.length === 0 && (
         <Card className="w-full max-w-4xl shadow-lg rounded-xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileImage className="mx-auto h-16 w-16 mb-4 text-gray-400" />
              <p className="text-xl font-medium mb-1">No images uploaded yet.</p>
              <p className="text-sm">Upload some images using the panel above to get started!</p>
            </CardContent>
         </Card>
      )}

      {imageEntries.length > 0 && (
        <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {imageEntries.map((entry) => (
            <Card key={entry.id} className="flex flex-col shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="p-4">
                 <div className="relative aspect-video rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                    <Image
                        src={entry.dataUrl}
                        alt={`Uploaded ${entry.file.name.substring(0,10)}`}
                        fill
                        style={{ objectFit: 'contain' }}
                        data-ai-hint="uploaded content"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-semibold text-foreground">Extracted Text</h3>
                    {entry.isExtractingText && <Badge variant="outline" className="text-xs"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Extracting...</Badge>}
                    {entry.textError && !entry.isExtractingText && <Badge variant="destructive" className="text-xs">Error</Badge>}
                    {entry.extractedText && !entry.textError && !entry.isExtractingText && <Badge variant="secondary" className="text-xs">Ready</Badge>}
                    {!entry.extractedText && !entry.textError && !entry.isExtractingText && <Badge variant="outline" className="text-xs">Pending</Badge>}
                  </div>
                  {entry.isExtractingText ? (
                      <Skeleton className="h-16 w-full" />
                  ) : entry.textError ? (
                      <Alert variant="destructive" className="py-2 px-3 text-xs">
                        <Terminal className="h-3 w-3" />
                        <AlertDescription>{entry.textError}</AlertDescription>
                      </Alert>
                  ) : entry.extractedText ? (
                    <ScrollArea className="h-20 border rounded-md p-2 bg-secondary/10 text-xs">
                      <pre className="whitespace-pre-wrap">{entry.extractedText}</pre>
                    </ScrollArea>
                  ) : (
                      <div className="p-3 bg-muted/20 rounded text-xs text-muted-foreground min-h-[60px] flex items-center justify-center">
                      <FileText className="mr-2 h-4 w-4" /> No text or not processed.
                    </div>
                  )}
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Caption</h3>
                    {entry.isGeneratingCaption && (
                        <>
                            <Skeleton className="h-8 w-3/4 mb-1" />
                            <Skeleton className="h-16 w-full mb-1" />
                            <Skeleton className="h-8 w-1/2" />
                        </>
                    )}
                    {!entry.isGeneratingCaption && entry.caption && (
                    <>
                        <Textarea
                            value={entry.caption}
                            readOnly
                            rows={3}
                            className="resize-none text-xs bg-secondary/30 border-border focus-visible:ring-primary mb-2"
                            aria-label="Generated social media caption"
                        />
                        <Button onClick={() => handleCopyCaption(entry.caption)} size="sm" variant="outline" className="w-full">
                        <CopyIcon className="mr-2 h-3 w-3" /> Copy
                        </Button>
                    </>
                    )}
                    {!entry.isGeneratingCaption && !entry.caption && entry.extractedText && !entry.textError && (
                    <Button 
                        onClick={() => handleGenerateSingleCaption(entry.id)} 
                        size="sm"
                        className="w-full"
                        disabled={entry.isGeneratingCaption}
                    >
                        <AllSparklesIcon className="mr-2 h-4 w-4" />
                        Generate Caption
                    </Button>
                    )}
                    {!entry.isGeneratingCaption && entry.captionError && (
                        <Alert variant="destructive" className="py-2 px-3 text-xs mt-2">
                            <Terminal className="h-3 w-3" />
                            <AlertDescription>{entry.captionError}</AlertDescription>
                        </Alert>
                    )}
                    {!entry.extractedText && !entry.caption && !entry.captionError && !entry.isGeneratingCaption && (
                        <div className="p-3 bg-muted/20 rounded text-xs text-muted-foreground min-h-[60px] flex items-center justify-center">
                            <FileText className="mr-2 h-4 w-4" /> Caption will appear here.
                        </div>
                    )}
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveImage(entry.id)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Remove image ${entry.id.substring(0,5)}`}
                    >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Image
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <footer className="mt-auto pt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Deepak AI Caption. Powered by GenAI.</p>
      </footer>
    </div>
  );
}

