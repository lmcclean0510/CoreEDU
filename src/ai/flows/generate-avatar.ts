
'use server';
/**
 * @fileOverview A flow for generating user avatars using a text prompt and optional color.
 *
 * - generateAvatar - A function that handles the avatar generation process.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateAvatarInputSchema = z.object({
  prompt: z.string().describe('A one-word prompt for the avatar.'),
  color: z.string().optional().describe('An optional background color for the avatar.')
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.string().describe('The generated image as a data URI.');
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ prompt, color }) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A cute, simple, circular avatar icon of a ${prompt}, designed to be clear and readable at a small size (100x100 pixels). Flat design, minimalist, vector style, on a ${color || 'neutral'} background.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!media?.url) {
        throw new Error('Image generation failed. Please try a different prompt.');
    }

    return media.url;
  }
);
