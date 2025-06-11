
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
    .describe('The extracted text from the uploaded image, representing the user\'s experience or topic.'),
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
  prompt: `You are a social media expert tasked with crafting a post from the perspective of a real user.

**Context for the post (what the user experienced based on the extracted text):**
{{{extractedText}}}

**Your Task:**
Write a first-person, creative, and engaging social media post as if written by a real user who just experienced the content described above.

**Post Requirements:**
1.  **Story/Feeling/Transformation:** Include a brief story, feeling, or transformation moment related to the experience.
2.  **Emojis:** Use emojis naturally to enhance the tone (do not overuse).
3.  **Tone:** Maintain a warm and engaging tone. Make it feel human.
4.  **Authenticity:** The post must not sound promotional.
5.  **Engagement:** End with a light call to action or a question to invite engagement from others.
6.  **Hashtags:** Add 3–6 relevant and trendy hashtags.

**IMPORTANT CONTENT RESTRICTIONS:**
Do NOT include any website URLs, physical addresses, email addresses, phone numbers, or specific names of individuals (like doctor names) or their professional titles/designations in the caption. Focus on general themes and calls to action if appropriate, without revealing specific contact or location data.
`,
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
