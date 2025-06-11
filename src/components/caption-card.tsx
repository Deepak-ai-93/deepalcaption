
"use client";

import React from 'react';
import { Copy, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

interface CaptionCardProps {
  caption: string | null;
  isLoading: boolean;
}

export function CaptionCard({ caption, isLoading }: CaptionCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (caption) {
      navigator.clipboard.writeText(caption)
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

  if (isLoading) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
            Generating Caption...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
        <CardFooter>
          <Button disabled className="w-full">
            <Copy className="mr-2 h-4 w-4" />
            Copy Caption
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!caption) {
    return null; 
  }

  return (
    <Card className="w-full shadow-lg transform transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-5">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <Sparkles className="mr-2 h-6 w-6 text-accent" />
          Generated Caption
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={caption}
          readOnly
          rows={8}
          className="resize-none text-sm bg-secondary/30 border-border focus-visible:ring-primary"
          aria-label="Generated social media caption"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleCopy} className="w-full bg-primary hover:bg-primary/90">
          <Copy className="mr-2 h-4 w-4" />
          Copy Caption
        </Button>
      </CardFooter>
    </Card>
  );
}
