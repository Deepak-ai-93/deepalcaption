'use server';
/**
 * @fileOverview AI agent that generates social media captions from extracted text.
 *
 * - generateSocialMediaCaption - A function that generates a social media caption.
 * - GenerateSocialMediaCaptionInput - The input type for the generateSocialMediaCaption function.
 * - GenerateSocialMediaCaptionOutput - The return type for the generateSocialMediaCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaCaptionInputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted text from the uploaded image.'),
});
export type GenerateSocialMediaCaptionInput = z.infer<
  typeof GenerateSocialMediaCaptionInputSchema
>;

const GenerateSocialMediaCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated social media caption.'),
});
export type GenerateSocialMediaCaptionOutput = z.infer<
  typeof GenerateSocialMediaCaptionOutputSchema
>;

export async function generateSocialMediaCaption(
  input: GenerateSocialMediaCaptionInput
): Promise<GenerateSocialMediaCaptionOutput> {
  return generateSocialMediaCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialMediaCaptionPrompt',
  input: {schema: GenerateSocialMediaCaptionInputSchema},
  output: {schema: GenerateSocialMediaCaptionOutputSchema},
  prompt: `You are a social media expert. Generate an engaging social media caption with relevant hashtags based on the following text: {{{extractedText}}}`,
});

const generateSocialMediaCaptionFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaCaptionFlow',
    inputSchema: GenerateSocialMediaCaptionInputSchema,
    outputSchema: GenerateSocialMediaCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
