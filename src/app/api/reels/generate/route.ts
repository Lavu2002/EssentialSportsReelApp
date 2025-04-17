import { NextResponse } from 'next/server';
import { generateSportsScript } from '@/lib/ai/generateScript';
import { textToSpeech } from '@/lib/ai/textToSpeech';
import { generateVideo } from '@/lib/ai/videoGen';
import { uploadToS3 } from '@/lib/aws/s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { celebrity } = await request.json();
    console.log("Starting generation for:", celebrity);

    // Validation
    if (!celebrity?.trim()) {
      throw new Error("Celebrity name is required");
    }

    // Step 1: Generate script
    const script = await generateSportsScript(celebrity);
    console.log("Script generated:", script.length, "chars");

    // Step 2: Generate audio
    const audioUrl = await textToSpeech(script);
    console.log("Audio generated:", audioUrl);

    // Step 3: Generate video (with buffer validation)
    const videoBuffer = await generateVideo(celebrity, script, audioUrl);
    
    if (!videoBuffer || videoBuffer.length === 0) {
      throw new Error("Empty video buffer generated");
    }
    console.log("Video buffer size:", videoBuffer.length, "bytes");

    // Step 4: Upload to S3 (with checksum)
    const s3Key = `reels/${celebrity.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}.mp4`;
    const s3Url = await uploadToS3(videoBuffer, s3Key);
    console.log("Uploaded to S3:", s3Url);

    // Step 5: Store metadata
    const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        id: { S: s3Key },
        celebrity: { S: celebrity },
        script: { S: script },
        url: { S: s3Url },
        createdAt: { S: new Date().toISOString() },
        status: { S: 'COMPLETED' },
        size: { N: videoBuffer.length.toString() } // Track file size
      }
    }));

    return NextResponse.json({
      success: true,
      url: s3Url,
      size: videoBuffer.length
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate reel',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}