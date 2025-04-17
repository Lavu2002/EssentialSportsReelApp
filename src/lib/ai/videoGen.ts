import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { S3 } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg'); 
// Safe path wrapper
function safePath(p: string): string {
  return `"${p.replace(/"/g, '')}"`;
}

const STABLE_HORDE_API_KEY = process.env.STABLE_HORDE_API_KEY!;
const STABLE_HORDE_URL = 'https://stablehorde.net/api/v2/generate/async';

// Initialize AWS S3 client
const s3 = new S3({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

// Temporary directory setup
const tempDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function generateVideo(
  celebrity: string,
  script: string,
  audioUrl: string
): Promise<Buffer> {
  const imagePath = path.join(tempDir, `${uuidv4()}.png`);
  const audioPath = path.join(tempDir, `${uuidv4()}.mp3`);
  const videoPath = path.join(tempDir, `${uuidv4()}.mp4`);

  try {
    console.log("Generating video for:", celebrity);
    console.log("Using audio from:", audioUrl);

    // Step 1: Generate Image using Stable Horde
    // const imageUrl = await generateImageFromStableHorde(celebrity);
    const imageUrl = "https://placehold.co/1920x1080.png";
    console.log("Image generated successfully:", imageUrl);

    // Step 2: Download image
    await downloadFile(imageUrl, imagePath);
    console.log("Image downloaded to:", imagePath);

    // Step 3: Download audio
    await downloadAudioFromS3(audioUrl, audioPath);
    console.log("Audio downloaded to:", audioPath);

    // Step 4: Generate video
    const videoBuffer = await createVideoFromImageAndAudio(imagePath, audioPath, videoPath);
    console.log("Video generated successfully");

    return videoBuffer;
  } catch (error) {
    console.error('Video generation error:', error);
    throw error;
  } finally {
    // Cleanup temp files
    [imagePath, audioPath, videoPath].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          console.error(`Failed to delete temporary file ${file}:`, e);
        }
      }
    });
  }
}

async function generateImageFromStableHorde(prompt: string): Promise<string> {
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

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer'
  });

  fs.writeFileSync(outputPath, Buffer.from(response.data));
}

async function downloadAudioFromS3(audioUrl: string, outputPath: string): Promise<void> {
  try {
    let bucket, key;

    if (audioUrl.startsWith('s3://')) {
      const parts = audioUrl.replace('s3://', '').split('/');
      bucket = parts[0];
      key = parts.slice(1).join('/');
    } else if (audioUrl.includes('s3.') && audioUrl.includes('amazonaws.com')) {
      const url = new URL(audioUrl);
      bucket = url.hostname.split('.')[0];
      key = url.pathname.substring(1);
    } else {
      bucket = process.env.AWS_S3_BUCKET || '';
      key = audioUrl;
    }

    if (!bucket) throw new Error('Could not determine S3 bucket from URL: ' + audioUrl);

    console.log(`Downloading from S3: bucket=${bucket}, key=${key}`);

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    if (!response.Body) throw new Error('S3 returned empty body');

    const chunks = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk);
    }

    fs.writeFileSync(outputPath, Buffer.concat(chunks));
  } catch (error) {
    console.error('Error downloading audio from S3:', error);
    throw error;
  }
}

async function createVideoFromImageAndAudio(
  imagePath: string, 
  audioPath: string, 
  outputPath: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(safePath(imagePath))
      .inputOptions([
        '-loop 1',
        '-framerate 30'
      ])
      .input(safePath(audioPath))
      .outputOptions([
        '-c:v libx264',
        '-tune stillimage',
        '-preset medium',
        '-crf 22',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        '-shortest',
        '-vf',
        'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        '-movflags +faststart'
      ])
      .output(safePath(outputPath))
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent?.toFixed(1)}% done`);
      })
      .on('end', () => {
        try {
          const videoBuffer = fs.readFileSync(outputPath);
          resolve(videoBuffer);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        console.error('Error during FFmpeg processing:', err);
        reject(err);
      })
      .run();
  });
}