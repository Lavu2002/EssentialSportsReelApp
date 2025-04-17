import fetch from 'node-fetch';
import { Polly } from '@aws-sdk/client-polly';
import { PassThrough } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const polly = new Polly({ region: 'ap-south-1' });

const STABLE_HORDE_API_KEY = process.env.STABLE_HORDE_API_KEY!;
const STABLE_HORDE_URL = 'https://stablehorde.net/api/v2/generate/async';

export async function generateVideo(
  celebrity: string,
  script: string,
): Promise<Buffer> {
  try {
    console.log('Starting video generation for:', celebrity);

    // Step 1: Generate Image using Stable Horde
    // const prompt = `Epic sports moment of ${celebrity}, cinematic lighting, action shot`;
    // const imageUrl = await generateImageFromStableHorde(prompt);
    // console.log('Image generated:', imageUrl);

    const imageUrl= "https://a223539ccf6caa2d76459c9727d276e6.r2.cloudflarestorage.com/stable-horde/99ce1b17-39e8-487c-9d6b-704a1188d045.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=246782cc9101762ba914350d8058cd83%2F20250417%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20250417T103808Z&X-Amz-Expires=1800&X-Amz-SignedHeaders=host&X-Amz-Signature=110519533e7886384f5f20d85ecbb5fafb6e6d9cad59ca0830d8546ae2424ada"

    // Step 2: Generate Audio using AWS Polly
    const audioResponse = await polly.synthesizeSpeech({
      Text: script,
      OutputFormat: 'mp3',
      VoiceId: 'Joanna',
    });

    const audioStream = audioResponse.AudioStream!;
    const imagePath = await downloadImage(imageUrl);

    // Step 3: Combine image and audio using FFmpeg
    const outputBuffer = await new Promise<Buffer>((resolve, reject) => {
      const buffers: any[] = [];
      const bufferStream = new PassThrough();

      bufferStream.on('data', (chunk) => buffers.push(chunk));
      bufferStream.on('end', () => resolve(Buffer.concat(buffers)));
      bufferStream.on('error', reject);

      ffmpeg()
        .input(imagePath)
        .loop(10)
        .input(audioStream)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 22',
          '-c:a aac',
          '-b:a 128k',
          '-shortest',
        ])
        .format('mp4')
        .on('error', reject)
        .pipe(bufferStream, { end: true });
    });

    // Cleanup
    fs.unlinkSync(imagePath);

    return outputBuffer;
  } catch (error) {
    console.error('Video generation error:', error);
    throw error;
  }
}

async function generateImageFromStableHorde(prompt: string): Promise<string> {
  // Step 1: Request image generation
  const response = await fetch(STABLE_HORDE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: STABLE_HORDE_API_KEY,
    },
    body: JSON.stringify({
      prompt,
      params: {
        n: 1,
        width: 512,
        height: 512,
        sampler_name: 'k_euler',
        steps: 20,
      },
      models: ['stable_diffusion'],
    }),
  });

  const { id } = await response.json();

  // Step 2: Poll for result
  const pollUrl = `https://stablehorde.net/api/v2/generate/status/${id}`;
  while (true) {
    const status = await fetch(pollUrl, {
      headers: { apikey: STABLE_HORDE_API_KEY },
    });
    const result = await status.json();

    if (result.done && result.generations?.length > 0) {
      return result.generations[0].img;
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function downloadImage(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.buffer();
  const filename = path.join('/tmp', `${uuidv4()}.png`);
  fs.writeFileSync(filename, buffer);
  return filename;
}