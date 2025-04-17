// // src/lib/ai/textToSpeech.ts
// import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

// const pollyClient = new PollyClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// export async function textToSpeech(text: string): Promise<string> {
//   try {
//     const command = new SynthesizeSpeechCommand({
//       OutputFormat: 'mp3',
//       Text: text,
//       VoiceId: 'Joanna', // or other voice
//       Engine: 'neural',
//     });

//     const response = await pollyClient.send(command);
//     const audioBuffer = await response.AudioStream?.transformToByteArray();
    
//     if (!audioBuffer) throw new Error('No audio data received');
    
//     // Convert to base64 for temporary storage
//     return `data:audio/mp3;base64,${Buffer.from(audioBuffer).toString('base64')}`;
//   } catch (error) {
//     console.error('Text-to-speech error:', error);
//     throw error;
//   }
// }


import { uploadToS3 } from '@/lib/aws/s3';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export async function textToSpeech(text: string): Promise<string> {
  try {
    const command = new SynthesizeSpeechCommand({
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: 'Joanna',
      Engine: 'neural',
    });

    const response = await pollyClient.send(command);
    const audioBuffer = await response.AudioStream?.transformToByteArray();
    
    if (!audioBuffer) throw new Error('No audio data received');

    // Upload directly to S3
    const key = `audio/${Date.now()}.mp3`;
    const url = await uploadToS3(Buffer.from(audioBuffer), key, 'audio/mpeg');
    return url;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
}