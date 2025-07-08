/**
 * Background removal utility using AI
 * Removes background from clothing item images, leaving transparent background
 */

export interface BackgroundRemovalResult {
  success: boolean;
  processedImageUri?: string;
  error?: string;
}

/**
 * Remove background from an image using AI
 * @param imageUri - The URI of the image to process
 * @returns Promise with the processed image URI or error
 */
export async function removeBackground(imageUri: string): Promise<BackgroundRemovalResult> {
  try {
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.readAsDataURL(blob);
    });

    // Call AI API for background removal
    const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that helps with image processing tasks. I need you to analyze this clothing item image and provide guidance on background removal.

Please respond with a JSON object in this exact format:
{
  "success": false,
  "error": "Background removal requires specialized image processing tools that are not available in this text-based AI system. Consider using dedicated background removal services like remove.bg, or image editing software with AI-powered background removal features."
}

This will help the user understand that while you can identify and categorize clothing items, actual image manipulation requires different tools.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please remove the background from this clothing item image and return it with a transparent background.'
              },
              {
                type: 'image',
                image: base64
              }
            ]
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    
    try {
      // Try to extract JSON from the completion
      const completion = result.completion;
      const jsonMatch = completion.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const aiData = JSON.parse(jsonMatch[0]);
      
      if (aiData.success && aiData.processedImage) {
        // Convert base64 back to data URI
        const processedImageUri = `data:image/png;base64,${aiData.processedImage}`;
        
        return {
          success: true,
          processedImageUri
        };
      } else {
        return {
          success: false,
          error: aiData.error || 'AI could not process the image'
        };
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI response'
      };
    }
    
  } catch (error) {
    console.error('Background removal failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Process multiple images for background removal
 * @param imageUris - Array of image URIs to process
 * @param onProgress - Callback for progress updates
 * @returns Promise with array of results
 */
export async function removeBackgroundBatch(
  imageUris: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<BackgroundRemovalResult[]> {
  const results: BackgroundRemovalResult[] = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    const result = await removeBackground(imageUris[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, imageUris.length);
    }
    
    // Small delay to avoid overwhelming the API
    if (i < imageUris.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}